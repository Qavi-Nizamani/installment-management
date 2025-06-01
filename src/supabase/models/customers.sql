-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    national_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_national_id ON customers(national_id);

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

----------------------------------
-- Create policies
----------------------------------
CREATE POLICY "Customers are viewable by tenant members" ON customers
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM members
            WHERE members.tenant_id = customers.tenant_id
            AND members.user_id = auth.uid()
        )
    );

CREATE POLICY "Customers are insertable by tenant members" ON customers
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM members
            WHERE members.tenant_id = customers.tenant_id
            AND members.user_id = auth.uid()
        )
    );

CREATE POLICY "Customers are updatable by tenant members" ON customers
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM members
            WHERE members.tenant_id = customers.tenant_id
            AND members.user_id = auth.uid()
        )
    );

CREATE POLICY "Customers are deletable by tenant owners" ON customers
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM members
            WHERE members.tenant_id = customers.tenant_id
            AND members.user_id = auth.uid()
            AND members.role = 'OWNER'
        )
    );

-- Create updated_at trigger
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 