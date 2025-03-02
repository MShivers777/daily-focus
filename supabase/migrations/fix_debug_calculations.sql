WITH latest_workout AS (
    SELECT 
        id,
        workout_date,
        user_id,
        strength_volume,
        cardio_load,
        strength_acute_load,
        cardio_acute_load,
        strength_chronic_load,
        cardio_chronic_load,
        strength_ratio,
        cardio_ratio,
        combined_ratio
    FROM workouts
    ORDER BY workout_date DESC
    LIMIT 1
),
acute_loads AS (
    SELECT 
        ROUND(AVG(w.strength_volume)::numeric, 2) as calc_strength_acute,
        ROUND(AVG(w.cardio_load)::numeric, 2) as calc_cardio_acute
    FROM workouts w
    INNER JOIN latest_workout lw ON w.user_id = lw.user_id
    WHERE w.workout_date >= (lw.workout_date - INTERVAL '7 days')
    AND w.workout_date <= lw.workout_date
),
chronic_loads AS (
    SELECT 
        ROUND(AVG(w.strength_volume)::numeric, 2) as calc_strength_chronic,
        ROUND(AVG(w.cardio_load)::numeric, 2) as calc_cardio_chronic
    FROM workouts w
    INNER JOIN latest_workout lw ON w.user_id = lw.user_id
    WHERE w.workout_date >= (lw.workout_date - INTERVAL '28 days')
    AND w.workout_date <= lw.workout_date
)
SELECT 
    -- ...existing select columns...
FROM latest_workout lw
CROSS JOIN acute_loads al
CROSS JOIN chronic_loads cl;
