/**
 * Shared CORS headers for all Edge Functions.
 *
 * Every Edge Function response must include these headers to allow
 * browser-based invocations via supabase.functions.invoke().
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}
