-- Migration: Setup test data for development
-- Date: 2024-06-01
-- Description: Creates test tenant, member, and customer data for development

-- Insert a test tenant (only if not exists)
INSERT INTO tenants (id, name, owner_id, created_at, updated_at)
SELECT 
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Test Company',
    auth.uid(),
    now(),
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM tenants WHERE id = '00000000-0000-0000-0000-000000000001'::uuid
) AND auth.uid() IS NOT NULL;

-- Insert test member record for current user (only if authenticated and not exists)
INSERT INTO members (id, user_id, tenant_id, role, created_at, updated_at)
SELECT 
    '00000000-0000-0000-0000-000000000002'::uuid,
    auth.uid(),
    '00000000-0000-0000-0000-000000000001'::uuid,
    'OWNER',
    now(),
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM members WHERE user_id = auth.uid() AND tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
) AND auth.uid() IS NOT NULL;

-- Insert test customers (only if authenticated and tenant exists)
INSERT INTO customers (id, tenant_id, name, phone, address, national_id, created_at, updated_at)
SELECT * FROM (
    VALUES 
    ('10000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Alice Johnson', '+1 (555) 123-4567', '123 Main St, New York, NY', '123-45-6789', now(), now()),
    ('10000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Bob Smith', '+1 (555) 987-6543', '456 Oak Ave, Los Angeles, CA', '987-65-4321', now(), now()),
    ('10000000-0000-0000-0000-000000000003'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Carol Davis', '+1 (555) 456-7890', '789 Pine St, Chicago, IL', '456-78-9012', now(), now()),
    ('10000000-0000-0000-0000-000000000004'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'David Wilson', '+1 (555) 321-0987', '321 Elm St, Houston, TX', '321-09-8765', now(), now())
) AS t(id, tenant_id, name, phone, address, national_id, created_at, updated_at)
WHERE NOT EXISTS (
    SELECT 1 FROM customers WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
) AND EXISTS (
    SELECT 1 FROM tenants WHERE id = '00000000-0000-0000-0000-000000000001'::uuid
); 