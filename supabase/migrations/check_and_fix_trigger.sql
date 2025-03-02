
-- First, let's check what triggers exist
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'workouts';

-- Drop any conflicting triggers
DROP TRIGGER IF EXISTS calculate_load_ratios_trigger ON workouts;
DROP TRIGGER IF EXISTS workout_metrics_trigger ON workouts;

-- Recreate the correct trigger
CREATE TRIGGER workout_metrics_trigger
    BEFORE INSERT ON workouts
    FOR EACH ROW
    EXECUTE FUNCTION calculate_workout_metrics();

-- Verify the trigger exists
SELECT pg_get_triggerdef(oid) 
FROM pg_trigger 
WHERE tgname = 'workout_metrics_trigger';

-- Optionally, recalculate all records
UPDATE workouts 
SET workout_date = workout_date 
WHERE true;
