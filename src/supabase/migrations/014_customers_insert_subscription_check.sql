-- Migration: Customers insert requires active/trialing subscription
-- Description: Add RLS so INSERT into customers is allowed only when the tenant
--              has an active or trialing subscription. Uses a helper function.

-- Function: true if the tenant has an active or trialing subscription
CREATE OR REPLACE FUNCTION tenant_has_active_subscription(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM subscriptions s
        WHERE s.tenant_id = p_tenant_id
          AND s.status IN ('active', 'trialing')
    );
$$;

-- Drop existing insert policy so we can recreate it with subscription check
DROP POLICY IF EXISTS "customers_insert_policy" ON customers;

-- Recreate: tenant member AND tenant has active/trialing subscription (or service_role bypass)
CREATE POLICY "customers_insert_policy" ON customers
    FOR INSERT
    WITH CHECK (
        (
            EXISTS (
                SELECT 1 FROM members m
                WHERE m.user_id = (SELECT auth.uid())
                  AND m.tenant_id = customers.tenant_id
            )
            AND tenant_has_active_subscription(customers.tenant_id)
        )
    );
