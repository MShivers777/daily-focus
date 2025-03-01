-- Drop existing constraint if it exists
ALTER TABLE workouts 
DROP CONSTRAINT IF EXISTS workouts_workout_date_user_id_key;

-- Create a non-unique index for performance
CREATE INDEX IF NOT EXISTS idx_workouts_user_date 
ON workouts(user_id, workout_date);
