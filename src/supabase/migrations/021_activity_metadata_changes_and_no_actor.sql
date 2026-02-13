-- Migration: Optimize activity metadata for audits; remove actor_email
-- Description: Metadata uses "changes" object (only fields that changed, {old, new}).
--              Single value when no change or on INSERT/DELETE. Actor derived from user_id at display time.

----------------------------------
-- 1. log_activity: do not add actor_email to metadata
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
        auth.uid(),
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
-- 2. activity_log_trigger: metadata with changes only when old != new; audit data for all tables
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
    v_changes JSONB := '{}'::jsonb;
    -- Installments
    v_installment_number INT;
    v_customer_id UUID;
    v_customer_name TEXT;
BEGIN
    CASE TG_TABLE_NAME
        WHEN 'tenants' THEN
            IF TG_OP = 'DELETE' THEN
                v_tenant_id := OLD.id;
                v_reference_id := OLD.id;
                v_metadata := jsonb_build_object('name', OLD.name);
            ELSE
                v_tenant_id := NEW.id;
                v_reference_id := NEW.id;
                IF TG_OP = 'INSERT' THEN
                    v_metadata := jsonb_build_object('name', NEW.name);
                ELSE
                    IF OLD.name IS DISTINCT FROM NEW.name THEN
                        v_changes := v_changes || jsonb_build_object('name', jsonb_build_object('old', OLD.name, 'new', NEW.name));
                    END IF;
                    IF v_changes != '{}' THEN
                        v_metadata := jsonb_build_object('changes', v_changes);
                    END IF;
                END IF;
            END IF;

        WHEN 'members' THEN
            IF TG_OP = 'DELETE' THEN
                v_tenant_id := OLD.tenant_id;
                v_reference_id := OLD.id;
                v_metadata := jsonb_build_object('tenant_id', OLD.tenant_id, 'user_id', OLD.user_id, 'role', OLD.role);
            ELSE
                v_tenant_id := NEW.tenant_id;
                v_reference_id := NEW.id;
                IF TG_OP = 'INSERT' THEN
                    v_metadata := jsonb_build_object('tenant_id', NEW.tenant_id, 'user_id', NEW.user_id, 'role', NEW.role);
                ELSE
                    IF OLD.role IS DISTINCT FROM NEW.role THEN
                        v_changes := v_changes || jsonb_build_object('role', jsonb_build_object('old', OLD.role, 'new', NEW.role));
                    END IF;
                    IF v_changes != '{}' THEN
                        v_metadata := jsonb_build_object('changes', v_changes);
                    END IF;
                END IF;
            END IF;

        WHEN 'plans' THEN
            v_tenant_id := NULL;
            IF TG_OP = 'DELETE' THEN
                v_reference_id := OLD.id;
                v_metadata := jsonb_build_object('code', OLD.code, 'active_plan_limit', OLD.active_plan_limit, 'price_pkr', OLD.price_pkr, 'billing_period', OLD.billing_period);
            ELSE
                v_reference_id := NEW.id;
                IF TG_OP = 'INSERT' THEN
                    v_metadata := jsonb_build_object('code', NEW.code, 'active_plan_limit', NEW.active_plan_limit, 'price_pkr', NEW.price_pkr, 'billing_period', NEW.billing_period);
                ELSE
                    IF OLD.code IS DISTINCT FROM NEW.code THEN
                        v_changes := v_changes || jsonb_build_object('code', jsonb_build_object('old', OLD.code, 'new', NEW.code));
                    END IF;
                    IF OLD.active_plan_limit IS DISTINCT FROM NEW.active_plan_limit THEN
                        v_changes := v_changes || jsonb_build_object('active_plan_limit', jsonb_build_object('old', OLD.active_plan_limit, 'new', NEW.active_plan_limit));
                    END IF;
                    IF OLD.price_pkr IS DISTINCT FROM NEW.price_pkr THEN
                        v_changes := v_changes || jsonb_build_object('price_pkr', jsonb_build_object('old', OLD.price_pkr, 'new', NEW.price_pkr));
                    END IF;
                    IF OLD.billing_period IS DISTINCT FROM NEW.billing_period THEN
                        v_changes := v_changes || jsonb_build_object('billing_period', jsonb_build_object('old', OLD.billing_period, 'new', NEW.billing_period));
                    END IF;
                    IF v_changes != '{}' THEN
                        v_metadata := jsonb_build_object('changes', v_changes);
                    END IF;
                END IF;
            END IF;

        WHEN 'subscriptions' THEN
            IF TG_OP = 'DELETE' THEN
                v_tenant_id := OLD.tenant_id;
                v_reference_id := OLD.id;
                v_metadata := jsonb_build_object('plan_id', OLD.plan_id, 'status', OLD.status, 'current_period_start', OLD.current_period_start, 'current_period_end', OLD.current_period_end);
            ELSE
                v_tenant_id := NEW.tenant_id;
                v_reference_id := NEW.id;
                IF TG_OP = 'INSERT' THEN
                    v_metadata := jsonb_build_object('plan_id', NEW.plan_id, 'status', NEW.status, 'current_period_start', NEW.current_period_start, 'current_period_end', NEW.current_period_end);
                ELSE
                    IF OLD.plan_id IS DISTINCT FROM NEW.plan_id THEN
                        v_changes := v_changes || jsonb_build_object('plan_id', jsonb_build_object('old', OLD.plan_id, 'new', NEW.plan_id));
                    END IF;
                    IF OLD.status IS DISTINCT FROM NEW.status THEN
                        v_changes := v_changes || jsonb_build_object('status', jsonb_build_object('old', OLD.status, 'new', NEW.status));
                    END IF;
                    IF OLD.current_period_start IS DISTINCT FROM NEW.current_period_start THEN
                        v_changes := v_changes || jsonb_build_object('current_period_start', jsonb_build_object('old', OLD.current_period_start, 'new', NEW.current_period_start));
                    END IF;
                    IF OLD.current_period_end IS DISTINCT FROM NEW.current_period_end THEN
                        v_changes := v_changes || jsonb_build_object('current_period_end', jsonb_build_object('old', OLD.current_period_end, 'new', NEW.current_period_end));
                    END IF;
                    IF v_changes != '{}' THEN
                        v_metadata := jsonb_build_object('changes', v_changes);
                    END IF;
                END IF;
            END IF;

        WHEN 'customers' THEN
            IF TG_OP = 'DELETE' THEN
                v_tenant_id := OLD.tenant_id;
                v_reference_id := OLD.id;
                v_metadata := jsonb_build_object('name', OLD.name, 'phone', OLD.phone, 'address', OLD.address, 'national_id', OLD.national_id);
            ELSE
                v_tenant_id := NEW.tenant_id;
                v_reference_id := NEW.id;
                IF TG_OP = 'INSERT' THEN
                    v_metadata := jsonb_build_object('name', NEW.name, 'phone', NEW.phone, 'address', NEW.address, 'national_id', NEW.national_id);
                ELSE
                    IF OLD.name IS DISTINCT FROM NEW.name THEN
                        v_changes := v_changes || jsonb_build_object('name', jsonb_build_object('old', OLD.name, 'new', NEW.name));
                    END IF;
                    IF OLD.phone IS DISTINCT FROM NEW.phone THEN
                        v_changes := v_changes || jsonb_build_object('phone', jsonb_build_object('old', OLD.phone, 'new', NEW.phone));
                    END IF;
                    IF OLD.address IS DISTINCT FROM NEW.address THEN
                        v_changes := v_changes || jsonb_build_object('address', jsonb_build_object('old', OLD.address, 'new', NEW.address));
                    END IF;
                    IF OLD.national_id IS DISTINCT FROM NEW.national_id THEN
                        v_changes := v_changes || jsonb_build_object('national_id', jsonb_build_object('old', OLD.national_id, 'new', NEW.national_id));
                    END IF;
                    IF v_changes != '{}' THEN
                        v_metadata := jsonb_build_object('changes', v_changes);
                    END IF;
                END IF;
            END IF;

        WHEN 'installment_plans' THEN
            IF TG_OP = 'DELETE' THEN
                v_tenant_id := OLD.tenant_id;
                v_reference_id := OLD.id;
                v_metadata := jsonb_build_object(
                    'customer_id', OLD.customer_id, 'title', OLD.title, 'total_price', OLD.total_price,
                    'upfront_paid', OLD.upfront_paid, 'finance_amount', OLD.finance_amount, 'total_months', OLD.total_months,
                    'start_date', OLD.start_date, 'business_model', OLD.business_model
                );
            ELSE
                v_tenant_id := NEW.tenant_id;
                v_reference_id := NEW.id;
                IF TG_OP = 'INSERT' THEN
                    v_metadata := jsonb_build_object(
                        'customer_id', NEW.customer_id, 'title', NEW.title, 'total_price', NEW.total_price,
                        'upfront_paid', NEW.upfront_paid, 'finance_amount', NEW.finance_amount, 'total_months', NEW.total_months,
                        'start_date', NEW.start_date, 'business_model', NEW.business_model
                    );
                ELSE
                    IF OLD.customer_id IS DISTINCT FROM NEW.customer_id THEN
                        v_changes := v_changes || jsonb_build_object('customer_id', jsonb_build_object('old', OLD.customer_id, 'new', NEW.customer_id));
                    END IF;
                    IF OLD.title IS DISTINCT FROM NEW.title THEN
                        v_changes := v_changes || jsonb_build_object('title', jsonb_build_object('old', OLD.title, 'new', NEW.title));
                    END IF;
                    IF OLD.total_price IS DISTINCT FROM NEW.total_price THEN
                        v_changes := v_changes || jsonb_build_object('total_price', jsonb_build_object('old', OLD.total_price, 'new', NEW.total_price));
                    END IF;
                    IF OLD.upfront_paid IS DISTINCT FROM NEW.upfront_paid THEN
                        v_changes := v_changes || jsonb_build_object('upfront_paid', jsonb_build_object('old', OLD.upfront_paid, 'new', NEW.upfront_paid));
                    END IF;
                    IF OLD.finance_amount IS DISTINCT FROM NEW.finance_amount THEN
                        v_changes := v_changes || jsonb_build_object('finance_amount', jsonb_build_object('old', OLD.finance_amount, 'new', NEW.finance_amount));
                    END IF;
                    IF OLD.total_months IS DISTINCT FROM NEW.total_months THEN
                        v_changes := v_changes || jsonb_build_object('total_months', jsonb_build_object('old', OLD.total_months, 'new', NEW.total_months));
                    END IF;
                    IF OLD.start_date IS DISTINCT FROM NEW.start_date THEN
                        v_changes := v_changes || jsonb_build_object('start_date', jsonb_build_object('old', OLD.start_date, 'new', NEW.start_date));
                    END IF;
                    IF OLD.business_model IS DISTINCT FROM NEW.business_model THEN
                        v_changes := v_changes || jsonb_build_object('business_model', jsonb_build_object('old', OLD.business_model, 'new', NEW.business_model));
                    END IF;
                    IF v_changes != '{}' THEN
                        v_metadata := jsonb_build_object('changes', v_changes);
                    END IF;
                END IF;
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
                    'amount_due', OLD.amount_due,
                    'due_date', OLD.due_date::text,
                    'status', OLD.status,
                    'amount_paid', OLD.amount_paid
                );
            ELSIF TG_OP = 'UPDATE' THEN
                v_tenant_id := NEW.tenant_id;
                v_reference_id := NEW.id;
                SELECT (SELECT COUNT(*)::int FROM installments i WHERE i.installment_plan_id = NEW.installment_plan_id AND (i.due_date < NEW.due_date OR (i.due_date = NEW.due_date AND i.id <= NEW.id))) INTO v_installment_number;
                SELECT ip.customer_id, c.name INTO v_customer_id, v_customer_name FROM installment_plans ip JOIN customers c ON c.id = ip.customer_id WHERE ip.id = NEW.installment_plan_id;
                v_metadata := jsonb_build_object(
                    'installment_number', COALESCE(v_installment_number, 0),
                    'customer_id', v_customer_id,
                    'customer_name', COALESCE(v_customer_name, '')
                );
                IF OLD.status IS DISTINCT FROM NEW.status THEN
                    v_changes := v_changes || jsonb_build_object('status', jsonb_build_object('old', OLD.status, 'new', NEW.status));
                END IF;
                IF OLD.amount_paid IS DISTINCT FROM NEW.amount_paid THEN
                    v_changes := v_changes || jsonb_build_object('amount_paid', jsonb_build_object('old', OLD.amount_paid, 'new', NEW.amount_paid));
                END IF;
                IF OLD.due_date IS DISTINCT FROM NEW.due_date THEN
                    v_changes := v_changes || jsonb_build_object('due_date', jsonb_build_object('old', OLD.due_date::text, 'new', NEW.due_date::text));
                END IF;
                IF OLD.amount_due IS DISTINCT FROM NEW.amount_due THEN
                    v_changes := v_changes || jsonb_build_object('amount_due', jsonb_build_object('old', OLD.amount_due, 'new', NEW.amount_due));
                END IF;
                IF v_changes != '{}' THEN
                    v_metadata := v_metadata || jsonb_build_object('changes', v_changes);
                END IF;
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
                v_metadata := jsonb_build_object('type', OLD.type, 'amount', OLD.amount, 'notes', OLD.notes);
            ELSE
                v_tenant_id := NEW.tenant_id;
                v_reference_id := NEW.id;
                IF TG_OP = 'INSERT' THEN
                    v_metadata := jsonb_build_object('type', NEW.type, 'amount', NEW.amount, 'notes', NEW.notes);
                ELSE
                    IF OLD.type IS DISTINCT FROM NEW.type THEN
                        v_changes := v_changes || jsonb_build_object('type', jsonb_build_object('old', OLD.type, 'new', NEW.type));
                    END IF;
                    IF OLD.amount IS DISTINCT FROM NEW.amount THEN
                        v_changes := v_changes || jsonb_build_object('amount', jsonb_build_object('old', OLD.amount, 'new', NEW.amount));
                    END IF;
                    IF OLD.notes IS DISTINCT FROM NEW.notes THEN
                        v_changes := v_changes || jsonb_build_object('notes', jsonb_build_object('old', OLD.notes, 'new', NEW.notes));
                    END IF;
                    IF v_changes != '{}' THEN
                        v_metadata := jsonb_build_object('changes', v_changes);
                    END IF;
                END IF;
            END IF;

        WHEN 'limits_usage' THEN
            IF TG_OP = 'DELETE' THEN
                v_tenant_id := OLD.tenant_id;
                v_reference_id := OLD.tenant_id;
                v_metadata := jsonb_build_object('active_installment_plans', OLD.active_installment_plans);
            ELSE
                v_tenant_id := NEW.tenant_id;
                v_reference_id := NEW.tenant_id;
                IF TG_OP = 'INSERT' THEN
                    v_metadata := jsonb_build_object('active_installment_plans', NEW.active_installment_plans);
                ELSE
                    IF OLD.active_installment_plans IS DISTINCT FROM NEW.active_installment_plans THEN
                        v_metadata := jsonb_build_object('changes', jsonb_build_object('active_installment_plans', jsonb_build_object('old', OLD.active_installment_plans, 'new', NEW.active_installment_plans)));
                    END IF;
                END IF;
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
