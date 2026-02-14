-- Cash ledger: replaces capital_ledger; tracks all cash flows (owner entries, principal deployed, installment payments).
CREATE TABLE cash_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (
    type IN (
      'OWNER_INVESTMENT',
      'OWNER_WITHDRAWAL',
      'PRINCIPAL_DEPLOYED',
      'INSTALLMENT_PAYMENT',
      'ADJUSTMENT'
    )
  ),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  direction SMALLINT NOT NULL CHECK (direction IN (1, -1)),
  reference_id UUID,
  reference_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cash_ledger_tenant_id ON cash_ledger(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cash_ledger_created_at ON cash_ledger(tenant_id, created_at DESC);

ALTER TABLE cash_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cash_ledger_select_policy" ON cash_ledger
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.user_id = (SELECT auth.uid())
      AND m.tenant_id = cash_ledger.tenant_id
      AND m.role = 'OWNER'
    )
  );

CREATE POLICY "cash_ledger_insert_policy" ON cash_ledger
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.user_id = (SELECT auth.uid())
      AND m.tenant_id = cash_ledger.tenant_id
      AND m.role = 'OWNER'
    )
    AND tenant_has_active_subscription(cash_ledger.tenant_id)
  );

CREATE POLICY "cash_ledger_update_policy" ON cash_ledger
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.user_id = (SELECT auth.uid())
      AND m.tenant_id = cash_ledger.tenant_id
      AND m.role = 'OWNER'
    )
  );

CREATE POLICY "cash_ledger_delete_policy" ON cash_ledger
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.user_id = (SELECT auth.uid())
      AND m.tenant_id = cash_ledger.tenant_id
      AND m.role = 'OWNER'
    )
  );
