'use client';

import { useState } from 'react';
import { STRENGTH_WORKOUT_TYPES, CARDIO_WORKOUT_TYPES } from '../utils/workoutSchedules';

export default function WorkoutTypeSelector({ 
  workoutType,  // This is now expected to be an array
  onSelect, 
  onCancel 
}) {
  const [selectedWorkouts, setSelectedWorkouts] = useState(
    Array.isArray(workoutType) ? workoutType : []
  );
  const [currentType, setCurrentType] = useState('Strength');
  const [currentSubtype, setCurrentSubtype] = useState('');
  
  const handleAddWorkout = () => {
    if (!currentType) return;
    
    setSelectedWorkouts(prev => [
      ...prev, 
      { type: currentType, subtype: currentSubtype || null }
    ]);
    
    // Reset subtype but keep the type for adding another
    setCurrentSubtype('');
  };
  
  const handleRemoveWorkout = (index) => {
    setSelectedWorkouts(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSave = () => {
    onSelect(selectedWorkouts); // Always passing an array
  };
  
  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow-lg max-h-[80vh] overflow-y-auto">
      <h3 className="text-lg font-semibold text-white mb-3">
        Schedule Workouts
      </h3>
      
      {/* Selected workouts */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Selected Workouts</h4>
        {selectedWorkouts.length === 0 ? (
          <div className="text-gray-400 text-sm italic">No workouts selected (rest day)</div>
        ) : (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {selectedWorkouts.map((workout, index) => (
              <div 
                key={index} 
                className={`flex justify-between items-center p-2 rounded ${
                  workout.type === 'Strength'
                    ? 'bg-blue-900/40'
                    : 'bg-orange-900/40'
                }`}
              >
                <span className="text-sm text-white">
                  {workout.type}
                  {workout.subtype && (
                    <span className="text-xs opacity-75 ml-1">
                      : {workout.subtype.replace(/_/g, ' ')}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveWorkout(index)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="border-t border-gray-700 pt-4 mb-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Add Workout</h4>
        
        {/* Main workout type selection */}
        <div className="mb-4">
          <div className="flex space-x-2 mb-3">
            <button
              type="button"
              onClick={() => setCurrentType('Strength')}
              className={`px-4 py-2 rounded-lg ${
                currentType === 'Strength'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-200'
              }`}
            >
              Strength
            </button>
            <button
              type="button"
              onClick={() => setCurrentType('Cardio')}
              className={`px-4 py-2 rounded-lg ${
                currentType === 'Cardio'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-700 text-gray-200'
              }`}
            >
              Cardio
            </button>
          </div>
        </div>
        
        {/* Subtype selection */}
        {currentType && (
          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Choose Specific Workout Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
              {(currentType === 'Strength' ? STRENGTH_WORKOUT_TYPES : CARDIO_WORKOUT_TYPES).map((type) => (
                <button
                  key={type.id}
                  onClick={() => setCurrentSubtype(type.id)}
                  className={`px-2 py-1 text-sm rounded-lg transition-colors ${
                    currentSubtype === type.id
                      ? currentType === 'Strength'
                        ? 'bg-blue-600 text-white'
                        : 'bg-orange-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Add button */}
        <button
          type="button"
          onClick={handleAddWorkout}
          className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 mb-4"
        >
          Add Workout
        </button>
      </div>
      
      {/* Action buttons */}
      <div className="flex justify-end space-x-2 mt-4 border-t border-gray-700 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Save Day
        </button>
      </div>
    </div>
  );
}
