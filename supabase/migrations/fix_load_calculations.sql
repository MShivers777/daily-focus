-- Add updated_at column if it doesn't exist
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Drop existing function and recreate with fixed calculations
CREATE OR REPLACE FUNCTION calculate_workout_metrics()
RETURNS TRIGGER AS $$
DECLARE
    v_acute_strength numeric;
    v_acute_cardio numeric;
    v_chronic_strength numeric;
    v_chronic_cardio numeric;
BEGIN
    -- Calculate acute loads (7-day rolling averages)
    WITH acute_period_workouts AS (
        SELECT strength_volume, cardio_load
        FROM workouts
        WHERE user_id = NEW.user_id
        AND workout_date >= (NEW.workout_date - INTERVAL '7 days')
        AND workout_date <= NEW.workout_date
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
    )
    SELECT 
        ROUND(COALESCE(AVG(strength_volume), 0)::numeric, 2),
        ROUND(COALESCE(AVG(cardio_load), 0)::numeric, 2)
    INTO 
        v_chronic_strength,
        v_chronic_cardio
    FROM chronic_period_workouts;

    -- Store the acute and chronic loads
    NEW.strength_acute_load := v_acute_strength;
    NEW.cardio_acute_load := v_acute_cardio;
    NEW.strength_chronic_load := v_chronic_strength;
    NEW.cardio_chronic_load := v_chronic_cardio;

    -- Calculate ratios with proper null handling
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

    NEW.combined_ratio := ROUND(((COALESCE(NEW.strength_ratio, 0) + COALESCE(NEW.cardio_ratio, 0)) / 2)::numeric, 2);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- No need to recreate trigger if it exists
-- If you need to recreate the trigger:
-- DROP TRIGGER IF EXISTS workout_metrics_trigger ON workouts;
-- CREATE TRIGGER workout_metrics_trigger
--     BEFORE INSERT OR UPDATE ON workouts
--     FOR EACH ROW
--     EXECUTE FUNCTION calculate_workout_metrics();

-- Modified recalculation section
WITH updated_rows AS (
    SELECT id, workout_date 
    FROM workouts 
    ORDER BY workout_date ASC
)
UPDATE workouts w
SET strength_volume = w.strength_volume  -- This triggers the recalculation without changing the value
WHERE id IN (SELECT id FROM updated_rows);

-- Add trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_workouts_updated_at
    BEFORE UPDATE ON workouts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
