-- Drop everything and start fresh
DROP TRIGGER IF EXISTS workout_metrics_trigger ON workouts;
DROP FUNCTION IF EXISTS calculate_workout_metrics CASCADE;

-- Recreate the original working function
CREATE OR REPLACE FUNCTION calculate_workout_metrics()
RETURNS TRIGGER AS $$
DECLARE
    v_acute_strength numeric;
    v_acute_cardio numeric;
    v_chronic_strength numeric;
    v_chronic_cardio numeric;
BEGIN
    -- Calculate acute loads (7-day averages)
    SELECT 
        ROUND(AVG(COALESCE(strength_volume, 0))::numeric, 2),
        ROUND(AVG(COALESCE(cardio_load, 0))::numeric, 2)
    INTO 
        v_acute_strength,
        v_acute_cardio
    FROM workouts
    WHERE user_id = NEW.user_id
        AND workout_date <= NEW.workout_date
        AND workout_date > (NEW.workout_date - INTERVAL '7 days');

    -- Calculate chronic loads (28-day averages)
    SELECT 
        ROUND(AVG(COALESCE(strength_volume, 0))::numeric, 2),
        ROUND(AVG(COALESCE(cardio_load, 0))::numeric, 2)
    INTO 
        v_chronic_strength,
        v_chronic_cardio
    FROM workouts
    WHERE user_id = NEW.user_id
        AND workout_date <= NEW.workout_date
        AND workout_date > (NEW.workout_date - INTERVAL '28 days');

    -- Set the calculated values
    NEW.strength_acute_load := COALESCE(v_acute_strength, 0);
    NEW.cardio_acute_load := COALESCE(v_acute_cardio, 0);
    NEW.strength_chronic_load := COALESCE(v_chronic_strength, 0);
    NEW.cardio_chronic_load := COALESCE(v_chronic_cardio, 0);

    -- Calculate ratios
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

    -- Set combined ratio as average of the two ratios
    NEW.combined_ratio := ROUND((COALESCE(NEW.strength_ratio, 0) + COALESCE(NEW.cardio_ratio, 0)) / 2, 2);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER workout_metrics_trigger
    BEFORE INSERT OR UPDATE ON workouts
    FOR EACH ROW
    EXECUTE FUNCTION calculate_workout_metrics();

-- Force recalculate everything
UPDATE workouts SET updated_at = NOW() WHERE true;
