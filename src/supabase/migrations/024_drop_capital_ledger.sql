-- Migration: Drop capital_ledger (replaced by cash_ledger)
-- Description: Remove activity trigger on capital_ledger and drop the table.
--              App now uses cash_ledger exclusively; capital_ledger data was migrated in 023.

DROP TRIGGER IF EXISTS activity_log_trigger ON capital_ledger;
DROP TABLE IF EXISTS capital_ledger;
