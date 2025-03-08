'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function WorkoutSummary() {
  const [todayWorkout, setTodayWorkout] = useState(null);
  const [plannedWorkout, setPlannedWorkout] = useState(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchWorkouts = async () => {
      const today = new Date().toISOString().split('T')[0];

      // Check completed workouts for today
      const { data: completedWorkout } = await supabase
        .from('workouts')
        .select('*')
        .eq('date', today)
        .single();

      // Check planned workouts for today
      const { data: plannedWorkout } = await supabase
        .from('planned_workouts')
        .select('*')
        .eq('date', today)
        .single();

      setTodayWorkout(completedWorkout);
      setPlannedWorkout(plannedWorkout);
    };

    fetchWorkouts();
  }, []);

  if (todayWorkout) {
    return (
      <div className="space-y-4">
        <div className="bg-green-100 dark:bg-green-800 p-4 rounded-lg">
          <div className="text-sm text-green-800 dark:text-green-200">Completed Today</div>
          <div className="font-semibold text-green-900 dark:text-green-100">
            {todayWorkout.workout_name}
          </div>
        </div>
      </div>
    );
  }

  if (plannedWorkout) {
    return (
      <div className="space-y-4">
        <div className="bg-blue-100 dark:bg-blue-800 p-4 rounded-lg">
          <div className="text-sm text-blue-800 dark:text-blue-200">Planned for Today</div>
          <div className="font-semibold text-blue-900 dark:text-blue-100">
            {plannedWorkout.workout_name}
          </div>
          <button
            className="mt-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
            onClick={() => {/* Add completion logic */}}
          >
            Mark as Complete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-gray-600 dark:text-gray-400">
      No workout planned for today. Add one to get started!
    </div>
  );
}
