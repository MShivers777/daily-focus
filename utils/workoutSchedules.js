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

export function getWorkoutPattern(experienceLevel, daysPerWeek) {
  return BASE_WORKOUT_SCHEDULE[experienceLevel]?.[daysPerWeek]?.pattern || 
    BASE_WORKOUT_SCHEDULE.beginner[3].pattern;
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
    return data;
  } catch (error) {
    console.error('Error fetching workout settings:', error);
    return null;
  }
}
