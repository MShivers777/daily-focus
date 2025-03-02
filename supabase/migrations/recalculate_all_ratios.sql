-- Get all workouts ordered by date and update each one
WITH ordered_workouts AS (
    SELECT id
    FROM workouts
    ORDER BY workout_date ASC
)
UPDATE workouts w
SET strength_volume = w.strength_volume  -- This triggers recalculation without changing the value
WHERE id IN (
    SELECT id 
    FROM ordered_workouts
);

-- Verify the recalculation
SELECT 
    workout_date,
    strength_volume,
    cardio_load,
    strength_ratio,
    cardio_ratio,
    combined_ratio
FROM workouts
ORDER BY workout_date DESC
LIMIT 5;
