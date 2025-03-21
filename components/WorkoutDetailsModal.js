'use client';

export default function WorkoutDetailsModal({ workouts, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 text-white rounded-lg shadow-lg max-w-md w-full p-6">
        <h3 className="text-lg font-semibold mb-4">Workout Details</h3>
        <div className="space-y-4">
          {workouts.map((workout, index) => (
            <div 
              key={index} 
              className={`p-4 rounded ${
                workout.type === 'Strength' ? 'bg-blue-900/40' : 'bg-orange-900/40'
              }`}
            >
              <p className="text-sm font-medium">
                {workout.type}: {workout.subtype || 'General'}
              </p>
              {workout.strength_volume > 0 && (
                <p className="text-xs text-green-400">
                  Strength Volume: {workout.strength_volume}
                </p>
              )}
              {workout.cardio_load > 0 && (
                <p className="text-xs text-red-400">
                  Cardio Load: {workout.cardio_load}
                </p>
              )}
              {workout.note && (
                <p className="text-xs text-gray-300 mt-2">
                  Note: {workout.note}
                </p>
              )}
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
