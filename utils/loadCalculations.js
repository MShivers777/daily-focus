function calculateAverageLoad(workouts, currentDate, days, loadType) {
  const relevantWorkouts = workouts
    .filter(w => {
      const workoutDate = new Date(w.workout_date);
      const cutoffDate = new Date(currentDate);
      cutoffDate.setDate(cutoffDate.getDate() - days);
      return workoutDate >= cutoffDate && workoutDate <= new Date(currentDate);
    });

  if (relevantWorkouts.length === 0) return 0;

  const sum = relevantWorkouts.reduce((acc, workout) => {
    return acc + (loadType === 'strength' ? workout.strength_volume : workout.cardio_load);
  }, 0);

  return sum / (days + 1); // +1 to include current day
}

export function calculateLoads(workouts, deloadFrequency = 4) {  // Add deloadFrequency parameter
  const processedWorkouts = workouts.map(currentWorkout => {
    const workoutDate = currentWorkout.workout_date;
    
    // Calculate Strength Loads
    const strengthAcuteLoad = calculateAverageLoad(workouts, workoutDate, 6, 'strength');
    const strengthChronicLoad = calculateAverageLoad(workouts, workoutDate, 27, 'strength');
    const strengthRatio = strengthChronicLoad > 0 ? strengthAcuteLoad / strengthChronicLoad : 0;

    // Calculate Cardio Loads
    const cardioAcuteLoad = calculateAverageLoad(workouts, workoutDate, 6, 'cardio');
    const cardioChronicLoad = calculateAverageLoad(workouts, workoutDate, 27, 'cardio');
    const cardioRatio = cardioChronicLoad > 0 ? cardioAcuteLoad / cardioChronicLoad : 0;

    // Calculate Combined Ratio
    const combinedRatio = (strengthRatio + cardioRatio) / 2;

    return {
      ...currentWorkout,
      strength_acute_load: strengthAcuteLoad,
      strength_chronic_load: strengthChronicLoad,
      strength_ratio: strengthRatio,
      cardio_acute_load: cardioAcuteLoad,
      cardio_chronic_load: cardioChronicLoad,
      cardio_ratio: cardioRatio,
      combined_ratio: combinedRatio
    };
  });

  // Update the targetRatio function to be inside calculateLoads scope
  const targetRatio = (workoutDate, currentRatio) => {
    // Check if current week is a deload week
    const workoutWeek = Math.floor(
      (new Date(workoutDate) - new Date(workouts[0]?.workout_date || workoutDate)) / 
      (7 * 24 * 60 * 60 * 1000)
    );
    
    const isDeloadWeek = workoutWeek > 0 && workoutWeek % deloadFrequency === 0;
    
    if (isDeloadWeek) {
      return 0.8; // Lower ratio for deload weeks
    }
    
    return Math.min(1.4, Math.max(1.0, currentRatio + 0.05));
  };

  // Calculate loads with automatic ratio management
  workouts.forEach((workout, index) => {
    if (index > 0) {
      const prevWorkout = processedWorkouts[index - 1];
      const target = targetRatio(workout.workout_date, prevWorkout.combined_ratio || 1.0);
      
      if (target !== 0.8) { // Skip adjustment during deload weeks
        const ratioAdjustment = target / (prevWorkout.combined_ratio || 1.0);
        workout.strength_volume = Math.round(workout.strength_volume * ratioAdjustment);
        workout.cardio_load = Math.round(workout.cardio_load * ratioAdjustment);
      }
    }
  });

  return processedWorkouts;
}

export function previewWorkoutLoads(existingWorkouts, newWorkout) {
  // Create a copy of workouts with the new/updated workout
  const allWorkouts = [...existingWorkouts];
  const existingIndex = allWorkouts.findIndex(w => w.workout_date === newWorkout.workout_date);
  
  if (existingIndex >= 0) {
    allWorkouts[existingIndex] = newWorkout;
  } else {
    allWorkouts.push(newWorkout);
  }

  // Use default deload frequency of 4 weeks for preview
  return calculateLoads(allWorkouts, 4).find(w => w.workout_date === newWorkout.workout_date);
}

export function validateLoads(clientLoads, serverLoads, tolerance = 0.01) {
  const keys = [
    'strength_acute_load',
    'strength_chronic_load',
    'strength_ratio',
    'cardio_acute_load',
    'cardio_chronic_load',
    'cardio_ratio',
    'combined_ratio'
  ];

  return keys.every(key => 
    Math.abs((clientLoads[key] || 0) - (serverLoads[key] || 0)) < tolerance
  );
}
