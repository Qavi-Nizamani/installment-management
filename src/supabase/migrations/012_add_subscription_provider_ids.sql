-- Migration: Add provider subscription identifiers
-- Date: 2026-02-07
-- Description: Track Lemon Squeezy provider identifiers on subscriptions

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS provider_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_product_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_variant_id TEXT;

CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_subscription_id
  ON subscriptions(provider_subscription_id);
