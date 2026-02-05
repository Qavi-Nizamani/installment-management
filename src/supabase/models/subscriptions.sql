-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
    plan_id UUID REFERENCES plans(id) ON DELETE RESTRICT,
    status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled')),
    current_period_start TIMESTAMPTZ DEFAULT now(),
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies: members can view, owners can manage
CREATE POLICY "subscriptions_select_policy" ON subscriptions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM members m
            WHERE m.user_id = (SELECT auth.uid())
            AND m.tenant_id = subscriptions.tenant_id
        )
    );

CREATE POLICY "subscriptions_insert_policy" ON subscriptions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM members m
            WHERE m.user_id = (SELECT auth.uid())
            AND m.tenant_id = subscriptions.tenant_id
            AND m.role = 'OWNER'
        )
    );

CREATE POLICY "subscriptions_update_policy" ON subscriptions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM members m
            WHERE m.user_id = (SELECT auth.uid())
            AND m.tenant_id = subscriptions.tenant_id
            AND m.role = 'OWNER'
        )
    );

CREATE POLICY "subscriptions_delete_policy" ON subscriptions
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM members m
            WHERE m.user_id = (SELECT auth.uid())
            AND m.tenant_id = subscriptions.tenant_id
            AND m.role = 'OWNER'
        )
    );

-- Create updated_at trigger
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 
