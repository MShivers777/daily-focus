-- Update combined_ratio to be the average of strength_ratio and cardio_ratio
UPDATE workouts
SET combined_ratio = ROUND(((COALESCE(strength_ratio, 0) + COALESCE(cardio_ratio, 0)) / 2)::numeric, 2);

-- Verify the results
SELECT 
    workout_date,
    strength_ratio,
    cardio_ratio,
    combined_ratio
FROM workouts
ORDER BY workout_date DESC
LIMIT 5;
