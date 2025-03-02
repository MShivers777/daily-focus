-- Update trigger to recalculate loads for all affected dates
CREATE OR REPLACE FUNCTION recalculate_loads_for_date()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate loads for all workouts in the affected date range
    WITH updated_workouts AS (
        SELECT 
            w.id,
            w.user_id,
            w.workout_date,
            w.strength_volume,
            w.cardio_load,
            -- Calculate acute loads (7-day averages)
            (
                SELECT ROUND(AVG(sw.strength_volume)::numeric, 2)
                FROM workouts sw
                WHERE sw.user_id = w.user_id
                AND sw.workout_date <= w.workout_date
                AND sw.workout_date > (w.workout_date - INTERVAL '7 days')
            ) as strength_acute_load,
            (
                SELECT ROUND(AVG(cw.cardio_load)::numeric, 2)
                FROM workouts cw
                WHERE cw.user_id = w.user_id
                AND cw.workout_date <= w.workout_date
                AND cw.workout_date > (w.workout_date - INTERVAL '7 days')
            ) as cardio_acute_load,
            -- Calculate chronic loads (28-day averages)
            (
                SELECT ROUND(AVG(sw.strength_volume)::numeric, 2)
                FROM workouts sw
                WHERE sw.user_id = w.user_id
                AND sw.workout_date <= w.workout_date
                AND sw.workout_date > (w.workout_date - INTERVAL '28 days')
            ) as strength_chronic_load,
            (
                SELECT ROUND(AVG(cw.cardio_load)::numeric, 2)
                FROM workouts cw
                WHERE cw.user_id = w.user_id
                AND cw.workout_date <= w.workout_date
                AND cw.workout_date > (w.workout_date - INTERVAL '28 days')
            ) as cardio_chronic_load
        FROM workouts w
        WHERE w.user_id = NEW.user_id
        AND w.workout_date >= (NEW.workout_date - INTERVAL '28 days')
    )
    UPDATE workouts w
    SET 
        strength_acute_load = uw.strength_acute_load,
        cardio_acute_load = uw.cardio_acute_load,
        strength_chronic_load = uw.strength_chronic_load,
        cardio_chronic_load = uw.cardio_chronic_load,
        strength_ratio = CASE 
            WHEN uw.strength_chronic_load > 0 
            THEN ROUND((uw.strength_acute_load / uw.strength_chronic_load)::numeric, 2)
            ELSE 0 
        END,
        cardio_ratio = CASE 
            WHEN uw.cardio_chronic_load > 0 
            THEN ROUND((uw.cardio_acute_load / uw.cardio_chronic_load)::numeric, 2)
            ELSE 0 
        END,
        combined_ratio = CASE 
            WHEN (uw.strength_chronic_load + uw.cardio_chronic_load) > 0 
            THEN ROUND(((uw.strength_acute_load + uw.cardio_acute_load) / 
                      (uw.strength_chronic_load + uw.cardio_chronic_load))::numeric, 2)
            ELSE 0 
        END
    FROM updated_workouts uw
    WHERE w.id = uw.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS workout_load_calculations ON workouts;
CREATE TRIGGER workout_load_calculations
    AFTER INSERT OR UPDATE OF strength_volume, cardio_load, workout_date
    ON workouts
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_loads_for_date();
