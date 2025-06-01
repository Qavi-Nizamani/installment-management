-- Migration: Add sample customers for new tenants
-- Date: 2024-06-01
-- Description: Automatically creates sample customers when a new tenant is created

-- Create function to add sample customers to new tenants
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

-- Update the handle_new_user function to include sample customers
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_tenant_id UUID;
    default_tenant_name TEXT;
BEGIN
    -- Generate a default tenant name (can be customized later by user)
    default_tenant_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'My Company') || '''s Workspace';
    
    -- Create a new tenant for the user
    INSERT INTO tenants (id, name, owner_id, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        default_tenant_name,
        NEW.id,
        now(),
        now()
    )
    RETURNING id INTO new_tenant_id;
    
    -- Create a member record making the user an OWNER of their tenant
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
    
    -- Log the action (optional - can be useful for debugging)
    -- You can uncomment this if you have an activity_logs table
    /*
    INSERT INTO activity_logs (id, tenant_id, user_id, action, details, created_at)
    VALUES (
        gen_random_uuid(),
        new_tenant_id,
        NEW.id,
        'USER_ONBOARDED',
        jsonb_build_object(
            'tenant_name', default_tenant_name,
            'user_email', NEW.email,
            'sample_customers_added', 4
        ),
        now()
    );
    */
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE WARNING 'Failed to auto-onboard user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 