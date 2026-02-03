CREATE TABLE capital_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  type TEXT CHECK (type IN ('INVESTMENT', 'WITHDRAWAL', 'ADJUSTMENT')),
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_capital_ledger_tenant_id ON capital_ledger(tenant_id);
CREATE INDEX IF NOT EXISTS idx_capital_ledger_created_at ON capital_ledger(created_at DESC);

-- Enable Row Level Security
ALTER TABLE capital_ledger ENABLE ROW LEVEL SECURITY;

-- RLS policies following tenant pattern
CREATE POLICY "capital_ledger_select_policy" ON capital_ledger
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.user_id = auth.uid()
      AND m.tenant_id = capital_ledger.tenant_id
      AND m.role = 'OWNER'
    )
  );

CREATE POLICY "capital_ledger_insert_policy" ON capital_ledger
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.user_id = auth.uid()
      AND m.tenant_id = capital_ledger.tenant_id
      AND m.role = 'OWNER'
    )
  );

CREATE POLICY "capital_ledger_update_policy" ON capital_ledger
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.user_id = auth.uid()
      AND m.tenant_id = capital_ledger.tenant_id
      AND m.role = 'OWNER'
    )
  );

CREATE POLICY "capital_ledger_delete_policy" ON capital_ledger
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.user_id = auth.uid()
      AND m.tenant_id = capital_ledger.tenant_id
      AND m.role = 'OWNER'
    )
  );
