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
        ROUND(AVG(strength_volume)::numeric, 2) as calc_strength_acute,
        ROUND(AVG(cardio_load)::numeric, 2) as calc_cardio_acute
    FROM workouts w, latest_workout lw
    WHERE w.user_id = lw.user_id
    AND w.workout_date >= (lw.workout_date - INTERVAL '7 days')
    AND w.workout_date <= lw.workout_date
),
chronic_loads AS (
    SELECT 
        ROUND(AVG(strength_volume)::numeric, 2) as calc_strength_chronic,
        ROUND(AVG(cardio_load)::numeric, 2) as calc_cardio_chronic
    FROM workouts w, latest_workout lw
    WHERE w.user_id = lw.user_id
    AND w.workout_date >= (lw.workout_date - INTERVAL '28 days')
    AND w.workout_date <= lw.workout_date
)
SELECT 
    lw.workout_date,
    lw.strength_volume as "Current Strength",
    lw.cardio_load as "Current Cardio",
    -- Stored values
    lw.strength_acute_load as "Stored Strength Acute",
    lw.cardio_acute_load as "Stored Cardio Acute",
    lw.strength_chronic_load as "Stored Strength Chronic",
    lw.cardio_chronic_load as "Stored Cardio Chronic",
    lw.strength_ratio as "Stored Strength Ratio",
    lw.cardio_ratio as "Stored Cardio Ratio",
    lw.combined_ratio as "Stored Combined Ratio",
    -- Calculated values
    al.calc_strength_acute as "Calc Strength Acute",
    al.calc_cardio_acute as "Calc Cardio Acute",
    cl.calc_strength_chronic as "Calc Strength Chronic",
    cl.calc_cardio_chronic as "Calc Cardio Chronic",
    -- Calculate expected ratios
    ROUND((al.calc_strength_acute / NULLIF(cl.calc_strength_chronic, 0))::numeric, 2) as "Expected Strength Ratio",
    ROUND((al.calc_cardio_acute / NULLIF(cl.calc_cardio_chronic, 0))::numeric, 2) as "Expected Cardio Ratio",
    ROUND(((al.calc_strength_acute + al.calc_cardio_acute) / 
           NULLIF((cl.calc_strength_chronic + cl.calc_cardio_chronic), 0))::numeric, 2) as "Expected Combined Ratio"
FROM latest_workout lw
CROSS JOIN acute_loads al
CROSS JOIN chronic_loads cl;
