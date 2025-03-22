'use client';

import { useState } from 'react';
import { STRENGTH_WORKOUT_TYPES, CARDIO_WORKOUT_TYPES } from '../utils/workoutSchedules';

export default function WorkoutDetailsModal({ workouts, onClose, onUpdate }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedWorkout, setEditedWorkout] = useState(null);

  const handleEditClick = (index) => {
    setEditingIndex(index);
    setEditedWorkout({ ...workouts[index] });
  };

  const handleSaveEdit = () => {
    const updatedWorkouts = [...workouts];
    updatedWorkouts[editingIndex] = editedWorkout;
    onUpdate(updatedWorkouts);
    setEditingIndex(null);
    setEditedWorkout(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditedWorkout(null);
  };

  const handleFieldChange = (field, value) => {
    setEditedWorkout((prev) => ({ ...prev, [field]: value }));
  };

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
              {editingIndex === index ? (
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Workout Type
                    </label>
                    <select
                      value={editedWorkout.type}
                      onChange={(e) => handleFieldChange('type', e.target.value)}
                      className="w-full p-2 rounded-lg bg-gray-700 text-white"
                    >
                      <option value="Strength">Strength</option>
                      <option value="Cardio">Cardio</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Subtype
                    </label>
                    <select
                      value={editedWorkout.subtype || ''}
                      onChange={(e) => handleFieldChange('subtype', e.target.value)}
                      className="w-full p-2 rounded-lg bg-gray-700 text-white"
                    >
                      <option value="">General</option>
                      {(editedWorkout.type === 'Strength'
                        ? STRENGTH_WORKOUT_TYPES
                        : CARDIO_WORKOUT_TYPES
                      ).map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Strength Volume
                    </label>
                    <input
                      type="number"
                      value={editedWorkout.strength_volume || ''}
                      onChange={(e) =>
                        handleFieldChange('strength_volume', parseInt(e.target.value) || 0)
                      }
                      className="w-full p-2 rounded-lg bg-gray-700 text-white"
                      disabled={editedWorkout.type !== 'Strength'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Cardio Load
                    </label>
                    <input
                      type="number"
                      value={editedWorkout.cardio_load || ''}
                      onChange={(e) =>
                        handleFieldChange('cardio_load', parseInt(e.target.value) || 0)
                      }
                      className="w-full p-2 rounded-lg bg-gray-700 text-white"
                      disabled={editedWorkout.type !== 'Cardio'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Note
                    </label>
                    <textarea
                      value={editedWorkout.note || ''}
                      onChange={(e) => handleFieldChange('note', e.target.value)}
                      className="w-full p-2 rounded-lg bg-gray-700 text-white"
                      rows="2"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div>
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
                    <p className="text-xs text-gray-300 mt-2">Note: {workout.note}</p>
                  )}
                  <button
                    onClick={() => handleEditClick(index)}
                    className="mt-2 text-blue-400 hover:text-blue-500 text-xs"
                  >
                    Edit
                  </button>
                </div>
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
