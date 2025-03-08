'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import BackIcon from '../../components/icons/BackIcon';

export default function WorkoutPromptsPage() {
  const [workoutTypes, setWorkoutTypes] = useState([]);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchWorkoutTypes = async () => {
      const { data } = await supabase
        .from('workout_types')
        .select('*')
        .order('name');
      
      if (data) {
        setWorkoutTypes(data);
      }
    };

    fetchWorkoutTypes();
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => router.push('/')}
        className="absolute top-0 left-0 p-2 rounded-lg transition-all bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
        aria-label="Back to dashboard"
      >
        <BackIcon />
      </button>
      
      <div className="max-w-4xl mx-auto pt-16">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          Available Workouts
        </h1>
        
        <div className="grid gap-6">
          {workoutTypes.map((workout) => (
            <div key={workout.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                {workout.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {workout.description}
              </p>
              <button
                onClick={() => router.push(`/plan-workout/${workout.id}`)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
              >
                Plan This Workout
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
