CREATE TABLE capital_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  type TEXT CHECK (type IN ('INVESTMENT', 'WITHDRAWAL', 'ADJUSTMENT')),
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);