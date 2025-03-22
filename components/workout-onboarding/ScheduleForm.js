'use client';

import { useState } from 'react';
import WorkoutTypeSelector from './WorkoutTypeSelector';

const DAYS = [
  { id: 'sunday', label: 'Sun' },
  { id: 'monday', label: 'Mon' },
  { id: 'tuesday', label: 'Tue' },
  { id: 'wednesday', label: 'Wed' },
  { id: 'thursday', label: 'Thu' },
  { id: 'friday', label: 'Fri' },
  { id: 'saturday', label: 'Sat' }
];

const DURATION_OPTIONS = [
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' }
];

export default function ScheduleForm({ schedule, workoutDuration, onChange, onNext, onBack }) {
  const [selectedDays, setSelectedDays] = useState(schedule.filter(day => day !== null).length);
  const [workoutTypes, setWorkoutTypes] = useState(Array(7).fill([]));
  const [editingDay, setEditingDay] = useState(null);

  const handleDayClick = (dayIndex) => {
    if (editingDay === dayIndex) {
      setEditingDay(null);
    } else {
      setEditingDay(dayIndex);
    }
  };

  const handleWorkoutTypeSelect = (dayIndex, selectedWorkouts) => {
    const newWorkoutTypes = [...workoutTypes];
    newWorkoutTypes[dayIndex] = selectedWorkouts;
    setWorkoutTypes(newWorkoutTypes);

    const newSchedule = [...schedule];
    newSchedule[dayIndex] = selectedWorkouts.length > 0 ? dayIndex : null;
    onChange({ schedule: newSchedule, workoutTypes: newWorkoutTypes });
  };

  const handleDayToggle = (dayIndex) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex] = newSchedule[dayIndex] === null ? dayIndex : null;
    onChange({ schedule: newSchedule });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedDays > 0 && workoutDuration) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white">
          Select Workout Days ({selectedDays} selected)
        </h3>
        <div className="grid grid-cols-7 gap-2">
          {DAYS.map((day, index) => (
            <div
              key={day.id}
              className={`min-h-[100px] p-2 rounded-lg transition-all ${
                schedule[index] !== null
                  ? 'bg-gray-50 dark:bg-gray-700'
                  : 'bg-gray-100 dark:bg-gray-800'
              } ${editingDay === index ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => handleDayClick(index)}
            >
              <div className="text-sm font-medium mb-2">{day.label}</div>
              <div className="space-y-1">
                {workoutTypes[index]?.map((workout, i) => (
                  <div
                    key={i}
                    className={`text-xs p-1 rounded ${
                      workout.type === 'Strength'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                        : 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200'
                    }`}
                  >
                    {getWorkoutTypeLabel(workout.type, workout.subtype)}
                  </div>
                ))}
                {workoutTypes[index]?.length === 0 && (
                  <div className="text-xs text-gray-500">Rest</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {editingDay !== null && (
        <WorkoutTypeSelector
          workoutType={workoutTypes[editingDay] || []}
          onSelect={(workouts) => handleWorkoutTypeSelect(editingDay, workouts)}
          onCancel={() => setEditingDay(null)}
        />
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white">
          Average Workout Duration
        </h3>
        <div className="flex flex-wrap gap-2">
          {DURATION_OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange({ workoutDuration: option.value })}
              className={`px-4 py-2 rounded-lg transition-all ${
                workoutDuration === option.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

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
          disabled={selectedDays === 0 || !workoutDuration}
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </form>
  );
}
