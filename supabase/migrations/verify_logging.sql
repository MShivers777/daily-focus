-- Test if logging is working
DO $$
BEGIN
  RAISE NOTICE 'Test log message - start';
  
  -- Get a single workout's values
  DECLARE
    test_workout RECORD;
  BEGIN
    SELECT 
      workout_date,
      strength_volume,
      cardio_load,
      strength_ratio,
      cardio_ratio,
      combined_ratio
    INTO test_workout
    FROM workouts 
    ORDER BY workout_date DESC 
    LIMIT 1;
    
    RAISE NOTICE 'Workout date: %, Strength: %, Cardio: %, Ratios: % / % / %', 
      test_workout.workout_date,
      test_workout.strength_volume,
      test_workout.cardio_load,
      test_workout.strength_ratio,
      test_workout.cardio_ratio,
      test_workout.combined_ratio;
  END;
  
  RAISE NOTICE 'Test log message - end';
END $$;
