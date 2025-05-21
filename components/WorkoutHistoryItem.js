'use client';

import React, { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast from 'react-hot-toast';

const WorkoutHistoryItem = ({ entry, onUpdate }) => {
  const supabase = createClientComponentClient();
  const [showActions, setShowActions] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', entry.id);

      if (error) throw error;
      toast.success('Workout deleted');
      onUpdate();
    } catch (error) {
      console.error('Error deleting workout:', error);
      toast.error('Failed to delete workout');
    }
    setShowConfirmDelete(false);
  };

  return (
    <div 
      className="relative p-3 bg-gray-50 dark:bg-gray-700 rounded-lg group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-800 dark:text-white">
            {entry.workout_date} - Week {entry.training_cycle_week}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Goal: {entry.training_cycle_goal}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Strength: {entry.strength_volume} lbs
            <span className="mx-2">•</span>
            Cardio: {entry.cardio_load}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {entry.workout_type} {entry.subtype ? `(${entry.subtype})` : ''}
          </p>
          {entry.note && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
              {entry.note}
            </p>
          )}
        </div>

        {/* Edit/Delete Actions */}
        {showActions && (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onUpdate(entry)}
              className="p-1 text-gray-500 hover:text-blue-500 transition-colors"
              aria-label="Edit workout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
              </svg>
            </button>
            <button 
              onClick={() => setShowConfirmDelete(true)}
              className="p-1 text-gray-500 hover:text-red-500 transition-colors"
              aria-label="Delete workout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Delete Workout
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this workout? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkoutHistoryItem;
