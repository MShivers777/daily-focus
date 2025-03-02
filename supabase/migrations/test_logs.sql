-- Test logging by updating the most recent workout
UPDATE workouts 
SET updated_at = NOW()
WHERE id = (
    SELECT id 
    FROM workouts 
    ORDER BY workout_date DESC 
    LIMIT 1
);

-- Show the results directly
SELECT 
    workout_date,
    strength_ratio,
    cardio_ratio,
    combined_ratio
FROM workouts
ORDER BY workout_date DESC
LIMIT 5;
