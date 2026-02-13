-- Migration: Drop message column; use metadata-only; rich installment metadata
-- Description: log_activity back to 5 params; trigger builds metadata for installments
--              (installment_number, customer_id, customer_name, old/new amount, due_date, status).

----------------------------------
-- 1. Drop message column
----------------------------------
ALTER TABLE activity_logs
DROP COLUMN IF EXISTS message;

----------------------------------
-- 2. log_activity: 5 parameters, no message; actor_email in metadata
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
        metadata
    ) VALUES (
        p_tenant_id,
        auth.uid(),
        p_action,
        p_reference_id,
        p_reference_type,
        COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object('actor_email', COALESCE(v_email, 'System'))
    )
    RETURNING id INTO v_log_id;
    RETURN v_log_id;
END;
$$;

----------------------------------
-- 3. activity_log_trigger: no v_message; rich metadata for installments only
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
    -- For installments
    v_installment_number INT;
    v_customer_id UUID;
    v_customer_name TEXT;
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
                SELECT (SELECT COUNT(*)::int FROM installments i WHERE i.installment_plan_id = OLD.installment_plan_id AND (i.due_date < OLD.due_date OR (i.due_date = OLD.due_date AND i.id <= OLD.id))) INTO v_installment_number;
                SELECT ip.customer_id, c.name INTO v_customer_id, v_customer_name FROM installment_plans ip JOIN customers c ON c.id = ip.customer_id WHERE ip.id = OLD.installment_plan_id;
                v_metadata := jsonb_build_object(
                    'installment_number', COALESCE(v_installment_number, 0),
                    'customer_id', v_customer_id,
                    'customer_name', COALESCE(v_customer_name, ''),
                    'old_amount', OLD.amount_due,
                    'old_due_date', OLD.due_date::text,
                    'old_status', OLD.status,
                    'old_amount_paid', OLD.amount_paid
                );
            ELSIF TG_OP = 'UPDATE' THEN
                v_tenant_id := NEW.tenant_id;
                v_reference_id := NEW.id;
                SELECT (SELECT COUNT(*)::int FROM installments i WHERE i.installment_plan_id = NEW.installment_plan_id AND (i.due_date < NEW.due_date OR (i.due_date = NEW.due_date AND i.id <= NEW.id))) INTO v_installment_number;
                SELECT ip.customer_id, c.name INTO v_customer_id, v_customer_name FROM installment_plans ip JOIN customers c ON c.id = ip.customer_id WHERE ip.id = NEW.installment_plan_id;
                v_metadata := jsonb_build_object(
                    'installment_number', COALESCE(v_installment_number, 0),
                    'customer_id', v_customer_id,
                    'customer_name', COALESCE(v_customer_name, ''),
                    'old_amount', OLD.amount_due,
                    'new_amount', NEW.amount_due,
                    'old_due_date', OLD.due_date::text,
                    'new_due_date', NEW.due_date::text,
                    'old_status', OLD.status,
                    'new_status', NEW.status,
                    'old_amount_paid', OLD.amount_paid,
                    'new_amount_paid', NEW.amount_paid
                );
            ELSE
                v_tenant_id := NEW.tenant_id;
                v_reference_id := NEW.id;
                SELECT (SELECT COUNT(*)::int FROM installments i WHERE i.installment_plan_id = NEW.installment_plan_id AND (i.due_date < NEW.due_date OR (i.due_date = NEW.due_date AND i.id <= NEW.id))) INTO v_installment_number;
                SELECT ip.customer_id, c.name INTO v_customer_id, v_customer_name FROM installment_plans ip JOIN customers c ON c.id = ip.customer_id WHERE ip.id = NEW.installment_plan_id;
                v_metadata := jsonb_build_object(
                    'installment_number', COALESCE(v_installment_number, 0),
                    'customer_id', v_customer_id,
                    'customer_name', COALESCE(v_customer_name, ''),
                    'amount_due', NEW.amount_due,
                    'due_date', NEW.due_date::text,
                    'status', NEW.status,
                    'amount_paid', NEW.amount_paid
                );
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
