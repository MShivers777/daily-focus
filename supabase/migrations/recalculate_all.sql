-- Recalculate metrics for all existing records
UPDATE workouts 
SET workout_date = workout_date 
WHERE true
RETURNING id, workout_date, strength_ratio, cardio_ratio, combined_ratio;
