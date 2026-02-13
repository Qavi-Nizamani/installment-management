-- Migration: Trial expiry cron job
-- Description: Schedule pg_cron to update trialing subscriptions to expired when trial_end has passed.
-- Prerequisite: Enable pg_cron via Supabase Dashboard > Integrations > Cron if migration fails with permission error.

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Function to expire trials: update status from trialing to expired when trial_end < now()
CREATE OR REPLACE FUNCTION expire_trials()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE subscriptions
  SET status = 'expired', expired_at = COALESCE(expired_at, now()), updated_at = now()
  WHERE status = 'trialing'
    AND trial_end IS NOT NULL
    AND trial_end < now();
END;
$$;

-- Schedule job to run every hour at minute 0
SELECT cron.schedule(
  'expire-trials',
  '0 */6 * * *',
  'SELECT expire_trials()'
);
