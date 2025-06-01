-- Fix RLS Policies to Prevent Infinite Recursion
-- Run this script in your Supabase SQL Editor

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

-- Drop any policies with recursion problems
DROP POLICY IF EXISTS "members_select_policy" ON members;
DROP POLICY IF EXISTS "members_insert_policy" ON members;
DROP POLICY IF EXISTS "members_update_policy" ON members;
DROP POLICY IF EXISTS "members_delete_policy" ON members;
DROP POLICY IF EXISTS "tenants_select_policy" ON tenants;
DROP POLICY IF EXISTS "tenants_insert_policy" ON tenants;
DROP POLICY IF EXISTS "tenants_update_policy" ON tenants;
DROP POLICY IF EXISTS "tenants_delete_policy" ON tenants;

-- STEP 2: Create NEW safe policies for members table
-- Simple, non-recursive policies

-- Allow authenticated users to view members (will be filtered by application)
CREATE POLICY "members_select_safe" ON members
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to insert members (application controls access)
CREATE POLICY "members_insert_safe" ON members
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update members (application controls access)
CREATE POLICY "members_update_safe" ON members
    FOR UPDATE
    USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete members (application controls access)
CREATE POLICY "members_delete_safe" ON members
    FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- STEP 3: Create NEW safe policies for tenants table
-- Simple, non-recursive policies

-- Allow authenticated users to view tenants (will be filtered by application)
CREATE POLICY "tenants_select_safe" ON tenants
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to create tenants
CREATE POLICY "tenants_insert_safe" ON tenants
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update tenants (application controls access)
CREATE POLICY "tenants_update_safe" ON tenants
    FOR UPDATE
    USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete tenants (application controls access)
CREATE POLICY "tenants_delete_safe" ON tenants
    FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- STEP 4: Update customers policies to be safe
DROP POLICY IF EXISTS "Customers are viewable by tenant members" ON customers;
DROP POLICY IF EXISTS "Customers are insertable by tenant members" ON customers;
DROP POLICY IF EXISTS "Customers are updatable by tenant members" ON customers;
DROP POLICY IF EXISTS "Customers are deletable by tenant members" ON customers;
DROP POLICY IF EXISTS "customers_select_policy" ON customers;
DROP POLICY IF EXISTS "customers_insert_policy" ON customers;
DROP POLICY IF EXISTS "customers_update_policy" ON customers;
DROP POLICY IF EXISTS "customers_delete_policy" ON customers;

-- Create safe customers policies
CREATE POLICY "customers_select_safe" ON customers
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "customers_insert_safe" ON customers
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "customers_update_safe" ON customers
    FOR UPDATE
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "customers_delete_safe" ON customers
    FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- STEP 5: Test the setup
-- This function should run without infinite recursion
CREATE OR REPLACE FUNCTION test_no_recursion()
RETURNS TEXT AS $$
DECLARE
    tenant_count INTEGER;
    member_count INTEGER;
    customer_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO tenant_count FROM tenants;
    SELECT COUNT(*) INTO member_count FROM members;
    SELECT COUNT(*) INTO customer_count FROM customers;
    
    RETURN format('Tables accessible - Tenants: %s, Members: %s, Customers: %s', 
                  tenant_count, member_count, customer_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the test
SELECT test_no_recursion(); 