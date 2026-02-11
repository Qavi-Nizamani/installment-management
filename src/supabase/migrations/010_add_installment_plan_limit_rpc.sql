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

  -- Fetch active subscription plan limit
  SELECT p.active_plan_limit
  INTO v_plan_limit
  FROM subscriptions s
  JOIN plans p ON p.id = s.plan_id
  WHERE s.tenant_id = p_tenant_id
    AND s.status = 'active'
    OR s.status = 'trialing'
  LIMIT 1;  

  IF NOT FOUND THEN
    RAISE EXCEPTION
      USING ERRCODE = 'P0001',
            MESSAGE = 'NO_ACTIVE_SUBSCRIPTION';
  END IF;

  -- Enforce active plan limit (NULL = unlimited)
  IF v_plan_limit IS NOT NULL THEN
    SELECT COUNT(*)
    INTO v_active_count
    FROM installment_plans ip
    WHERE ip.tenant_id = p_tenant_id
      AND EXISTS (
        SELECT 1
        FROM installments i
        WHERE i.installment_plan_id = ip.id
          AND i.status != 'PAID'
      );

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
