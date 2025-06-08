-- Migration to update installments table constraints for new payment logic
-- This removes the constraint that prevents overpayments and allows more flexible payment handling

-- Drop the old payment validation constraint
ALTER TABLE installments DROP CONSTRAINT IF EXISTS valid_payment;

-- Note: We no longer restrict amount_paid to be <= amount_due + penalty
-- This allows for:
-- 1. Overpayments that will be applied to other installments
-- 2. More flexible payment recording
-- 3. Better support for complex payment scenarios

-- The application logic now handles payment validation and distribution 