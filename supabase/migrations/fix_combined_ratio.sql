-- Update the function to properly calculate combined ratio
CREATE OR REPLACE FUNCTION calculate_workout_metrics()
RETURNS TRIGGER AS $$
DECLARE
    v_acute_strength numeric;
    v_acute_cardio numeric;
    v_chronic_strength numeric;
    v_chronic_cardio numeric;
    v_combined_acute numeric;
    v_combined_chronic numeric;
BEGIN
    -- Calculate acute loads (7-day rolling averages)
    WITH acute_period_workouts AS (
        SELECT strength_volume, cardio_load
        FROM workouts
        WHERE user_id = NEW.user_id
        AND workout_date >= (NEW.workout_date - INTERVAL '7 days')
        AND workout_date <= NEW.workout_date
        ORDER BY workout_date ASC
    )
    SELECT 
        ROUND(COALESCE(AVG(strength_volume), 0)::numeric, 2),
        ROUND(COALESCE(AVG(cardio_load), 0)::numeric, 2)
    INTO 
        v_acute_strength,
        v_acute_cardio
    FROM acute_period_workouts;

    -- Calculate chronic loads (28-day rolling averages)
    WITH chronic_period_workouts AS (
        SELECT strength_volume, cardio_load
        FROM workouts
        WHERE user_id = NEW.user_id
        AND workout_date >= (NEW.workout_date - INTERVAL '28 days')
        AND workout_date <= NEW.workout_date
        ORDER BY workout_date ASC
    )
    SELECT 
        ROUND(COALESCE(AVG(strength_volume), 0)::numeric, 2),
        ROUND(COALESCE(AVG(cardio_load), 0)::numeric, 2)
    INTO 
        v_chronic_strength,
        v_chronic_cardio
    FROM chronic_period_workouts;

    -- Calculate combined loads
    v_combined_acute := v_acute_strength + v_acute_cardio;
    v_combined_chronic := v_chronic_strength + v_chronic_cardio;

    -- Store the acute and chronic loads
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

    -- Update combined ratio calculation using combined loads
    NEW.combined_ratio := CASE 
        WHEN COALESCE(v_combined_chronic, 0) > 0 
        THEN ROUND((v_combined_acute / v_combined_chronic)::numeric, 2)
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

-- Recalculate all existing workouts
UPDATE workouts 
SET strength_volume = strength_volume 
WHERE true;
