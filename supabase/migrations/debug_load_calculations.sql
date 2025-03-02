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
    lw.workout_date as "Date",
    -- Current Values
    lw.strength_volume as "Current Strength",
    lw.cardio_load as "Current Cardio",
    -- Stored vs Calculated Acute Loads
    lw.strength_acute_load as "Stored Strength Acute",
    al.calc_strength_acute as "Calc Strength Acute",
    lw.cardio_acute_load as "Stored Cardio Acute",
    al.calc_cardio_acute as "Calc Cardio Acute",
    -- Stored vs Calculated Chronic Loads
    lw.strength_chronic_load as "Stored Strength Chronic",
    cl.calc_strength_chronic as "Calc Strength Chronic",
    lw.cardio_chronic_load as "Stored Cardio Chronic",
    cl.calc_cardio_chronic as "Calc Cardio Chronic",
    -- Stored vs Expected Ratios
    lw.strength_ratio as "Stored Strength Ratio",
    CASE 
        WHEN cl.calc_strength_chronic > 0 
        THEN ROUND((al.calc_strength_acute / cl.calc_strength_chronic)::numeric, 2)
        ELSE 0 
    END as "Expected Strength Ratio",
    lw.cardio_ratio as "Stored Cardio Ratio",
    CASE 
        WHEN cl.calc_cardio_chronic > 0 
        THEN ROUND((al.calc_cardio_acute / cl.calc_cardio_chronic)::numeric, 2)
        ELSE 0 
    END as "Expected Cardio Ratio",
    lw.combined_ratio as "Stored Combined Ratio",
    CASE 
        WHEN (cl.calc_strength_chronic + cl.calc_cardio_chronic) > 0 
        THEN ROUND(((al.calc_strength_acute + al.calc_cardio_acute) / 
                   (cl.calc_strength_chronic + cl.calc_cardio_chronic))::numeric, 2)
        ELSE 0 
    END as "Expected Combined Ratio"
FROM latest_workout lw
CROSS JOIN acute_loads al
CROSS JOIN chronic_loads cl;
