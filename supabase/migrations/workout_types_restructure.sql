-- First drop the existing types if they exist
DROP TYPE IF EXISTS workout_type CASCADE;
DROP TYPE IF EXISTS day_schedule CASCADE;

-- Update workout_types column
ALTER TABLE user_workout_settings 
  DROP COLUMN IF EXISTS workout_types CASCADE;

-- Add new column with correct type
ALTER TABLE user_workout_settings
  ADD COLUMN workout_types jsonb DEFAULT '[]'::jsonb;

-- Add the plan_start_date column to the user_workout_settings table
ALTER TABLE user_workout_settings
ADD COLUMN plan_start_date DATE DEFAULT CURRENT_DATE;
