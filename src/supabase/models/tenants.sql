-- Create tenants table (IMPROVED: No redundant owner_id)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Note: No owner_id column - ownership is managed through members table with OWNER role

-- Enable Row Level Security
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

----------------------------------
-- Create policies (Role-based ownership)
----------------------------------

-- Users can view tenants they are members of
CREATE POLICY "Users can view tenants they belong to" ON tenants
    FOR SELECT
    USING (
        id IN (
            SELECT tenant_id FROM members 
            WHERE user_id = (SELECT  auth.uid())
        )
    );

-- Authenticated users can create tenants
CREATE POLICY "Authenticated users can create tenants" ON tenants
    FOR INSERT
    WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- Only tenant owners can update their tenant (ownership via members.role = 'OWNER')
CREATE POLICY "Tenant owners can update their tenant" ON tenants
    FOR UPDATE
    USING (
        id IN (
            SELECT tenant_id FROM members 
            WHERE user_id = (SELECT auth.uid()) AND role = 'OWNER'
        )
    );

-- Only tenant owners can delete their tenant
CREATE POLICY "Tenant owners can delete their tenant" ON tenants
    FOR DELETE
    USING (
        id IN (
            SELECT tenant_id FROM members 
            WHERE user_id = (SELECT auth.uid()) AND role = 'OWNER'
        )
    );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 


-- Authenticated users can create tenants
CREATE OR REPLACE FUNCTION create_tenant(p_name TEXT)
    RETURNS tenants
    LANGUAGE plpgsql
    SECURITY DEFINER
    set search_path = public, auth
    AS $$
    DECLARE
    v_tenant tenants;
    v_free_plan_id UUID;
    BEGIN

    INSERT INTO tenants (name)
    VALUES (p_name)
    RETURNING * INTO v_tenant;

    INSERT INTO members (user_id, tenant_id, role)
    VALUES (auth.uid(), v_tenant.id, 'OWNER');

    SELECT id INTO v_free_plan_id FROM plans WHERE code = 'FREE';
    IF v_free_plan_id IS NULL THEN
      INSERT INTO plans (code, active_plan_limit, price_pkr, billing_period)
      VALUES ('FREE', NULL, 0, 'monthly')
      RETURNING id INTO v_free_plan_id;
    END IF;

    INSERT INTO subscriptions (tenant_id, plan_id, status, current_period_start, current_period_end)
    VALUES (v_tenant.id, v_free_plan_id, 'active', now(), NULL);

    RETURN v_tenant;
    END;
    $$;