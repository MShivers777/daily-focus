-- Drop existing trigger
DROP TRIGGER IF EXISTS workout_metrics_trigger ON workouts;
DROP FUNCTION IF EXISTS calculate_workout_metrics CASCADE;

-- Create new function with chronological calculations
CREATE OR REPLACE FUNCTION calculate_workout_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate metrics for all workouts in the affected date range
    WITH RECURSIVE
    -- Get all workouts that need recalculation (from 28 days before the new workout)
    workouts_to_update AS (
        SELECT 
            w.id,
            w.user_id,
            w.workout_date,
            w.strength_volume,
            w.cardio_load
        FROM workouts w
        WHERE w.user_id = NEW.user_id
        AND w.workout_date >= (NEW.workout_date - INTERVAL '28 days')
        ORDER BY w.workout_date ASC
    ),
    -- Calculate acute and chronic loads for each workout
    calculated_loads AS (
        SELECT 
            w.id,
            w.workout_date,
            -- Acute loads (7-day rolling average)
            ROUND((
                SELECT COALESCE(AVG(w2.strength_volume), 0)
                FROM workouts w2
                WHERE w2.user_id = w.user_id
                AND w2.workout_date <= w.workout_date
                AND w2.workout_date > (w.workout_date - INTERVAL '7 days')
            )::numeric, 2) as strength_acute_load,
            ROUND((
                SELECT COALESCE(AVG(w2.cardio_load), 0)
                FROM workouts w2
                WHERE w2.user_id = w.user_id
                AND w2.workout_date <= w.workout_date
                AND w2.workout_date > (w.workout_date - INTERVAL '7 days')
            )::numeric, 2) as cardio_acute_load,
            -- Chronic loads (28-day rolling average)
            ROUND((
                SELECT COALESCE(AVG(w2.strength_volume), 0)
                FROM workouts w2
                WHERE w2.user_id = w.user_id
                AND w2.workout_date <= w.workout_date
                AND w2.workout_date > (w.workout_date - INTERVAL '28 days')
            )::numeric, 2) as strength_chronic_load,
            ROUND((
                SELECT COALESCE(AVG(w2.cardio_load), 0)
                FROM workouts w2
                WHERE w2.user_id = w.user_id
                AND w2.workout_date <= w.workout_date
                AND w2.workout_date > (w.workout_date - INTERVAL '28 days')
            )::numeric, 2) as cardio_chronic_load
        FROM workouts_to_update w
    )
    -- Update all affected workouts with new calculations
    UPDATE workouts w
    SET 
        strength_acute_load = c.strength_acute_load,
        cardio_acute_load = c.cardio_acute_load,
        strength_chronic_load = c.strength_chronic_load,
        cardio_chronic_load = c.cardio_chronic_load,
        strength_ratio = CASE 
            WHEN c.strength_chronic_load > 0 
            THEN ROUND((c.strength_acute_load / c.strength_chronic_load)::numeric, 2)
            ELSE 0 
        END,
        cardio_ratio = CASE 
            WHEN c.cardio_chronic_load > 0 
            THEN ROUND((c.cardio_acute_load / c.cardio_chronic_load)::numeric, 2)
            ELSE 0 
        END,
        combined_ratio = CASE 
            WHEN (c.strength_chronic_load + c.cardio_chronic_load) > 0 
            THEN ROUND(((c.strength_acute_load + c.cardio_acute_load) / 
                       (c.strength_chronic_load + c.cardio_chronic_load))::numeric, 2)
            ELSE 0 
        END
    FROM calculated_loads c
    WHERE w.id = c.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger that runs after any workout changes
CREATE TRIGGER workout_metrics_trigger
    AFTER INSERT OR UPDATE OF workout_date, strength_volume, cardio_load
    ON workouts
    FOR EACH ROW
    EXECUTE FUNCTION calculate_workout_metrics();

-- Recalculate all existing workouts
WITH updated_rows AS (
    SELECT id FROM workouts ORDER BY workout_date ASC
)
UPDATE workouts
SET updated_at = NOW()
WHERE id IN (SELECT id FROM updated_rows);
