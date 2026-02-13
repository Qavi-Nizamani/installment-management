-- Migration: activity_logs table and triggers for insert/update/delete on all tables
-- Description: Creates activity_logs, RLS, log_activity(), generic trigger function,
--              and AFTER triggers on tenants, members, plans, subscriptions, customers,
--              installment_plans, installments, capital_ledger, limits_usage, billing_webhook_events.

----------------------------------
-- 1. Create activity_logs table (tenant_id nullable for global tables)
----------------------------------
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    reference_id UUID,
    reference_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_tenant_id ON activity_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_reference ON activity_logs(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

----------------------------------
-- 2. RLS policies
----------------------------------
CREATE POLICY "Activity logs are viewable by tenant members" ON activity_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM members
            WHERE members.tenant_id = activity_logs.tenant_id
            AND members.user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Activity logs are viewable when global" ON activity_logs
    FOR SELECT
    USING (tenant_id IS NULL AND (SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Activity logs are insertable by tenant members" ON activity_logs
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM members
            WHERE members.tenant_id = activity_logs.tenant_id
            AND members.user_id = (SELECT auth.uid())
        )
    );

-- CREATE POLICY "Activity logs are insertable for global logs" ON activity_logs
--     FOR INSERT
--     WITH CHECK (tenant_id IS NULL AND (SELECT auth.uid()) IS NOT NULL);

----------------------------------
-- 3. log_activity (SECURITY DEFINER; allows NULL tenant_id)
----------------------------------
CREATE OR REPLACE FUNCTION log_activity(
    p_tenant_id UUID,
    p_action TEXT,
    p_reference_id UUID,
    p_reference_type TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO activity_logs (
        tenant_id,
        user_id,
        action,
        reference_id,
        reference_type,
        metadata
    ) VALUES (
        p_tenant_id,
        (SELECT auth.uid()),
        p_action,
        p_reference_id,
        p_reference_type,
        COALESCE(p_metadata, '{}'::jsonb)
    )
    RETURNING id INTO v_log_id;
    RETURN v_log_id;
END;
$$;

----------------------------------
-- 4. Generic trigger function for all tables
----------------------------------
CREATE OR REPLACE FUNCTION activity_log_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_tenant_id UUID;
    v_reference_id UUID;
    v_metadata JSONB := '{}'::jsonb;
BEGIN
    CASE TG_TABLE_NAME
        WHEN 'tenants' THEN
            IF TG_OP = 'DELETE' THEN
                v_tenant_id := OLD.id;
                v_reference_id := OLD.id;
            ELSE
                v_tenant_id := NEW.id;
                v_reference_id := NEW.id;
            END IF;
        WHEN 'members' THEN
            IF TG_OP = 'DELETE' THEN
                v_tenant_id := OLD.tenant_id;
                v_reference_id := OLD.id;
            ELSE
                v_tenant_id := NEW.tenant_id;
                v_reference_id := NEW.id;
            END IF;
        WHEN 'plans' THEN
            v_tenant_id := NULL;
            IF TG_OP = 'DELETE' THEN
                v_reference_id := OLD.id;
            ELSE
                v_reference_id := NEW.id;
            END IF;
        WHEN 'subscriptions' THEN
            IF TG_OP = 'DELETE' THEN
                v_tenant_id := OLD.tenant_id;
                v_reference_id := OLD.id;
            ELSE
                v_tenant_id := NEW.tenant_id;
                v_reference_id := NEW.id;
            END IF;
        WHEN 'customers' THEN
            IF TG_OP = 'DELETE' THEN
                v_tenant_id := OLD.tenant_id;
                v_reference_id := OLD.id;
            ELSE
                v_tenant_id := NEW.tenant_id;
                v_reference_id := NEW.id;
            END IF;
        WHEN 'installment_plans' THEN
            IF TG_OP = 'DELETE' THEN
                v_tenant_id := OLD.tenant_id;
                v_reference_id := OLD.id;
            ELSE
                v_tenant_id := NEW.tenant_id;
                v_reference_id := NEW.id;
            END IF;
        WHEN 'installments' THEN
            IF TG_OP = 'DELETE' THEN
                v_tenant_id := OLD.tenant_id;
                v_reference_id := OLD.id;
            ELSE
                v_tenant_id := NEW.tenant_id;
                v_reference_id := NEW.id;
            END IF;
        WHEN 'capital_ledger' THEN
            IF TG_OP = 'DELETE' THEN
                v_tenant_id := OLD.tenant_id;
                v_reference_id := OLD.id;
            ELSE
                v_tenant_id := NEW.tenant_id;
                v_reference_id := NEW.id;
            END IF;
        WHEN 'limits_usage' THEN
            IF TG_OP = 'DELETE' THEN
                v_tenant_id := OLD.tenant_id;
                v_reference_id := OLD.tenant_id;
            ELSE
                v_tenant_id := NEW.tenant_id;
                v_reference_id := NEW.tenant_id;
            END IF;
        WHEN 'billing_webhook_events' THEN
            v_tenant_id := NULL;
            v_reference_id := NULL;
            IF TG_OP = 'DELETE' THEN
                v_metadata := jsonb_build_object('id', OLD.id, 'event_type', OLD.event_type);
            ELSE
                v_metadata := jsonb_build_object('id', NEW.id, 'event_type', NEW.event_type);
            END IF;
        ELSE
            RETURN COALESCE(NEW, OLD);
    END CASE;

    PERFORM log_activity(v_tenant_id, TG_OP, v_reference_id, TG_TABLE_NAME, v_metadata);
    RETURN COALESCE(NEW, OLD);
END;
$$;

----------------------------------
-- 5. Attach AFTER triggers to each table
----------------------------------
DROP TRIGGER IF EXISTS activity_log_trigger ON tenants;
CREATE TRIGGER activity_log_trigger
    AFTER INSERT OR UPDATE OR DELETE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION activity_log_trigger();

DROP TRIGGER IF EXISTS activity_log_trigger ON members;
CREATE TRIGGER activity_log_trigger
    AFTER INSERT OR UPDATE OR DELETE ON members
    FOR EACH ROW
    EXECUTE FUNCTION activity_log_trigger();

DROP TRIGGER IF EXISTS activity_log_trigger ON plans;
CREATE TRIGGER activity_log_trigger
    AFTER INSERT OR UPDATE OR DELETE ON plans
    FOR EACH ROW
    EXECUTE FUNCTION activity_log_trigger();

DROP TRIGGER IF EXISTS activity_log_trigger ON subscriptions;
CREATE TRIGGER activity_log_trigger
    AFTER INSERT OR UPDATE OR DELETE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION activity_log_trigger();

DROP TRIGGER IF EXISTS activity_log_trigger ON customers;
CREATE TRIGGER activity_log_trigger
    AFTER INSERT OR UPDATE OR DELETE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION activity_log_trigger();

DROP TRIGGER IF EXISTS activity_log_trigger ON installment_plans;
CREATE TRIGGER activity_log_trigger
    AFTER INSERT OR UPDATE OR DELETE ON installment_plans
    FOR EACH ROW
    EXECUTE FUNCTION activity_log_trigger();

DROP TRIGGER IF EXISTS activity_log_trigger ON installments;
CREATE TRIGGER activity_log_trigger
    AFTER INSERT OR UPDATE OR DELETE ON installments
    FOR EACH ROW
    EXECUTE FUNCTION activity_log_trigger();

DROP TRIGGER IF EXISTS activity_log_trigger ON capital_ledger;
CREATE TRIGGER activity_log_trigger
    AFTER INSERT OR UPDATE OR DELETE ON capital_ledger
    FOR EACH ROW
    EXECUTE FUNCTION activity_log_trigger();

DROP TRIGGER IF EXISTS activity_log_trigger ON limits_usage;
CREATE TRIGGER activity_log_trigger
    AFTER INSERT OR UPDATE OR DELETE ON limits_usage
    FOR EACH ROW
    EXECUTE FUNCTION activity_log_trigger();

DROP TRIGGER IF EXISTS activity_log_trigger ON billing_webhook_events;
CREATE TRIGGER activity_log_trigger
    AFTER INSERT OR UPDATE OR DELETE ON billing_webhook_events
    FOR EACH ROW
    EXECUTE FUNCTION activity_log_trigger();
