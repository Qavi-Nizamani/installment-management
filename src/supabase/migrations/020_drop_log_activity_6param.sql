-- Migration: Drop 6-parameter log_activity overload to resolve "function is not unique"
-- Description: Migration 018 created log_activity(uuid, text, uuid, text, jsonb, text).
--              Migration 019 recreated only the 5-param version. Both overloads existed,
--              so the trigger's 5-arg call matched both (6th param has default). Drop the 6-param version.

DROP FUNCTION IF EXISTS log_activity(UUID, TEXT, UUID, TEXT, JSONB, TEXT);
