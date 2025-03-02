CREATE OR REPLACE FUNCTION calculate_workout_metrics()
RETURNS TRIGGER AS $$
DECLARE
    v_acute_strength numeric;
    v_acute_cardio numeric;
    v_chronic_strength numeric;
    v_chronic_cardio numeric;
    v_acute_total numeric;
    v_chronic_total numeric;
BEGIN
    -- Calculate acute loads
    WITH acute_period_workouts AS (
        SELECT 
            SUM(strength_volume) as total_strength,
            SUM(cardio_load) as total_cardio,
            COUNT(*) as days
        FROM workouts
        WHERE user_id = NEW.user_id
        AND workout_date >= (NEW.workout_date - INTERVAL '7 days')
        AND workout_date <= NEW.workout_date
    )
    SELECT 
        ROUND((total_strength / GREATEST(days, 1))::numeric, 2),
        ROUND((total_cardio / GREATEST(days, 1))::numeric, 2)
    INTO 
        v_acute_strength,
        v_acute_cardio
    FROM acute_period_workouts;

    -- Calculate chronic loads
    WITH chronic_period_workouts AS (
        SELECT 
            SUM(strength_volume) as total_strength,
            SUM(cardio_load) as total_cardio,
            COUNT(*) as days
        FROM workouts
        WHERE user_id = NEW.user_id
        AND workout_date >= (NEW.workout_date - INTERVAL '28 days')
        AND workout_date <= NEW.workout_date
    )
    SELECT 
        ROUND((total_strength / GREATEST(days, 1))::numeric, 2),
        ROUND((total_cardio / GREATEST(days, 1))::numeric, 2)
    INTO 
        v_chronic_strength,
        v_chronic_cardio
    FROM chronic_period_workouts;

    -- Calculate total acute and chronic loads
    v_acute_total := v_acute_strength + v_acute_cardio;
    v_chronic_total := v_chronic_strength + v_chronic_cardio;

    -- Store the loads
    NEW.strength_acute_load := v_acute_strength;
    NEW.cardio_acute_load := v_acute_cardio;
    NEW.strength_chronic_load := v_chronic_strength;
    NEW.cardio_chronic_load := v_chronic_cardio;

    -- Calculate individual ratios
    NEW.strength_ratio := CASE 
        WHEN COALESCE(v_chronic_strength, 0) > 0 
        THEN ROUND((v_acute_strength / v_chronic_strength)::numeric, 2)
        ELSE 0 
    END;

    NEW.cardio_ratio := CASE 
        WHEN COALESCE(v_chronic_cardio, 0) > 0 
        THEN ROUND((v_acute_cardio / v_chronic_cardio)::numeric, 2)
        ELSE 0 
    END;

    -- Calculate total ratio properly
    NEW.combined_ratio := CASE 
        WHEN COALESCE(v_chronic_total, 0) > 0 
        THEN ROUND((v_acute_total / v_chronic_total)::numeric, 2)
        ELSE 0 
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recalculate all workouts
UPDATE workouts 
SET updated_at = NOW() 
WHERE true;
