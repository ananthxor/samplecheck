/**
 * Shared Stripe client factory and credit pack configuration.
 *
 * Used by create-checkout and stripe-webhook Edge Functions.
 * Stripe SDK imported via esm.sh with denonext target for Deno compatibility
 * (official Supabase pattern).
 */
import Stripe from 'https://esm.sh/stripe@14?target=denonext'

/**
 * Creates a Stripe client using the secret API key from environment.
 * Uses API version 2024-11-20 (matching official Supabase example).
 */
export function createStripeClient() {
  return new Stripe(Deno.env.get('STRIPE_API_KEY')!, {
    apiVersion: '2024-11-20',
  })
}

/**
 * Crypto provider for webhook signature verification using Deno's Web Crypto API.
 * Required for constructEventAsync() in Deno runtime (no Node.js crypto available).
 */
export const cryptoProvider = Stripe.createSubtleCryptoProvider()

/**
 * Credit pack definitions.
 * Price IDs come from Stripe Dashboard and are stored as environment variables
 * so test/live environments use different IDs.
 */
export const CREDIT_PACKS = {
  '50k': {
    credits: 50000,
    label: '50,000 Impressions',
    priceId: Deno.env.get('STRIPE_PRICE_50K')!,
  },
  '200k': {
    credits: 200000,
    label: '200,000 Impressions',
    priceId: Deno.env.get('STRIPE_PRICE_200K')!,
  },
  '1m': {
    credits: 1000000,
    label: '1,000,000 Impressions',
    priceId: Deno.env.get('STRIPE_PRICE_1M')!,
  },
} as const

export type PackId = keyof typeof CREDIT_PACKS
