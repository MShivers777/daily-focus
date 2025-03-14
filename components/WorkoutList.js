'use client';

export default function WorkoutList({ workouts }) {
  return (
    <div className="space-y-4">
      {workouts.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
          No planned workouts yet
        </p>
      ) : (
        workouts.map((workout) => (
          <div 
            key={workout.id} 
            className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(workout.planned_date).toLocaleDateString()}
                </p>
                {workout.workoutType === 'cardio' && workout.cardio?.type && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Cardio: {workout.cardio.type === 'custom' ? 
                      workout.cardio.customType : 
                      workout.cardio.type}
                  </p>
                )}
                {workout.workoutType === 'strength' && workout.strength?.type && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Strength: {workout.strength.type === 'custom' ? 
                      workout.strength.customType : 
                      workout.strength.type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    {workout.strength_volume && ` - ${workout.strength_volume} lbs`}
                  </p>
                )}
                {workout.strength_volume > 0 && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Strength: {workout.strength_volume} lbs
                  </p>
                )}
                {workout.cardio_load > 0 && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Cardio Load: {workout.cardio_load}
                  </p>
                )}
                {workout.note && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {workout.note}
                  </p>
                )}
              </div>
              <button
                onClick={() => onDelete?.(workout.id)}
                className="text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
