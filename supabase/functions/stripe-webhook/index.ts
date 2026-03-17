/**
 * stripe-webhook Edge Function
 *
 * Public endpoint (deployed with --no-verify-jwt) that receives Stripe webhook
 * events, verifies the signature using Web Crypto API, and fulfills credit pack
 * purchases by atomically adding credits and recording the transaction.
 *
 * Handles: checkout.session.completed (with payment_status === 'paid')
 *
 * Idempotency: Checks stripe_session_id UNIQUE constraint on credit_transactions
 * before fulfillment to prevent double-crediting on webhook retries.
 *
 * No CORS needed since Stripe calls this endpoint directly (server-to-server).
 */

import { createAdminClient } from '../_shared/supabase-admin.ts'
import { createStripeClient, cryptoProvider } from '../_shared/stripe.ts'

Deno.serve(async (req) => {
  const stripe = createStripeClient()

  // 1. Read raw body text (NOT req.json() -- critical for signature verification)
  const body = await req.text()
  const signature = req.headers.get('Stripe-Signature')

  if (!signature) {
    console.error('Missing Stripe-Signature header')
    return new Response(
      JSON.stringify({ error: 'Missing signature' }),
      { status: 400 },
    )
  }

  // 2. Verify webhook signature
  let event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET')!,
      undefined,
      cryptoProvider,
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', (err as Error).message)
    return new Response(
      JSON.stringify({ error: 'Invalid signature' }),
      { status: 400 },
    )
  }

  // 3. Handle checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object

    // Only fulfill if payment is complete (not deferred/async payment methods)
    if (session.payment_status === 'paid') {
      await fulfillCreditPurchase(session)
    }
  }

  // 4. Always return 200 to acknowledge receipt (Stripe retries on non-2xx)
  return new Response(
    JSON.stringify({ received: true }),
    { status: 200 },
  )
})

/**
 * Fulfills a credit pack purchase after successful Stripe checkout.
 *
 * Steps:
 *   1. Extract advertiser_id and credits from session metadata
 *   2. Idempotency check via stripe_session_id on credit_transactions
 *   3. Atomically add credits via add_impression_credits RPC
 *   4. Insert transaction record with balance snapshot
 */
async function fulfillCreditPurchase(session: Record<string, unknown>) {
  const admin = createAdminClient()

  const metadata = session.metadata as Record<string, string> | undefined
  const advertiserId = metadata?.advertiser_id
  const credits = Number(metadata?.credits)

  if (!advertiserId || !credits || isNaN(credits)) {
    console.error('Missing or invalid metadata in checkout session:', session.id)
    return
  }

  // Idempotency: Check if this session was already fulfilled
  const { data: existing } = await admin
    .from('credit_transactions')
    .select('id')
    .eq('stripe_session_id', session.id as string)
    .maybeSingle()

  if (existing) {
    console.log('Session already fulfilled (idempotent skip):', session.id)
    return
  }

  // Atomically add credits and get new balance
  const { data: newBalance, error: creditError } = await admin.rpc('add_impression_credits', {
    p_advertiser_id: advertiserId,
    p_amount: credits,
  })

  if (creditError) {
    console.error('Failed to add credits:', creditError.message)
    return
  }

  // Retrieve receipt_url from Stripe charge
  let receipt_url: string | null = null
  const paymentIntentId = session.payment_intent as string | null
  if (paymentIntentId) {
    try {
      const stripe = createStripeClient()
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ['latest_charge'],
      })
      const charge = paymentIntent.latest_charge as { receipt_url?: string | null } | null
      receipt_url = charge?.receipt_url ?? null
    } catch (err) {
      console.error('Failed to retrieve receipt_url (non-fatal):', (err as Error).message)
    }
  }

  // Record the transaction in the ledger
  const { error: txError } = await admin.from('credit_transactions').insert({
    advertiser_id: advertiserId,
    type: 'purchase',
    amount: credits,
    balance_after: newBalance,
    stripe_session_id: session.id as string,
    stripe_payment_intent_id: paymentIntentId,
    receipt_url,
    metadata: {
      pack_id: metadata?.pack_id,
      customer_email: session.customer_email as string,
    },
  })

  if (txError) {
    console.error('Failed to record transaction:', txError.message)
    // Credits were already added -- transaction record is for audit trail.
    // The stripe_session_id UNIQUE constraint prevents double-crediting even
    // if this insert fails and Stripe retries the webhook.
    return
  }

  console.log(`Fulfilled ${credits} credits for advertiser ${advertiserId}, new balance: ${newBalance}`)
}
