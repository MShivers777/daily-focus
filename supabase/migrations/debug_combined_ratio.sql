-- First, let's verify what we're calculating
WITH raw_data AS (
    SELECT 
        w.workout_date,
        w.strength_volume,
        w.cardio_load,
        w.user_id
    FROM workouts w
    ORDER BY workout_date DESC
    LIMIT 1
), acute_calcs AS (
    SELECT 
        rd.workout_date,
        ROUND(AVG(w.strength_volume)::numeric, 2) as acute_strength,
        ROUND(AVG(w.cardio_load)::numeric, 2) as acute_cardio,
        COUNT(*) as acute_days
    FROM workouts w
    CROSS JOIN raw_data rd
    WHERE w.workout_date >= (rd.workout_date - INTERVAL '7 days')
    AND w.workout_date <= rd.workout_date
    GROUP BY rd.workout_date
), chronic_calcs AS (
    SELECT 
        rd.workout_date,
        ROUND(AVG(w.strength_volume)::numeric, 2) as chronic_strength,
        ROUND(AVG(w.cardio_load)::numeric, 2) as chronic_cardio,
        COUNT(*) as chronic_days
    FROM workouts w
    CROSS JOIN raw_data rd
    WHERE w.workout_date >= (rd.workout_date - INTERVAL '28 days')
    AND w.workout_date <= rd.workout_date
    GROUP BY rd.workout_date
)
SELECT 
    rd.workout_date,
    ac.acute_strength,
    ac.acute_cardio,
    (ac.acute_strength + ac.acute_cardio) as acute_total,
    cc.chronic_strength,
    cc.chronic_cardio,
    (cc.chronic_strength + cc.chronic_cardio) as chronic_total,
    CASE 
        WHEN cc.chronic_strength > 0 THEN ROUND((ac.acute_strength / cc.chronic_strength)::numeric, 2)
        ELSE 0 
    END as strength_ratio,
    CASE 
        WHEN cc.chronic_cardio > 0 THEN ROUND((ac.acute_cardio / cc.chronic_cardio)::numeric, 2)
        ELSE 0 
    END as cardio_ratio,
    CASE 
        WHEN (cc.chronic_strength + cc.chronic_cardio) > 0 
        THEN ROUND(((ac.acute_strength + ac.acute_cardio) / (cc.chronic_strength + cc.chronic_cardio))::numeric, 2)
        ELSE 0 
    END as combined_ratio
FROM raw_data rd
JOIN acute_calcs ac ON ac.workout_date = rd.workout_date
JOIN chronic_calcs cc ON cc.workout_date = rd.workout_date;

-- If the calculations look correct, update the trigger function
CREATE OR REPLACE FUNCTION calculate_workout_metrics()
RETURNS TRIGGER AS $$
DECLARE
    v_acute_strength numeric;
    v_acute_cardio numeric;
    v_chronic_strength numeric;
    v_chronic_cardio numeric;
BEGIN
    -- Calculate acute loads
    WITH acute_data AS (
        SELECT 
            ROUND(AVG(strength_volume)::numeric, 2) as avg_strength,
            ROUND(AVG(cardio_load)::numeric, 2) as avg_cardio
        FROM workouts
        WHERE user_id = NEW.user_id
        AND workout_date >= (NEW.workout_date - INTERVAL '7 days')
        AND workout_date <= NEW.workout_date
    )
    SELECT 
        avg_strength,
        avg_cardio
    INTO 
        v_acute_strength,
        v_acute_cardio
    FROM acute_data;

    -- Calculate chronic loads
    WITH chronic_data AS (
        SELECT 
            ROUND(AVG(strength_volume)::numeric, 2) as avg_strength,
            ROUND(AVG(cardio_load)::numeric, 2) as avg_cardio
        FROM workouts
        WHERE user_id = NEW.user_id
        AND workout_date >= (NEW.workout_date - INTERVAL '28 days')
        AND workout_date <= NEW.workout_date
    )
    SELECT 
        avg_strength,
        avg_cardio
    INTO 
        v_chronic_strength,
        v_chronic_cardio
    FROM chronic_data;

    -- Store loads and calculate ratios
    NEW.strength_acute_load := COALESCE(v_acute_strength, 0);
    NEW.cardio_acute_load := COALESCE(v_acute_cardio, 0);
    NEW.strength_chronic_load := COALESCE(v_chronic_strength, 0);
    NEW.cardio_chronic_load := COALESCE(v_chronic_cardio, 0);

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

    NEW.combined_ratio := CASE 
        WHEN (COALESCE(v_chronic_strength, 0) + COALESCE(v_chronic_cardio, 0)) > 0 
        THEN ROUND(
            (COALESCE(v_acute_strength, 0) + COALESCE(v_acute_cardio, 0)) / 
            (COALESCE(v_chronic_strength, 0) + COALESCE(v_chronic_cardio, 0))
            ::numeric, 2)
        ELSE 0 
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS workout_metrics_trigger ON workouts;
CREATE TRIGGER workout_metrics_trigger
    BEFORE INSERT OR UPDATE ON workouts
    FOR EACH ROW
    EXECUTE FUNCTION calculate_workout_metrics();

-- Recalculate all workouts
UPDATE workouts SET updated_at = NOW() WHERE true;

-- Verify the results
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
