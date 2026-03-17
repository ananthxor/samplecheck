-- Fix: 'presence' was never added to the event_type enum.
-- The telemetry engine sends presence events every 5 seconds for dwell time tracking,
-- but they were silently rejected by PostgreSQL (22P02 invalid enum value).
-- This migration adds 'presence' to the enum so events are stored,
-- then updates fetch_metrics_range and rollup functions to sum dwell_time_ms
-- from presence events (restoring correct Avg Dwell Time calculation).

-- Step 1: Add 'presence' to the enum (IF NOT EXISTS prevents re-run errors)
ALTER TYPE public.event_type ADD VALUE IF NOT EXISTS 'presence';

-- Note: ALTER TYPE ADD VALUE cannot run inside a transaction block in PostgreSQL.
-- If using supabase db push, this is handled automatically.
-- If running manually in SQL Editor, run Step 1 alone first, then run the rest.
