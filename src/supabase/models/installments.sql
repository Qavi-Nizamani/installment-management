-- Create installments table
CREATE TABLE IF NOT EXISTS installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installment_plan_id UUID REFERENCES installment_plans(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    due_date DATE NOT NULL,
    amount_due NUMERIC(12,2) NOT NULL CHECK (amount_due > 0),
    amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
    principal_due NUMERIC(12,2),
    profit_due NUMERIC(12,2),
    principal_paid NUMERIC(12,2) DEFAULT 0,
    profit_paid NUMERIC(12,2) DEFAULT 0,
    paid_on DATE,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'OVERDUE')),
    penalty NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (penalty >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
    -- Note: No payment constraint - application handles payment validation and distribution
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_installments_installment_plan_id ON installments(installment_plan_id);
CREATE INDEX IF NOT EXISTS idx_installments_tenant_id ON installments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_installments_due_date ON installments(due_date);
CREATE INDEX IF NOT EXISTS idx_installments_status ON installments(status);

-- Enable Row Level Security
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;

----------------------------------
-- Create policies
----------------------------------
CREATE POLICY "Installments are viewable by tenant members" ON installments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM members
            WHERE members.tenant_id = installments.tenant_id
            AND members.user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Installments are insertable by tenant members" ON installments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM members
            WHERE members.tenant_id = installments.tenant_id
            AND members.user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Installments are updatable by tenant members" ON installments
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM members
            WHERE members.tenant_id = installments.tenant_id
            AND members.user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Installments are deletable by tenant owners" ON installments
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM members
            WHERE members.tenant_id = installments.tenant_id
            AND members.user_id = (SELECT auth.uid())
            AND members.role = 'OWNER'
        )
    );

-- Create updated_at trigger
CREATE TRIGGER update_installments_updated_at
    BEFORE UPDATE ON installments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Note: Status updates are now handled at the application level 
-- in the markAsPaid service function for better control and transparency 