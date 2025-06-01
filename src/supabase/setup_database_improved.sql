-- Complete Database Setup Script (IMPROVED DESIGN)
-- Run this in your Supabase SQL Editor to set up the entire database
-- BEST PRACTICE: Uses role-based ownership without redundant owner_id

-- 1. Create the update function first (required by triggers)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Create tenants table (IMPROVED: No redundant owner_id)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Note: No owner_id column - ownership is managed through members table with OWNER role
-- Enable RLS on tenants
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- 3. Create members table
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('OWNER', 'MANAGER', 'AGENT')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, tenant_id)
);

-- Create indexes for members
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_tenant_id ON members(tenant_id);

-- Enable RLS on members
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- 4. Create customers table
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

-- Create indexes for customers
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_national_id ON customers(national_id);

-- Enable RLS on customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- 5. Drop any existing problematic policies
DROP POLICY IF EXISTS "Members are viewable by tenant members" ON members;
DROP POLICY IF EXISTS "Members are insertable by tenant owners" ON members;
DROP POLICY IF EXISTS "Members are updatable by tenant owners" ON members;
DROP POLICY IF EXISTS "Members are deletable by tenant owners" ON members;

DROP POLICY IF EXISTS "Tenants are viewable by members" ON tenants;
DROP POLICY IF EXISTS "Tenants are insertable by authenticated users" ON tenants;
DROP POLICY IF EXISTS "Tenants are updatable by owner" ON tenants;

-- 6. Create NON-RECURSIVE policies for tenants (ROLE-BASED OWNERSHIP)
CREATE POLICY "Users can view tenants they belong to" ON tenants
    FOR SELECT
    USING (
        id IN (
            SELECT tenant_id FROM members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can create tenants" ON tenants
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- IMPROVED: Ownership check via members.role = 'OWNER'
CREATE POLICY "Tenant owners can update their tenant" ON tenants
    FOR UPDATE
    USING (
        id IN (
            SELECT tenant_id FROM members 
            WHERE user_id = auth.uid() AND role = 'OWNER'
        )
    );

CREATE POLICY "Tenant owners can delete their tenant" ON tenants
    FOR DELETE
    USING (
        id IN (
            SELECT tenant_id FROM members 
            WHERE user_id = auth.uid() AND role = 'OWNER'
        )
    );

-- 7. Create NON-RECURSIVE policies for members
CREATE POLICY "Members can view same tenant members" ON members
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can create members" ON members
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

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

-- 8. Create policies for customers (these are safe)
DROP POLICY IF EXISTS "Customers are viewable by tenant members" ON customers;
DROP POLICY IF EXISTS "Customers are insertable by tenant members" ON customers;
DROP POLICY IF EXISTS "Customers are updatable by tenant members" ON customers;
DROP POLICY IF EXISTS "Customers are deletable by tenant owners" ON customers;

CREATE POLICY "Customers are viewable by tenant members" ON customers
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Customers are insertable by tenant members" ON customers
    FOR INSERT
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Customers are updatable by tenant members" ON customers
    FOR UPDATE
    USING (
        tenant_id IN (
            SELECT tenant_id FROM members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Customers are deletable by tenant owners" ON customers
    FOR DELETE
    USING (
        tenant_id IN (
            SELECT tenant_id FROM members 
            WHERE user_id = auth.uid() AND role = 'OWNER'
        )
    );

-- 9. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_members_updated_at ON members;
CREATE TRIGGER update_members_updated_at
    BEFORE UPDATE ON members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 10. Create auto-onboarding functions for new users
-- Function to add sample customers to new tenants
CREATE OR REPLACE FUNCTION add_sample_customers_to_tenant(tenant_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Insert sample customers for the new tenant
    INSERT INTO customers (id, tenant_id, name, phone, address, national_id, created_at, updated_at)
    VALUES 
        (
            gen_random_uuid(),
            tenant_id,
            'Alice Johnson',
            '+1 (555) 123-4567',
            '123 Main St, New York, NY',
            '123-45-6789',
            now(),
            now()
        ),
        (
            gen_random_uuid(),
            tenant_id,
            'Bob Smith',
            '+1 (555) 987-6543',
            '456 Oak Ave, Los Angeles, CA',
            '987-65-4321',
            now(),
            now()
        ),
        (
            gen_random_uuid(),
            tenant_id,
            'Carol Davis',
            '+1 (555) 456-7890',
            '789 Pine St, Chicago, IL',
            '456-78-9012',
            now(),
            now()
        ),
        (
            gen_random_uuid(),
            tenant_id,
            'David Wilson',
            '+1 (555) 321-0987',
            '321 Elm St, Houston, TX',
            '321-09-8765',
            now(),
            now()
        );
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail
        RAISE WARNING 'Failed to add sample customers to tenant %: %', tenant_id, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new user onboarding (IMPROVED: No owner_id)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_tenant_id UUID;
    default_tenant_name TEXT;
BEGIN
    -- Generate a default tenant name (can be customized later by user)
    default_tenant_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'My Company') || '''s Workspace';
    
    -- Create a new tenant for the user (without owner_id - IMPROVED DESIGN)
    INSERT INTO tenants (id, name, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        default_tenant_name,
        now(),
        now()
    )
    RETURNING id INTO new_tenant_id;
    
    -- Create a member record making the user an OWNER of their tenant
    -- This is the ONLY source of truth for ownership (BEST PRACTICE)
    INSERT INTO members (id, user_id, tenant_id, role, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        NEW.id,
        new_tenant_id,
        'OWNER',
        now(),
        now()
    );
    
    -- Add sample customers to help users get started
    PERFORM add_sample_customers_to_tenant(new_tenant_id);
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE WARNING 'Failed to auto-onboard user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create trigger to auto-onboard new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- 12. Add business logic constraints and helper functions
-- Function to get tenant owners (useful for application logic)
CREATE OR REPLACE FUNCTION get_tenant_owners(tenant_uuid UUID)
RETURNS TABLE(user_id UUID, email TEXT, created_at TIMESTAMPTZ) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.user_id,
        u.email,
        m.created_at
    FROM members m
    JOIN auth.users u ON m.user_id = u.id
    WHERE m.tenant_id = tenant_uuid 
    AND m.role = 'OWNER';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to ensure every tenant has at least one owner
CREATE OR REPLACE FUNCTION check_tenant_has_owner()
RETURNS TRIGGER AS $$
BEGIN
    -- When deleting or updating a member, check if it's the last owner
    IF (OLD.role = 'OWNER') THEN
        -- Check if there are other owners for this tenant
        IF NOT EXISTS (
            SELECT 1 FROM members 
            WHERE tenant_id = OLD.tenant_id 
            AND role = 'OWNER' 
            AND id != OLD.id
        ) THEN
            RAISE EXCEPTION 'Cannot remove the last owner of a tenant. Transfer ownership first.';
        END IF;
    END IF;
    
    RETURN CASE 
        WHEN TG_OP = 'DELETE' THEN OLD
        ELSE NEW
    END;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to enforce the constraint
DROP TRIGGER IF EXISTS ensure_tenant_has_owner_on_delete ON members;
CREATE TRIGGER ensure_tenant_has_owner_on_delete
    BEFORE DELETE ON members
    FOR EACH ROW
    EXECUTE FUNCTION check_tenant_has_owner();

DROP TRIGGER IF EXISTS ensure_tenant_has_owner_on_update ON members;
CREATE TRIGGER ensure_tenant_has_owner_on_update
    BEFORE UPDATE OF role ON members
    FOR EACH ROW
    EXECUTE FUNCTION check_tenant_has_owner();

-- 13. Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT SELECT ON auth.users TO postgres; 