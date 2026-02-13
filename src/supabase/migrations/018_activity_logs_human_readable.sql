-- Migration: Human-readable activity log messages and actor email
-- Description: Adds message column, extends log_activity to accept message and store actor_email
--              in metadata, and updates activity_log_trigger to pass per-table/per-op messages.

----------------------------------
-- 1. Add message column to activity_logs
----------------------------------
ALTER TABLE activity_logs
ADD COLUMN IF NOT EXISTS message TEXT;

----------------------------------
-- 2. Extend log_activity: accept p_message, look up actor email, merge into metadata
----------------------------------
CREATE OR REPLACE FUNCTION log_activity(
    p_tenant_id UUID,
    p_action TEXT,
    p_reference_id UUID,
    p_reference_type TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_log_id UUID;
    v_email TEXT;
BEGIN
    SELECT email INTO v_email
    FROM auth.users
    WHERE id = auth.uid();

    INSERT INTO activity_logs (
        tenant_id,
        user_id,
        action,
        reference_id,
        reference_type,
        metadata,
        message
    ) VALUES (
        p_tenant_id,
        auth.uid(),
        p_action,
        p_reference_id,
        p_reference_type,
        COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object('actor_email', COALESCE(v_email, 'System')),
        p_message
    )
    RETURNING id INTO v_log_id;
    RETURN v_log_id;
END;
$$;

----------------------------------
-- 3. Update activity_log_trigger: build v_message per table/op, pass to log_activity
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
    v_message TEXT;
BEGIN
    v_message := NULL;

    CASE TG_TABLE_NAME
        WHEN 'tenants' THEN
            IF TG_OP = 'DELETE' THEN
                v_tenant_id := OLD.id;
                v_reference_id := OLD.id;
                v_message := 'Workspace deleted';
            ELSIF TG_OP = 'UPDATE' THEN
                v_tenant_id := NEW.id;
                v_reference_id := NEW.id;
                v_message := 'Workspace updated';
            ELSE
                v_tenant_id := NEW.id;
                v_reference_id := NEW.id;
                v_message := 'Workspace created';
            END IF;
        WHEN 'members' THEN
            IF TG_OP = 'DELETE' THEN
                v_tenant_id := OLD.tenant_id;
                v_reference_id := OLD.id;
                v_message := 'Member removed';
            ELSIF TG_OP = 'UPDATE' THEN
                v_tenant_id := NEW.tenant_id;
                v_reference_id := NEW.id;
                v_message := 'Member updated';
            ELSE
                v_tenant_id := NEW.tenant_id;
                v_reference_id := NEW.id;
                v_message := 'Member added';
            END IF;
        WHEN 'plans' THEN
            v_tenant_id := NULL;
            IF TG_OP = 'DELETE' THEN
                v_reference_id := OLD.id;
                v_message := 'Plan deleted';
            ELSIF TG_OP = 'UPDATE' THEN
                v_reference_id := NEW.id;
                v_message := 'Plan updated';
            ELSE
                v_reference_id := NEW.id;
                v_message := 'Plan created';
            END IF;
        WHEN 'subscriptions' THEN
            IF TG_OP = 'DELETE' THEN
                v_tenant_id := OLD.tenant_id;
                v_reference_id := OLD.id;
                v_message := 'Subscription deleted';
            ELSIF TG_OP = 'UPDATE' THEN
                v_tenant_id := NEW.tenant_id;
                v_reference_id := NEW.id;
                v_message := 'Subscription updated';
            ELSE
                v_tenant_id := NEW.tenant_id;
                v_reference_id := NEW.id;
                v_message := 'Subscription created';
            END IF;
        WHEN 'customers' THEN
            IF TG_OP = 'DELETE' THEN
                v_tenant_id := OLD.tenant_id;
                v_reference_id := OLD.id;
                v_message := 'Customer "' || COALESCE(OLD.name, '') || '" deleted';
            ELSIF TG_OP = 'UPDATE' THEN
                v_tenant_id := NEW.tenant_id;
                v_reference_id := NEW.id;
                v_message := 'Customer "' || COALESCE(NEW.name, '') || '" updated';
            ELSE
                v_tenant_id := NEW.tenant_id;
                v_reference_id := NEW.id;
                v_message := 'Customer "' || COALESCE(NEW.name, '') || '" created';
            END IF;
        WHEN 'installment_plans' THEN
            IF TG_OP = 'DELETE' THEN
                v_tenant_id := OLD.tenant_id;
                v_reference_id := OLD.id;
                v_message := 'Installment plan "' || COALESCE(OLD.title, '') || '" deleted';
            ELSIF TG_OP = 'UPDATE' THEN
                v_tenant_id := NEW.tenant_id;
                v_reference_id := NEW.id;
                v_message := 'Installment plan "' || COALESCE(NEW.title, '') || '" updated';
            ELSE
                v_tenant_id := NEW.tenant_id;
                v_reference_id := NEW.id;
                v_message := 'Installment plan "' || COALESCE(NEW.title, '') || '" created';
            END IF;
        WHEN 'installments' THEN
            IF TG_OP = 'DELETE' THEN
                v_tenant_id := OLD.tenant_id;
                v_reference_id := OLD.id;
                v_message := 'Installment deleted';
            ELSIF TG_OP = 'UPDATE' THEN
                v_tenant_id := NEW.tenant_id;
                v_reference_id := NEW.id;
                v_message := 'Installment updated';
            ELSE
                v_tenant_id := NEW.tenant_id;
                v_reference_id := NEW.id;
                v_message := 'Payment recorded';
            END IF;
        WHEN 'capital_ledger' THEN
            IF TG_OP = 'DELETE' THEN
                v_tenant_id := OLD.tenant_id;
                v_reference_id := OLD.id;
                v_message := 'Capital entry removed';
            ELSIF TG_OP = 'UPDATE' THEN
                v_tenant_id := NEW.tenant_id;
                v_reference_id := NEW.id;
                v_message := 'Capital entry updated';
            ELSE
                v_tenant_id := NEW.tenant_id;
                v_reference_id := NEW.id;
                v_message := 'Capital entry added';
            END IF;
        WHEN 'limits_usage' THEN
            IF TG_OP = 'DELETE' THEN
                v_tenant_id := OLD.tenant_id;
                v_reference_id := OLD.tenant_id;
                v_message := 'Limits updated';
            ELSIF TG_OP = 'UPDATE' THEN
                v_tenant_id := NEW.tenant_id;
                v_reference_id := NEW.tenant_id;
                v_message := 'Limits updated';
            ELSE
                v_tenant_id := NEW.tenant_id;
                v_reference_id := NEW.tenant_id;
                v_message := 'Limits updated';
            END IF;
        WHEN 'billing_webhook_events' THEN
            v_tenant_id := NULL;
            v_reference_id := NULL;
            IF TG_OP = 'DELETE' THEN
                v_metadata := jsonb_build_object('id', OLD.id, 'event_type', OLD.event_type);
                v_message := 'Webhook event deleted';
            ELSIF TG_OP = 'UPDATE' THEN
                v_metadata := jsonb_build_object('id', NEW.id, 'event_type', NEW.event_type);
                v_message := 'Webhook processed';
            ELSE
                v_metadata := jsonb_build_object('id', NEW.id, 'event_type', NEW.event_type);
                v_message := 'Webhook processed';
            END IF;
        ELSE
            RETURN COALESCE(NEW, OLD);
    END CASE;

    PERFORM log_activity(v_tenant_id, TG_OP, v_reference_id, TG_TABLE_NAME, v_metadata, v_message);
    RETURN COALESCE(NEW, OLD);
END;
$$;
