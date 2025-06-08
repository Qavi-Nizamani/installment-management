-- Remove the conflicting installment status trigger and function
-- Run this on existing databases to clean up the old automatic status logic

-- Drop the trigger first (since it depends on the function)
DROP TRIGGER IF EXISTS update_installment_status_trigger ON installments;

-- Drop the function
DROP FUNCTION IF EXISTS update_installment_status();

-- Verify removal (optional - these should return no rows)
-- SELECT * FROM information_schema.triggers WHERE trigger_name = 'update_installment_status_trigger';
-- SELECT * FROM information_schema.routines WHERE routine_name = 'update_installment_status'; 