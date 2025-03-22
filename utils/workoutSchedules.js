export const BASE_WORKOUT_SCHEDULE = {
  beginner: {
    1: {
      pattern: ['Strength']
    },
    2: {
      pattern: ['Strength', 'Cardio']
    },
    3: {
      pattern: ['Strength', 'Cardio', 'Strength']
    },
    4: {
      pattern: ['Strength', 'Cardio', 'Strength', 'Cardio']
    },
    5: {
      pattern: ['Strength', 'Cardio', 'Strength', 'Cardio', 'Strength']
    },
    6: {
      pattern: ['Strength', 'Cardio', 'Strength', 'Cardio', 'Strength', 'Cardio']
    },
    7: {
      pattern: ['Strength', 'Cardio', 'Strength', 'Cardio', 'Strength', 'Cardio', 'Strength']
    }
  },
  intermediate: {
    1: {
      pattern: ['Strength']
    },
    2: {
      pattern: ['Strength', 'Cardio']
    },
    3: {
      pattern: ['Strength', 'Cardio', 'Strength']
    },
    4: {
      pattern: ['Strength', 'Cardio', 'Strength', 'Cardio']
    },
    5: {
      pattern: ['Strength', 'Cardio', 'Strength', 'Cardio', 'Strength']
    },
    6: {
      pattern: ['Strength', 'Cardio', 'Strength', 'Cardio', 'Strength', 'Cardio']
    },
    7: {
      pattern: ['Strength', 'Cardio', 'Strength', 'Cardio', 'Strength', 'Cardio', 'Strength']
    }
  },
  advanced: {
    1: {
      pattern: ['Strength']
    },
    2: {
      pattern: ['Strength', 'Cardio']
    },
    3: {
      pattern: ['Strength', 'Cardio', 'Strength']
    },
    4: {
      pattern: ['Strength', 'Cardio', 'Strength', 'Cardio']
    },
    5: {
      pattern: ['Strength', 'Cardio', 'Strength', 'Cardio', 'Strength']
    },
    6: {
      pattern: ['Strength', 'Cardio', 'Strength', 'Cardio', 'Strength', 'Cardio']
    },
    7: {
      pattern: ['Strength', 'Cardio', 'Strength', 'Cardio', 'Strength', 'Cardio', 'Strength']
    }
  }
};

// Add specific workout type options
export const STRENGTH_WORKOUT_TYPES = [
  { id: 'full_body', label: 'Full Body' },
  { id: 'upper_body', label: 'Upper Body' },
  { id: 'lower_body', label: 'Lower Body' },
  { id: 'push', label: 'Push' },
  { id: 'pull', label: 'Pull' },
  { id: 'legs', label: 'Legs' },
  { id: 'squats', label: 'Squats' },
  { id: 'deadlifts', label: 'Deadlifts' },
  { id: 'bench', label: 'Bench Press' },
  { id: 'olympic', label: 'Olympic Lifts' },
  { id: 'workout_a', label: 'Workout A' },
  { id: 'workout_b', label: 'Workout B' },
  { id: 'workout_c', label: 'Workout C' }
];

export const CARDIO_WORKOUT_TYPES = [
  { id: 'zone2', label: 'Zone 2' },
  { id: 'intervals', label: 'Intervals' },
  { id: 'hiit', label: 'HIIT' },
  { id: 'sprints', label: 'Sprints' },
  { id: 'hill_sprints', label: 'Hill Sprints' },
  { id: 'steady_state', label: 'Steady State' },
  { id: 'tempo', label: 'Tempo Run' },
  { id: 'long_run', label: 'Long Run' },  // Add this line
  { id: 'cycling', label: 'Cycling' },
  { id: 'swimming', label: 'Swimming' },
  { id: 'rowing', label: 'Rowing' },
  { id: 'cardio_a', label: 'Cardio A' },
  { id: 'cardio_b', label: 'Cardio B' }
];

// Function to get workout type label from ID
export function getWorkoutTypeLabel(type, subtype) {
  if (!type) return 'Unknown';
  if (!subtype) return type;

  if (type === 'Strength') {
    const strengthType = STRENGTH_WORKOUT_TYPES.find(t => t.id === subtype);
    return strengthType ? `${type}: ${strengthType.label}` : `${type}: ${subtype}`;
  } else if (type === 'Cardio') {
    const cardioType = CARDIO_WORKOUT_TYPES.find(t => t.id === subtype);
    return cardioType ? `${type}: ${cardioType.label}` : `${type}: ${subtype}`;
  }

  return type;
}

export function getWorkoutPattern(workoutSettings) {
  if (!workoutSettings) return null;
  
  // First check for custom workout types
  if (workoutSettings.workout_types) {
    if (Array.isArray(workoutSettings.workout_types)) {
      // Handle array-based workout_types
      const pattern = workoutSettings.workout_types
        .filter(Boolean) // Filter out null entries
        .map(dayWorkouts => 
          Array.isArray(dayWorkouts) && dayWorkouts.length > 0 
            ? dayWorkouts[0].type // Just use the first workout's type for pattern
            : null
        )
        .filter(Boolean);
      if (pattern.length > 0) return pattern;
    } else {
      // Handle object-based workout_types (legacy format)
      const pattern = Object.entries(workoutSettings.workout_types)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .map(([_, type]) => type?.type || type);
      if (pattern.length > 0) return pattern;
    }
  }

  // Fall back to default patterns if no custom pattern exists
  const experienceLevel = workoutSettings.training_experience >= 3 
    ? 'advanced' 
    : workoutSettings.training_experience >= 1 
      ? 'intermediate' 
      : 'beginner';
  const daysPerWeek = workoutSettings.schedule.length;
  return BASE_WORKOUT_SCHEDULE[experienceLevel][daysPerWeek]?.pattern;
}

export async function fetchUserWorkoutSettings(supabase, userId) {
  try {
    const { data, error } = await supabase
      .from('user_workout_settings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    
    // Debug log
    console.log('Fetched workout settings:', data);
    if (data?.workout_types) {
      console.log('Workout types structure:', JSON.stringify(data.workout_types, null, 2));
    }
    
    // Ensure workout_types is always an array
    if (data && !Array.isArray(data.workout_types)) {
      data.workout_types = [];
    }

    return data;
  } catch (error) {
    console.error('Error fetching workout settings:', error);
    return null;
  }
}

export function getWorkoutsForDay(dayIndex, settings) {
  if (!settings?.workout_types?.[dayIndex]) return [];
  return settings.workout_types[dayIndex] || [];
}
