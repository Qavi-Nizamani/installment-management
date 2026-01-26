-- Create installment_plans table
CREATE TABLE IF NOT EXISTS installment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    total_price NUMERIC(12,2) NOT NULL CHECK (total_price > 0),
    upfront_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
    finance_amount NUMERIC(12,2) NOT NULL CHECK (finance_amount >= 0),
    monthly_percentage NUMERIC(5,2) NOT NULL CHECK (monthly_percentage >= 0),
    total_months INT NOT NULL CHECK (total_months > 0),
    start_date DATE NOT NULL,
    notes TEXT,
    business_model TEXT NOT NULL DEFAULT 'PRODUCT_OWNER' CHECK (business_model IN ('PRODUCT_OWNER', 'FINANCER_ONLY')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT valid_payment CHECK (upfront_paid + finance_amount = total_price)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_installment_plans_tenant_id ON installment_plans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_installment_plans_customer_id ON installment_plans(customer_id);
CREATE INDEX IF NOT EXISTS idx_installment_plans_start_date ON installment_plans(start_date);

-- Enable Row Level Security
ALTER TABLE installment_plans ENABLE ROW LEVEL SECURITY;

----------------------------------
-- Create policies
----------------------------------
CREATE POLICY "Installment plans are viewable by tenant members" ON installment_plans
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM members
            WHERE members.tenant_id = installment_plans.tenant_id
            AND members.user_id = auth.uid()
        )
    );

CREATE POLICY "Installment plans are insertable by tenant members" ON installment_plans
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM members
            WHERE members.tenant_id = installment_plans.tenant_id
            AND members.user_id = auth.uid()
        )
    );

CREATE POLICY "Installment plans are updatable by tenant members" ON installment_plans
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM members
            WHERE members.tenant_id = installment_plans.tenant_id
            AND members.user_id = auth.uid()
        )
    );

CREATE POLICY "Installment plans are deletable by tenant owners" ON installment_plans
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM members
            WHERE members.tenant_id = installment_plans.tenant_id
            AND members.user_id = auth.uid()
            AND members.role = 'OWNER'
        )
    );

-- Create updated_at trigger
CREATE TRIGGER update_installment_plans_updated_at
    BEFORE UPDATE ON installment_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 