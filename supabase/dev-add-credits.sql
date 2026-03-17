-- ============================================================
-- DEV HELPER: Inspect data and top up impression credits
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Step 1: See your advertisers and current credit balance
SELECT id, name, credit_balance
FROM public.advertisers
ORDER BY created_at DESC;

-- Step 2: See your creatives (make sure has_rendered_html = true)
SELECT
  id,
  name,
  format_id,
  status,
  width,
  height,
  rendered_html IS NOT NULL AS has_rendered_html
FROM public.creatives
ORDER BY created_at DESC;

-- Step 3: Top up credits on your advertiser
--         Replace the UUID below with your advertiser id from Step 1
-- UPDATE public.advertisers
-- SET credit_balance = credit_balance + 10000
-- WHERE id = 'YOUR-ADVERTISER-UUID-HERE';
