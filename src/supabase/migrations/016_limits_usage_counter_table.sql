-- Migration: limits_usage counter table for O(1) installment plan limit check
-- Description: Add limits_usage(tenant_id, active_installment_plans), maintained by
--              triggers on installments. RLS helper and RPC read the counter instead of COUNT.

-- 1. Create limits_usage table
CREATE TABLE limits_usage (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  active_installment_plans INT NOT NULL DEFAULT 0
);

ALTER TABLE limits_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "limits_usage_select_own_tenant" ON limits_usage
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.user_id = (SELECT auth.uid())
        AND m.tenant_id = limits_usage.tenant_id
    )
  );

-- 2. Backfill: one row per tenant with correct active plan count (or 0)
INSERT INTO limits_usage (tenant_id, active_installment_plans)
SELECT tenant_id, COUNT(DISTINCT installment_plan_id)::int
FROM installments
WHERE status != 'PAID'
GROUP BY tenant_id
ON CONFLICT (tenant_id) DO UPDATE SET active_installment_plans = EXCLUDED.active_installment_plans;

INSERT INTO limits_usage (tenant_id, active_installment_plans)
SELECT id, 0 FROM tenants
ON CONFLICT (tenant_id) DO NOTHING;

-- 3. Trigger on tenants: new tenant gets a limits_usage row with 0
CREATE OR REPLACE FUNCTION limits_usage_on_tenant_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO limits_usage (tenant_id, active_installment_plans)
  VALUES (NEW.id, 0);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS limits_usage_on_tenant_insert_trigger ON tenants;
CREATE TRIGGER limits_usage_on_tenant_insert_trigger
  AFTER INSERT ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION limits_usage_on_tenant_insert();

-- 4. Trigger on installments: keep active_installment_plans in sync
CREATE OR REPLACE FUNCTION sync_limits_usage_active_installment_plans()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_other_non_paid INT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status != 'PAID' THEN
      SELECT COUNT(*)::int INTO v_other_non_paid
      FROM installments
      WHERE installment_plan_id = NEW.installment_plan_id
        AND status != 'PAID'
        AND id != NEW.id;
      IF v_other_non_paid = 0 THEN
        UPDATE limits_usage
        SET active_installment_plans = active_installment_plans + 1
        WHERE tenant_id = NEW.tenant_id;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      IF OLD.status != 'PAID' AND NEW.status = 'PAID' THEN
        SELECT COUNT(*)::int INTO v_other_non_paid
        FROM installments
        WHERE installment_plan_id = OLD.installment_plan_id
          AND status != 'PAID'
          AND id != OLD.id;
        IF v_other_non_paid = 0 THEN
          UPDATE limits_usage
          SET active_installment_plans = GREATEST(0, active_installment_plans - 1)
          WHERE tenant_id = OLD.tenant_id;
        END IF;
      ELSIF OLD.status = 'PAID' AND NEW.status != 'PAID' THEN
        SELECT COUNT(*)::int INTO v_other_non_paid
        FROM installments
        WHERE installment_plan_id = NEW.installment_plan_id
          AND status != 'PAID'
          AND id != NEW.id;
        IF v_other_non_paid = 0 THEN
          UPDATE limits_usage
          SET active_installment_plans = active_installment_plans + 1
          WHERE tenant_id = NEW.tenant_id;
        END IF;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status != 'PAID' THEN
      SELECT COUNT(*)::int INTO v_other_non_paid
      FROM installments
      WHERE installment_plan_id = OLD.installment_plan_id
        AND status != 'PAID'
        AND id != OLD.id;
      IF v_other_non_paid = 0 THEN
        UPDATE limits_usage
        SET active_installment_plans = GREATEST(0, active_installment_plans - 1)
        WHERE tenant_id = OLD.tenant_id;
      END IF;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS sync_limits_usage_active_installment_plans_trigger ON installments;
CREATE TRIGGER sync_limits_usage_active_installment_plans_trigger
  AFTER INSERT OR UPDATE OF status OR DELETE ON installments
  FOR EACH ROW
  EXECUTE FUNCTION sync_limits_usage_active_installment_plans();

-- 5. RLS helper: use limits_usage instead of COUNT subquery
CREATE OR REPLACE FUNCTION tenant_can_create_installment_plan(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM subscriptions s
    JOIN plans p ON p.id = s.plan_id
    LEFT JOIN limits_usage lu ON lu.tenant_id = s.tenant_id
    WHERE s.tenant_id = p_tenant_id
      AND s.status IN ('active', 'trialing')
      AND (
        p.active_plan_limit IS NULL
        OR COALESCE(lu.active_installment_plans, 0) < p.active_plan_limit
      )
  );
$$;

-- 6. RPC: use limits_usage and fix subscription predicate
CREATE OR REPLACE FUNCTION create_installment_plan_with_limit(
  p_tenant_id UUID,
  p_customer_id UUID,
  p_title TEXT,
  p_total_price NUMERIC,
  p_upfront_paid NUMERIC,
  p_finance_amount NUMERIC,
  p_monthly_percentage NUMERIC,
  p_total_months INT,
  p_start_date DATE,
  p_business_model TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS installment_plans
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_plan_limit INT;
  v_active_count INT;
  v_plan installment_plans;
BEGIN

  -- Customer ownership validation
  IF NOT EXISTS (
    SELECT 1
    FROM customers
    WHERE id = p_customer_id
      AND tenant_id = p_tenant_id
  ) THEN
    RAISE EXCEPTION
      USING ERRCODE = 'P0001',
            MESSAGE = 'CUSTOMER_NOT_FOUND';
  END IF;

  -- Fetch active subscription plan limit (fixed: AND (s.status IN (...)))
  SELECT p.active_plan_limit
  INTO v_plan_limit
  FROM subscriptions s
  JOIN plans p ON p.id = s.plan_id
  WHERE s.tenant_id = p_tenant_id
    AND s.status IN ('active', 'trialing')
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      USING ERRCODE = 'P0001',
            MESSAGE = 'NO_ACTIVE_SUBSCRIPTION';
  END IF;

  -- Enforce active plan limit using limits_usage (NULL = unlimited)
  IF v_plan_limit IS NOT NULL THEN
    SELECT COALESCE(lu.active_installment_plans, 0) INTO v_active_count
    FROM limits_usage lu
    WHERE lu.tenant_id = p_tenant_id;

    IF NOT FOUND THEN
      v_active_count := 0;
    END IF;

    IF v_active_count >= v_plan_limit THEN
      RAISE EXCEPTION
        USING ERRCODE = 'P0001',
              MESSAGE = 'PLAN_LIMIT_EXCEEDED',
              DETAIL = format(
                'Active plans: %s / %s',
                v_active_count,
                v_plan_limit
              );
    END IF;
  END IF;

  -- Create installment plan
  INSERT INTO installment_plans (
    tenant_id,
    customer_id,
    title,
    total_price,
    upfront_paid,
    finance_amount,
    monthly_percentage,
    total_months,
    start_date,
    business_model,
    notes
  )
  VALUES (
    p_tenant_id,
    p_customer_id,
    p_title,
    p_total_price,
    p_upfront_paid,
    p_finance_amount,
    p_monthly_percentage,
    p_total_months,
    p_start_date,
    p_business_model,
    p_notes
  )
  RETURNING * INTO v_plan;

  RETURN v_plan;
END;
$$;
