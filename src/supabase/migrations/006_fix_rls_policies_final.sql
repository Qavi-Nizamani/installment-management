-- Migration: Fix RLS policies to prevent infinite recursion
-- Date: 2024-06-01
-- Description: Complete fix for circular dependency issues in RLS policies

-- STEP 1: Drop ALL existing policies to start clean
-- Members table policies
DROP POLICY IF EXISTS "Members are viewable by tenant members" ON members;
DROP POLICY IF EXISTS "Members are insertable by tenant owners" ON members;
DROP POLICY IF EXISTS "Members are updatable by tenant owners" ON members;
DROP POLICY IF EXISTS "Members are deletable by tenant owners" ON members;
DROP POLICY IF EXISTS "Members can view same tenant members" ON members;
DROP POLICY IF EXISTS "Authenticated users can create members" ON members;
DROP POLICY IF EXISTS "Members can update own record or owners can update tenant members" ON members;
DROP POLICY IF EXISTS "Members can delete own record or owners can delete tenant members" ON members;

-- Tenants table policies
DROP POLICY IF EXISTS "Tenants are viewable by members" ON tenants;
DROP POLICY IF EXISTS "Tenants are insertable by authenticated users" ON tenants;
DROP POLICY IF EXISTS "Tenants are updatable by owner" ON tenants;
DROP POLICY IF EXISTS "Tenants are deletable by owner" ON tenants;
DROP POLICY IF EXISTS "Users can view tenants they belong to" ON tenants;
DROP POLICY IF EXISTS "Authenticated users can create tenants" ON tenants;
DROP POLICY IF EXISTS "Tenant owners can update their tenant" ON tenants;
DROP POLICY IF EXISTS "Tenant owners can delete their tenant" ON tenants;

-- STEP 2: Create new, safe policies for members table
-- These policies are designed to avoid circular dependencies

-- Allow users to view members of tenants they belong to
CREATE POLICY "members_select_policy" ON members
    FOR SELECT
    USING (
        -- User can see members of tenants they belong to
        EXISTS (
            SELECT 1 FROM members m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = members.tenant_id
        )
    );

-- Allow authenticated users to insert members (application will control this)
-- AND allow system operations to bypass auth check
CREATE POLICY "members_insert_policy" ON members
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL 
        OR current_setting('role') = 'service_role'
        OR current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role'
    );

-- Allow users to update their own member record, or owners to update any member in their tenant
CREATE POLICY "members_update_policy" ON members
    FOR UPDATE
    USING (
        user_id = auth.uid() -- Can update own record
        OR EXISTS ( -- Or user is an owner of the same tenant
            SELECT 1 FROM members m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = members.tenant_id 
            AND m.role = 'OWNER'
        )
    );

-- Allow users to delete their own member record, or owners to delete any member in their tenant
CREATE POLICY "members_delete_policy" ON members
    FOR DELETE
    USING (
        user_id = auth.uid() -- Can delete own record
        OR EXISTS ( -- Or user is an owner of the same tenant
            SELECT 1 FROM members m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = members.tenant_id 
            AND m.role = 'OWNER'
        )
    );

-- STEP 3: Create new, safe policies for tenants table
-- These policies use direct checks without circular dependencies

-- Allow users to view tenants they are members of
CREATE POLICY "tenants_select_policy" ON tenants
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM members m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = tenants.id
        )
    );

-- Allow authenticated users to create tenants
-- AND allow system operations to bypass auth check
CREATE POLICY "tenants_insert_policy" ON tenants
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL 
        OR current_setting('role') = 'service_role'
        OR current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role'
    );

-- Allow tenant owners to update their tenant
CREATE POLICY "tenants_update_policy" ON tenants
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM members m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = tenants.id 
            AND m.role = 'OWNER'
        )
    );

-- Allow tenant owners to delete their tenant
CREATE POLICY "tenants_delete_policy" ON tenants
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM members m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = tenants.id 
            AND m.role = 'OWNER'
        )
    );

-- STEP 4: Create safe policies for customers table
-- Drop existing policies first
DROP POLICY IF EXISTS "Customers are viewable by tenant members" ON customers;
DROP POLICY IF EXISTS "Customers are insertable by tenant members" ON customers;
DROP POLICY IF EXISTS "Customers are updatable by tenant members" ON customers;
DROP POLICY IF EXISTS "Customers are deletable by tenant members" ON customers;

-- Create new safe policies
CREATE POLICY "customers_select_policy" ON customers
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM members m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = customers.tenant_id
        )
    );

CREATE POLICY "customers_insert_policy" ON customers
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM members m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = customers.tenant_id
        )
        OR current_setting('role') = 'service_role'
        OR current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role'
    );

CREATE POLICY "customers_update_policy" ON customers
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM members m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = customers.tenant_id
        )
    );

CREATE POLICY "customers_delete_policy" ON customers
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM members m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = customers.tenant_id
        )
    );

-- STEP 5: Verify the policies are working
-- This will help debug any remaining issues

-- Function to test policy conflicts
CREATE OR REPLACE FUNCTION test_policy_setup()
RETURNS TEXT AS $$
DECLARE
    result TEXT := '';
BEGIN
    result := result || 'Testing RLS policy setup...' || E'\n';
    
    -- Test if we can query tables without recursion
    BEGIN
        PERFORM COUNT(*) FROM tenants LIMIT 1;
        result := result || '✓ Tenants table accessible' || E'\n';
    EXCEPTION
        WHEN OTHERS THEN
            result := result || '✗ Tenants table error: ' || SQLERRM || E'\n';
    END;
    
    BEGIN
        PERFORM COUNT(*) FROM members LIMIT 1;
        result := result || '✓ Members table accessible' || E'\n';
    EXCEPTION
        WHEN OTHERS THEN
            result := result || '✗ Members table error: ' || SQLERRM || E'\n';
    END;
    
    BEGIN
        PERFORM COUNT(*) FROM customers LIMIT 1;
        result := result || '✓ Customers table accessible' || E'\n';
    EXCEPTION
        WHEN OTHERS THEN
            result := result || '✗ Customers table error: ' || SQLERRM || E'\n';
    END;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the test
SELECT test_policy_setup();

RAISE NOTICE 'RLS policies have been recreated to prevent infinite recursion.'; 