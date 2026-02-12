-- Migration: Installment plans insert requires active/trialing subscription and plan limit
-- Description: Add RLS so INSERT into installment_plans is allowed only when the tenant
--              has an active or trialing subscription AND is under the plan's active_plan_limit.
--              Uses a helper function (same pattern as customers in 014).

-- Function: true if the tenant can create a new installment plan (subscription + under limit)
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
    WHERE s.tenant_id = p_tenant_id
      AND s.status IN ('active', 'trialing')
      AND (
        p.active_plan_limit IS NULL
        OR (
          SELECT COUNT(*)
          FROM installment_plans ip
          WHERE ip.tenant_id = p_tenant_id
            AND EXISTS (
              SELECT 1
              FROM installments i
              WHERE i.installment_plan_id = ip.id
                AND i.status != 'PAID'
            )
        ) < p.active_plan_limit
      )
  );
$$;

-- Drop existing insert policy so we can recreate it with subscription + limit check
DROP POLICY IF EXISTS "Installment plans are insertable by tenant members" ON installment_plans;

-- Recreate: tenant member AND tenant has active/trialing subscription AND under plan limit
CREATE POLICY "Installment plans are insertable by tenant members" ON installment_plans
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.user_id = (SELECT auth.uid())
        AND m.tenant_id = installment_plans.tenant_id
    )
    AND tenant_can_create_installment_plan(installment_plans.tenant_id)
  );
