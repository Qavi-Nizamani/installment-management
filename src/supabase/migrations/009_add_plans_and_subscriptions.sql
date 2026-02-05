-- Migration: Add plans and subscriptions tables
-- Date: 2026-02-05
-- Description: Base tables for pricing plans and tenant subscriptions

CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE CHECK (code IN ('FREE', 'STARTER', 'PRO')),
  active_plan_limit INT,
  price_pkr NUMERIC(12,2) NOT NULL DEFAULT 0,
  billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  plan_id UUID REFERENCES plans(id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled')),
  current_period_start TIMESTAMPTZ DEFAULT now(),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);

-- Enable Row Level Security
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for plans (read-only for authenticated users)
CREATE POLICY "plans_select_policy" ON plans
  FOR SELECT
  USING (true);

-- RLS policies for subscriptions
CREATE POLICY "subscriptions_select_policy" ON subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.user_id = auth.uid()
      AND m.tenant_id = subscriptions.tenant_id
    )
  );

CREATE POLICY "subscriptions_insert_policy" ON subscriptions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.user_id = auth.uid()
      AND m.tenant_id = subscriptions.tenant_id
      AND m.role = 'OWNER'
    )
  );

CREATE POLICY "subscriptions_update_policy" ON subscriptions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.user_id = auth.uid()
      AND m.tenant_id = subscriptions.tenant_id
      AND m.role = 'OWNER'
    )
  );

CREATE POLICY "subscriptions_delete_policy" ON subscriptions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.user_id = auth.uid()
      AND m.tenant_id = subscriptions.tenant_id
      AND m.role = 'OWNER'
    )
  );

-- Updated_at trigger for subscriptions
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed initial plans
INSERT INTO plans (code, active_plan_limit, price_pkr, billing_period)
VALUES
  ('FREE', NULL, 0, 'monthly'),
  ('STARTER', NULL, 2999, 'monthly'),
  ('PRO', NULL, 6000, 'monthly')
ON CONFLICT (code) DO NOTHING;

-- Ensure create_tenant also creates a default subscription
CREATE OR REPLACE FUNCTION create_tenant(p_name TEXT)
RETURNS tenants
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant tenants;
  v_free_plan_id UUID;
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO tenants (name)
  VALUES (p_name)
  RETURNING * INTO v_tenant;

  INSERT INTO members (user_id, tenant_id, role)
  VALUES (auth.uid(), v_tenant.id, 'OWNER');

  SELECT id INTO v_free_plan_id FROM plans WHERE code = 'FREE';
  IF v_free_plan_id IS NULL THEN
    INSERT INTO plans (code, active_plan_limit, price_pkr, billing_period)
    VALUES ('FREE', NULL, 0, 'monthly')
    RETURNING id INTO v_free_plan_id;
  END IF;

  INSERT INTO subscriptions (tenant_id, plan_id, status, current_period_start, current_period_end)
  VALUES (v_tenant.id, v_free_plan_id, 'active', now(), NULL);

  RETURN v_tenant;
END;
$$;
