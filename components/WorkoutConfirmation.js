'use client';

export default function WorkoutConfirmation({ 
  isOpen, 
  onClose, 
  existingWorkout, 
  newWorkout, 
  onAdd, 
  onReplace, 
  onEdit 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl max-w-2xl w-full m-4 shadow-xl">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Workout Already Exists
        </h3>
        
        <div className="space-y-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
              Existing Workout for {existingWorkout.workout_date}:
            </h4>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <p>Strength Volume: {existingWorkout.strength_volume} lbs</p>
              <p>Cardio Load: {existingWorkout.cardio_load}</p>
              {existingWorkout.note && (
                <p className="italic mt-2">Note: {existingWorkout.note}</p>
              )}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Workout Data:
            </h4>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <p>Strength Volume: {newWorkout.strength_volume} lbs</p>
              <p>Cardio Load: {newWorkout.cardio_load}</p>
              {newWorkout.note && (
                <p className="italic mt-2">Note: {newWorkout.note}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onAdd}
            className="flex-1 p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Add to Day's Totals
          </button>
          <button
            onClick={onReplace}
            className="flex-1 p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            Replace Existing
          </button>
          <button
            onClick={onEdit}
            className="flex-1 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Edit Existing
          </button>
          <button
            onClick={onClose}
            className="flex-1 p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
