-- Create activity_logs table
-- Note: tenant_id is nullable for logs from global tables (e.g. plans, billing_webhook_events).
-- AFTER INSERT/UPDATE/DELETE triggers are defined in migration 017_activity_logs_and_triggers.sql.
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    reference_id UUID,
    reference_type TEXT NOT NULL,
    message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_activity_logs_tenant_id ON activity_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_reference ON activity_logs(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- Enable Row Level Security
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

----------------------------------
-- Create policies
----------------------------------
CREATE POLICY "Activity logs are viewable by tenant members" ON activity_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM members
            WHERE members.tenant_id = activity_logs.tenant_id
            AND members.user_id = auth.uid()
        )
    );

CREATE POLICY "Activity logs are insertable by tenant members" ON activity_logs
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM members
            WHERE members.tenant_id = activity_logs.tenant_id
            AND members.user_id = auth.uid()
        )
    );

----------------------------------
-- 2. Extend log_activity: accept p_message, look up actor email, merge into metadata
----------------------------------
CREATE OR REPLACE FUNCTION log_activity(
    p_tenant_id UUID,
    p_action TEXT,
    p_reference_id UUID,
    p_reference_type TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_log_id UUID;
    v_email TEXT;
BEGIN
    SELECT email INTO v_email
    FROM auth.users
    WHERE id = auth.uid();

    INSERT INTO activity_logs (
        tenant_id,
        user_id,
        action,
        reference_id,
        reference_type,
        metadata,
        message
    ) VALUES (
        p_tenant_id,
        auth.uid(),
        p_action,
        p_reference_id,
        p_reference_type,
        COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object('actor_email', COALESCE(v_email, 'System')),
        p_message
    )
    RETURNING id INTO v_log_id;
    RETURN v_log_id;
END;
$$;