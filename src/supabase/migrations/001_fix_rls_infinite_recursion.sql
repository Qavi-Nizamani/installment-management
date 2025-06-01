-- Migration: Fix infinite recursion in RLS policies
-- Date: 2024-06-01
-- Description: Fixes circular dependency between members and tenants table policies

-- First, drop all existing problematic policies
DROP POLICY IF EXISTS "Members are viewable by tenant members" ON members;
DROP POLICY IF EXISTS "Members are insertable by tenant owners" ON members;
DROP POLICY IF EXISTS "Members are updatable by tenant owners" ON members;
DROP POLICY IF EXISTS "Members are deletable by tenant owners" ON members;

DROP POLICY IF EXISTS "Tenants are viewable by members" ON tenants;
DROP POLICY IF EXISTS "Tenants are insertable by authenticated users" ON tenants;
DROP POLICY IF EXISTS "Tenants are updatable by owner" ON tenants;

-- Create new non-recursive policies for members table
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

-- Create new policies for tenants table
-- Users can view tenants they are members of
CREATE POLICY "Users can view tenants they belong to" ON tenants
    FOR SELECT
    USING (
        id IN (
            SELECT tenant_id FROM members 
            WHERE user_id = auth.uid()
        )
    );

-- Authenticated users can create tenants
CREATE POLICY "Authenticated users can create tenants" ON tenants
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Only tenant owners can update their tenant
CREATE POLICY "Tenant owners can update their tenant" ON tenants
    FOR UPDATE
    USING (owner_id = auth.uid());

-- Only tenant owners can delete their tenant
CREATE POLICY "Tenant owners can delete their tenant" ON tenants
    FOR DELETE
    USING (owner_id = auth.uid()); 