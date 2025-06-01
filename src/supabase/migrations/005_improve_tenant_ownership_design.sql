-- Migration: Improve tenant ownership design
-- Date: 2024-06-01
-- Description: Remove redundant owner_id from tenants table, use only role-based ownership

-- Step 1: Drop ALL policies that reference owner_id FIRST
DROP POLICY IF EXISTS "Tenant owners can update their tenant" ON tenants;
DROP POLICY IF EXISTS "Tenant owners can delete their tenant" ON tenants;
DROP POLICY IF EXISTS "Tenants are updatable by owner" ON tenants;
DROP POLICY IF EXISTS "Tenants are deletable by owner" ON tenants;

-- Drop any other policies that might reference owner_id
DROP POLICY IF EXISTS "Users can view tenants they belong to" ON tenants;
DROP POLICY IF EXISTS "Authenticated users can create tenants" ON tenants;

-- Step 2: Now safely remove the owner_id column from tenants table
-- Drop the foreign key constraint
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_owner_id_fkey;

-- Drop the index on owner_id
DROP INDEX IF EXISTS idx_tenants_owner_id;

-- Remove the owner_id column
ALTER TABLE tenants DROP COLUMN IF EXISTS owner_id;

-- Step 3: Recreate tenants policies using role-based ownership
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

-- New policies that check ownership through members table
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

-- Step 4: Update the auto-onboarding function to not use owner_id
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_tenant_id UUID;
    default_tenant_name TEXT;
BEGIN
    -- Generate a default tenant name (can be customized later by user)
    default_tenant_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'My Company') || '''s Workspace';
    
    -- Create a new tenant for the user (without owner_id)
    INSERT INTO tenants (id, name, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        default_tenant_name,
        now(),
        now()
    )
    RETURNING id INTO new_tenant_id;
    
    -- Create a member record making the user an OWNER of their tenant
    -- This is now the ONLY source of truth for ownership
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

-- Step 5: Add a helper function to get tenant owners (useful for application logic)
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

-- Step 6: Add a constraint to ensure every tenant has at least one owner
-- This prevents orphaned tenants
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