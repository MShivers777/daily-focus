WITH RECURSIVE workouts_with_metrics AS (
  SELECT 
    w.id,
    w.user_id,
    w.workout_date,
    -- Calculate acute loads (7-day averages)
    (
      SELECT ROUND(AVG(COALESCE(w2.strength_volume, 0))::numeric, 2)
      FROM workouts w2
      WHERE w2.user_id = w.user_id
      AND w2.workout_date <= w.workout_date
      AND w2.workout_date > (w.workout_date - INTERVAL '7 days')
    ) as strength_acute_load,
    (
      SELECT ROUND(AVG(COALESCE(w2.cardio_load, 0))::numeric, 2)
      FROM workouts w2
      WHERE w2.user_id = w.user_id
      AND w2.workout_date <= w.workout_date
      AND w2.workout_date > (w.workout_date - INTERVAL '7 days')
    ) as cardio_acute_load,
    -- Calculate chronic loads (28-day averages)
    (
      SELECT ROUND(AVG(COALESCE(w2.strength_volume, 0))::numeric, 2)
      FROM workouts w2
      WHERE w2.user_id = w.user_id
      AND w2.workout_date <= w.workout_date
      AND w2.workout_date > (w.workout_date - INTERVAL '28 days')
    ) as strength_chronic_load,
    (
      SELECT ROUND(AVG(COALESCE(w2.cardio_load, 0))::numeric, 2)
      FROM workouts w2
      WHERE w2.user_id = w.user_id
      AND w2.workout_date <= w.workout_date
      AND w2.workout_date > (w.workout_date - INTERVAL '28 days')
    ) as cardio_chronic_load
  FROM workouts w
  ORDER BY w.workout_date ASC
)
UPDATE workouts w
SET 
  strength_acute_load = wm.strength_acute_load,
  cardio_acute_load = wm.cardio_acute_load,
  strength_chronic_load = wm.strength_chronic_load,
  cardio_chronic_load = wm.cardio_chronic_load,
  strength_ratio = CASE 
    WHEN COALESCE(wm.strength_chronic_load, 0) > 0 
    THEN ROUND((wm.strength_acute_load / wm.strength_chronic_load)::numeric, 2)
    ELSE 0 
  END,
  cardio_ratio = CASE 
    WHEN COALESCE(wm.cardio_chronic_load, 0) > 0 
    THEN ROUND((wm.cardio_acute_load / wm.cardio_chronic_load)::numeric, 2)
    ELSE 0 
  END
FROM workouts_with_metrics wm
WHERE w.id = wm.id;

-- Update combined ratios after individual ratios are calculated
UPDATE workouts
SET combined_ratio = ROUND(((strength_ratio + cardio_ratio) / 2)::numeric, 2);
