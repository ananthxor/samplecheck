/**
 * create-checkout Edge Function
 *
 * Authenticated endpoint that creates a Stripe Checkout Session for one-time
 * credit pack purchases. Returns the Stripe-hosted checkout page URL for
 * client-side redirect.
 *
 * Request: POST { packId: '50k' | '200k' | '1m' }
 * Response: { url: string }
 *
 * Authentication: JWT from Authorization header verified via auth.getUser(jwt)
 * (same pattern as admin Edge Functions from Phase 2).
 *
 * Deployed WITHOUT --no-verify-jwt (unlike serving functions) since this
 * endpoint requires authenticated users.
 */

import { createAdminClient } from '../_shared/supabase-admin.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createStripeClient, CREDIT_PACKS, type PackId } from '../_shared/stripe.ts'

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // 1. Extract and verify JWT from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const jwt = authHeader.replace('Bearer ', '')
    const admin = createAdminClient()

    const {
      data: { user },
      error: authError,
    } = await admin.auth.getUser(jwt)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // 2. Get advertiser_id from user_profiles via auth_user_id lookup
    const { data: profile, error: profileError } = await admin
      .from('user_profiles')
      .select('advertiser_id')
      .eq('auth_user_id', user.id)
      .single()

    if (profileError || !profile?.advertiser_id) {
      return new Response(
        JSON.stringify({ error: 'No advertiser account linked to this user' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // 3. Parse packId from request body and validate against CREDIT_PACKS
    const { packId } = await req.json() as { packId: string }
    const pack = CREDIT_PACKS[packId as PackId]

    if (!pack) {
      return new Response(
        JSON.stringify({ error: `Invalid pack selection: ${packId}. Valid options: ${Object.keys(CREDIT_PACKS).join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // 4. Get advertiser contact_email for Stripe customer_email field
    const { data: advertiser } = await admin
      .from('advertisers')
      .select('contact_email')
      .eq('id', profile.advertiser_id)
      .single()

    // 5. Create Stripe Checkout Session
    const stripe = createStripeClient()
    const origin = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/$/, '') || ''

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: pack.priceId, quantity: 1 }],
      success_url: `${origin}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/billing?canceled=true`,
      client_reference_id: profile.advertiser_id,
      customer_email: advertiser?.contact_email || user.email,
      metadata: {
        advertiser_id: profile.advertiser_id,
        credits: String(pack.credits),
        pack_id: packId,
      },
    })

    // 6. Return session URL for client-side redirect
    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('create-checkout error:', err)
    const message = err instanceof Error ? err.message : 'Internal error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
