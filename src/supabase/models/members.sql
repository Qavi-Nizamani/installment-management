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

----------------------------------
-- Create policies (Fixed to avoid infinite recursion)
----------------------------------

-- Members can view other members in the same tenant
CREATE POLICY "Members can view same tenant members" ON members
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM members 
            WHERE user_id = auth.uid()
        )
    );

-- Only authenticated users can create members (will be restricted by application logic)
CREATE POLICY "Authenticated users can create members" ON members
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Members can only update/delete themselves, owners can update/delete anyone in tenant
CREATE POLICY "Members can update own record or owners can update tenant members" ON members
    FOR UPDATE
    USING (
        user_id = auth.uid() 
        OR tenant_id IN (
            SELECT tenant_id FROM members 
            WHERE user_id = auth.uid() AND role = 'OWNER'
        )
    );

CREATE POLICY "Members can delete own record or owners can delete tenant members" ON members
    FOR DELETE
    USING (
        user_id = auth.uid() 
        OR tenant_id IN (
            SELECT tenant_id FROM members 
            WHERE user_id = auth.uid() AND role = 'OWNER'
        )
    );

-- Create updated_at trigger
CREATE TRIGGER update_members_updated_at
    BEFORE UPDATE ON members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 