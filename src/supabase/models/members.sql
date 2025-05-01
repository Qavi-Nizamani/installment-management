-- Create members table
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('OWNER', 'MANAGER', 'AGENT')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, tenant_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_tenant_id ON members(tenant_id);

-- Enable Row Level Security
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Members are viewable by tenant members" ON members
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM members m
            WHERE m.tenant_id = members.tenant_id
            AND m.user_id = auth.uid()
        )
    );

CREATE POLICY "Members are insertable by tenant owners" ON members
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM members m
            WHERE m.tenant_id = members.tenant_id
            AND m.user_id = auth.uid()
            AND m.role = 'OWNER'
        )
    );

CREATE POLICY "Members are updatable by tenant owners" ON members
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM members m
            WHERE m.tenant_id = members.tenant_id
            AND m.user_id = auth.uid()
            AND m.role = 'OWNER'
        )
    );

CREATE POLICY "Members are deletable by tenant owners" ON members
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM members m
            WHERE m.tenant_id = members.tenant_id
            AND m.user_id = auth.uid()
            AND m.role = 'OWNER'
        )
    );

-- Create updated_at trigger
CREATE TRIGGER update_members_updated_at
    BEFORE UPDATE ON members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 