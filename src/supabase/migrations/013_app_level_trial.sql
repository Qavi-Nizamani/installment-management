-- Migration: App-level trial for new tenants
-- Description: New tenants get a 14-day trialing subscription (no credit card required).
-- Tenant is created only after email confirmation (auth callback -> create_tenant).
-- Trial expiration is enforced at app level; Lemon Squeezy is used only when converting to paid.

-- Update create_tenant: create trialing subscription with trial_start/trial_end
CREATE OR REPLACE FUNCTION create_tenant(p_name TEXT)
RETURNS tenants
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_tenant tenants;
    v_free_plan_id UUID;
BEGIN
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

    INSERT INTO subscriptions (tenant_id, plan_id, status, current_period_start, current_period_end, trial_start, trial_end)
    VALUES (v_tenant.id, v_free_plan_id, 'trialing', now(), NULL, now(), now() + interval '60 days');

    RETURN v_tenant;
END;
$$;