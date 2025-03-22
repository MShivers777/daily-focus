'use client';

import { useState } from 'react';
import { STRENGTH_WORKOUT_TYPES, CARDIO_WORKOUT_TYPES } from '../../utils/workoutSchedules';

const FREQUENCY_OPTIONS = [
  { value: 'once', label: 'Once' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'every_other_day', label: 'Every Other Day' },
  { value: 'every_third_day', label: 'Every Third Day' }
];

const DAYS_OF_WEEK = [
  { value: 'sunday', label: 'Sunday' },
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' }
];

export default function WorkoutSelectionForm({ selectedWorkouts, onChange, onNext, onBack }) {
  const [workouts, setWorkouts] = useState(selectedWorkouts || []);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editDetails, setEditDetails] = useState({ day: '', frequency: 'once' });

  const handleAddWorkout = (type, subtype) => {
    setWorkouts(prev => [...prev, { type, subtype, day: '', frequency: 'once' }]);
  };

  const handleRemoveWorkout = (index) => {
    setWorkouts(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditWorkout = (index) => {
    const workout = workouts[index];
    setEditingIndex(index);
    setEditDetails({ day: workout.day || '', frequency: workout.frequency || 'once' });
  };

  const handleSaveEdit = () => {
    setWorkouts(prev => {
      const updatedWorkouts = [...prev];
      updatedWorkouts[editingIndex] = {
        ...updatedWorkouts[editingIndex],
        day: editDetails.day,
        frequency: editDetails.frequency
      };
      return updatedWorkouts;
    });
    setEditingIndex(null);
    setEditDetails({ day: '', frequency: 'once' });
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditDetails({ day: '', frequency: 'once' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onChange(workouts);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white">
          Select Workouts
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              Strength Workouts
            </h4>
            <div className="space-y-2">
              {STRENGTH_WORKOUT_TYPES.map(workout => (
                <button
                  key={workout.id}
                  type="button"
                  onClick={() => handleAddWorkout('Strength', workout.id)}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  {workout.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              Cardio Workouts
            </h4>
            <div className="space-y-2">
              {CARDIO_WORKOUT_TYPES.map(workout => (
                <button
                  key={workout.id}
                  type="button"
                  onClick={() => handleAddWorkout('Cardio', workout.id)}
                  className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  {workout.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white">
          Selected Workouts
        </h3>
        {workouts.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">No workouts selected.</p>
        ) : (
          <ul className="space-y-2">
            {workouts.map((workout, index) => (
              <li
                key={index}
                className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded-lg"
              >
                <div>
                  <span className="text-sm text-gray-800 dark:text-gray-200">
                    {workout.type}: {workout.subtype}
                  </span>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {workout.day ? `Day: ${workout.day}` : 'No day set'} | Frequency: {workout.frequency}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditWorkout(index)}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveWorkout(index)}
                    className="text-red-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editingIndex !== null && (
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-800 dark:text-white mb-2">
            Edit Workout Details
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Day of the Week
              </label>
              <select
                value={editDetails.day}
                onChange={(e) => setEditDetails(prev => ({ ...prev, day: e.target.value }))}
                className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select a Day</option>
                {DAYS_OF_WEEK.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Frequency
              </label>
              <select
                value={editDetails.frequency}
                onChange={(e) => setEditDetails(prev => ({ ...prev, frequency: e.target.value }))}
                className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
              >
                {FREQUENCY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          Back
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Next
        </button>
      </div>
    </form>
  );
}
