-- Migration: Add business_model field to installment_plans
-- Date: 2024-12-19
-- Description: Add business_model field to differentiate between product owners and financers

-- Add business_model column to installment_plans table
ALTER TABLE installment_plans 
ADD COLUMN business_model TEXT NOT NULL DEFAULT 'PRODUCT_OWNER' 
CHECK (business_model IN ('PRODUCT_OWNER', 'FINANCER_ONLY'));

-- Add comment to explain the field
COMMENT ON COLUMN installment_plans.business_model IS 'Business model: PRODUCT_OWNER (sells product + financing) or FINANCER_ONLY (only provides financing)';

-- Create index for faster filtering by business model
CREATE INDEX IF NOT EXISTS idx_installment_plans_business_model ON installment_plans(business_model); 