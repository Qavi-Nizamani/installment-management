-- Migration: Set plan limits for subscription tiers
-- Date: 2026-02-06
-- Description: Enforce FREE/STARTER limits and PRO unlimited

INSERT INTO plans (code, active_plan_limit, price_pkr, billing_period)
VALUES
  ('FREE', 10, 0, 'monthly'),
  ('STARTER', 100, 2500, 'monthly'),
  ('PRO', NULL, 6000, 'monthly')
ON CONFLICT (code) DO UPDATE
SET active_plan_limit = EXCLUDED.active_plan_limit;
