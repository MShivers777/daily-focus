-- Add selected_workouts column to user_workout_settings table
ALTER TABLE user_workout_settings
ADD COLUMN selected_workouts jsonb DEFAULT '[]'::jsonb;
