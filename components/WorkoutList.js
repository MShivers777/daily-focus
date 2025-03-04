'use client';
import { useState } from 'react';

export default function WorkoutList({ workouts }) {
  const [displayCount, setDisplayCount] = useState(14); // Start with 2 weeks
  const LOAD_MORE_COUNT = 14; // Load 2 more weeks at a time

  const groupByWeek = (workouts) => {
    const grouped = {};
    workouts.slice(0, displayCount).forEach(workout => {
      const date = new Date(workout.workout_date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!grouped[weekKey]) {
        grouped[weekKey] = [];
      }
      grouped[weekKey].push(workout);
    });
    return grouped;
  };

  const groupedWorkouts = groupByWeek(workouts);
  const hasMore = workouts.length > displayCount;

  return (
    <div className="space-y-6">
      {Object.entries(groupedWorkouts).map(([weekStart, weekWorkouts]) => (
        <div key={weekStart} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
            Week of {new Date(weekStart).toLocaleDateString()}
          </h3>
          <div className="space-y-2">
            {weekWorkouts.map(workout => (
              <div 
                key={workout.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">
                      {new Date(workout.workout_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p>Strength: {workout.strength_volume} lbs</p>
                      <p>Cardio: {workout.cardio_load}</p>
                    </div>
                  </div>
                  <div className="text-sm text-right">
                    <p className={`font-medium ${
                      workout.strength_ratio < 0.8 ? 'text-yellow-500' :
                      workout.strength_ratio > 1.4 ? 'text-red-500' :
                      'text-green-500'
                    }`}>
                      SR: {workout.strength_ratio?.toFixed(2)}
                    </p>
                    <p className={`font-medium ${
                      workout.cardio_ratio < 0.8 ? 'text-yellow-500' :
                      workout.cardio_ratio > 1.4 ? 'text-red-500' :
                      'text-green-500'
                    }`}>
                      CR: {workout.cardio_ratio?.toFixed(2)}
                    </p>
                  </div>
                </div>
                {workout.note && (
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 italic">
                    {workout.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {hasMore && (
        <button
          onClick={() => setDisplayCount(prev => prev + LOAD_MORE_COUNT)}
          className="w-full p-3 mt-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
        >
          Show More Workouts
        </button>
      )}
    </div>
  );
}
