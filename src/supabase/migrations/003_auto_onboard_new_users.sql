-- Migration: Auto-onboard new users
-- Date: 2024-06-01
-- Description: Automatically creates tenant and member records for new users

-- Create function to handle new user onboarding
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
            'user_email', NEW.email
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

-- Create trigger to run the function when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions for the function to work
-- The function runs with SECURITY DEFINER so it has the privileges of the function owner
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT SELECT ON auth.users TO postgres; 