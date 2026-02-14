-- Migration: Backfill cash_ledger with PRINCIPAL_DEPLOYED and INSTALLMENT_PAYMENT
-- Description: For plans/installments that existed before the app wrote to cash_ledger,
--              insert one PRINCIPAL_DEPLOYED per plan (amount = finance_amount, direction -1)
--              and one INSTALLMENT_PAYMENT per paid installment (amount = amount_paid, direction 1).
--              Skips rows that already have a matching cash_ledger entry.

----------------------------------
-- 1. PRINCIPAL_DEPLOYED: one row per installment_plan (outflow = -1 * finance_amount)
----------------------------------
INSERT INTO cash_ledger (tenant_id, type, amount, direction, reference_id, reference_type)
SELECT ip.tenant_id, 'PRINCIPAL_DEPLOYED', ip.finance_amount, -1, ip.id, 'installment_plan'
FROM installment_plans ip
WHERE ip.finance_amount > 0
  AND NOT EXISTS (
    SELECT 1 FROM cash_ledger cl
    WHERE cl.reference_id = ip.id
      AND cl.reference_type = 'installment_plan'
      AND cl.type = 'PRINCIPAL_DEPLOYED'
  );

----------------------------------
-- 2. INSTALLMENT_PAYMENT: one row per installment with amount_paid > 0 (inflow = 1 * amount_paid)
----------------------------------
INSERT INTO cash_ledger (tenant_id, type, amount, direction, reference_id, reference_type, created_at)
SELECT
  i.tenant_id,
  'INSTALLMENT_PAYMENT',
  i.amount_paid,
  1,
  i.id,
  'installment',
  COALESCE(i.paid_on::timestamptz, now())
FROM installments i
WHERE i.amount_paid > 0
  AND NOT EXISTS (
    SELECT 1 FROM cash_ledger cl
    WHERE cl.reference_id = i.id
      AND cl.reference_type = 'installment'
      AND cl.type = 'INSTALLMENT_PAYMENT'
  );
