-- Create plans table
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE CHECK (code IN ('FREE', 'STARTER', 'PRO')),
    active_plan_limit INT,
    customer_limit INT,
    installment_plan_limit INT,
    installment_limit INT,
    price_pkr NUMERIC(12,2) NOT NULL DEFAULT 0,
    billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Read-only for authenticated users
CREATE POLICY "plans_select_policy" ON plans
    FOR SELECT
    USING (auth.uid() IS NOT NULL);
