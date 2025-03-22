'use client';

import { useState } from 'react';
import { DndContext, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BASE_WORKOUT_SCHEDULE, STRENGTH_WORKOUT_TYPES, CARDIO_WORKOUT_TYPES } from '../../utils/workoutSchedules';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function generateWorkoutPlan(formData) {
  // Use selected workouts if available, otherwise fall back to default pattern
  if (formData.selectedWorkouts && formData.selectedWorkouts.length > 0) {
    return Array(2).fill().map((_, weekIndex) => {
      return DAYS.map((day, dayIndex) => {
        // Find workouts scheduled for this day
        const dayWorkouts = formData.selectedWorkouts.filter(
          workout => workout.day.toLowerCase() === day.toLowerCase()
        );

        return {
          dayIndex,
          dayName: day,
          isSelected: dayWorkouts.length > 0,
          workout: dayWorkouts.length > 0 ? {
            type: dayWorkouts[0].type,
            subtype: dayWorkouts[0].subtype,
            duration: formData.workoutDuration,
            frequency: dayWorkouts[0].frequency
          } : null
        };
      });
    });
  }

  // Fall back to default pattern if no selected workouts
  const selectedDays = formData.schedule
    .map((day, index) => day !== null ? index : null)
    .filter(day => day !== null);

  let experienceLevel = 'beginner';
  if (formData.trainingExperience >= 3) {
    experienceLevel = 'advanced';
  } else if (formData.trainingExperience >= 1) {
    experienceLevel = 'intermediate';
  }

  const daysPerWeek = selectedDays.length;
  const pattern = BASE_WORKOUT_SCHEDULE[experienceLevel][daysPerWeek]?.pattern || 
    BASE_WORKOUT_SCHEDULE.beginner[3].pattern;

  return Array(2).fill().map((_, weekIndex) => {
    const weekDays = DAYS.map((day, dayIndex) => ({
      dayIndex,
      dayName: day,
      isSelected: selectedDays.includes(dayIndex),
      workout: selectedDays.includes(dayIndex) ? {
        type: pattern[selectedDays.indexOf(dayIndex) % pattern.length],
        subtype: null,
        duration: formData.workoutDuration
      } : null
    }));
    return weekDays;
  });
}

const SortableWorkout = ({ workout, dayName, id, onDoubleClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div className="flex items-center justify-between p-2 rounded">
      <div className="w-20 text-sm font-medium">{dayName}</div>
      {workout && (
        <div
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...listeners}
          onDoubleClick={onDoubleClick}
          className={`flex-1 p-2 rounded cursor-move flex items-center justify-between ${
            workout.type === 'Strength' 
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
              : 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200'
          }`}
        >
          <span className="text-sm font-medium">{workout.type}</span>
          {workout.subtype && (
            <span className="text-xs opacity-75 ml-1">
              : {workout.subtype.replace(/_/g, ' ')}
            </span>
          )}
          <span className="text-sm">{workout.duration} min</span>
        </div>
      )}
    </div>
  );
};

const WorkoutWeek = ({ week, weekIndex, onReorder, onEditWorkout }) => {
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;

    const oldDayIndex = parseInt(active.id.split('-')[2]);
    const newDayIndex = parseInt(over.id.split('-')[2]);
    
    onReorder(weekIndex, oldDayIndex, newDayIndex);
  };

  const sortableItems = week
    .filter(day => day.workout)
    .map(day => `week-${weekIndex}-${day.dayIndex}`);

  return (
    <div>
      <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
        Week {weekIndex + 1}
      </h5>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={sortableItems}>
          <div className="space-y-2">
            {week.map((day) => (
              <SortableWorkout
                key={`week-${weekIndex}-${day.dayIndex}`}
                id={`week-${weekIndex}-${day.dayIndex}`}
                dayName={day.dayName}
                workout={day.workout}
                onDoubleClick={() => onEditWorkout(weekIndex, day.dayIndex)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default function ReviewForm({ formData, onBack, onSubmit }) {
  const [workoutPlan, setWorkoutPlan] = useState(() => 
    generateWorkoutPlan(formData)
  );
  const [editingWorkout, setEditingWorkout] = useState(null);

  const handleReorder = (weekIndex, oldDayIndex, newDayIndex) => {
    setWorkoutPlan(prev => {
      const newPlan = [...prev];
      const week = [...newPlan[weekIndex]];
      
      const oldWorkout = week[oldDayIndex].workout;
      const newWorkout = week[newDayIndex].workout;
      
      if (oldWorkout && newWorkout) {
        week[oldDayIndex] = { ...week[oldDayIndex], workout: newWorkout };
        week[newDayIndex] = { ...week[newDayIndex], workout: oldWorkout };
      }
      
      newPlan[weekIndex] = week;
      return newPlan;
    });
  };

  const handleEditWorkout = (weekIndex, dayIndex) => {
    setEditingWorkout({ weekIndex, dayIndex, ...workoutPlan[weekIndex][dayIndex].workout });
  };

  const handleSaveWorkoutEdit = () => {
    setWorkoutPlan(prev => {
      const newPlan = [...prev];
      const { weekIndex, dayIndex, ...updatedWorkout } = editingWorkout;
      newPlan[weekIndex][dayIndex].workout = updatedWorkout;
      return newPlan;
    });
    setEditingWorkout(null);
  };

  const handleCancelWorkoutEdit = () => {
    setEditingWorkout(null);
  };

  const selectedDays = formData.schedule.filter(day => day !== null).length;

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
          Workout Plan Review
        </h3>

        {/* Goals Section */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
          <h4 className="font-medium mb-2">Your Goals</h4>
          <div className="flex flex-wrap gap-2">
            {formData.goals.map(goal => (
              <span key={goal} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded text-sm">
                {goal.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* Schedule Section */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
          <h4 className="font-medium mb-2">Weekly Schedule</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {selectedDays} workout{selectedDays !== 1 ? 's' : ''} per week
            ({formData.workoutDuration} minutes each)
          </p>
          <div className="grid grid-cols-7 gap-2 text-center text-sm">
            {DAYS.map((day, index) => (
              <div key={day} className={`p-2 rounded ${
                formData.schedule[index] !== null
                  ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200'
                  : 'text-gray-400 dark:text-gray-500'
              }`}>
                {day.slice(0, 3)}
              </div>
            ))}
          </div>
        </div>

        {/* Experience & Metrics Section */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
          <h4 className="font-medium mb-2">Experience & Baselines</h4>
          <div className="space-y-2 text-sm">
            <p>Training Experience: {getExperienceText(formData.trainingExperience)}</p>
            {formData.heartRates?.resting && (
              <p>Resting Heart Rate: {formData.heartRates.resting} bpm</p>
            )}
            {formData.heartRates?.max && (
              <p>Maximum Heart Rate: {formData.heartRates.max} bpm</p>
            )}
            {formData.baselines?.length > 0 && (
              <div className="mt-2">
                <p className="font-medium mb-1">Recent Performances:</p>
                <ul className="list-disc list-inside pl-2">
                  {formData.baselines.map((baseline, index) => (
                    <li key={index}>
                      {baseline.type === 'strength' 
                        ? `${baseline.metric}: ${baseline.weight}lbs x ${baseline.reps} reps`
                        : `${baseline.metric}: ${baseline.time}`
                      }
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Workout Plan Section */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
        <h4 className="font-medium mb-4">
          2-Week Sample Schedule
          <span className="text-sm text-gray-500 ml-2">(Drag to reorder. Double click to change workout type.)</span>
        </h4>
        <div className="space-y-6">
          {workoutPlan.map((week, weekIndex) => (
            <WorkoutWeek
              key={weekIndex}
              week={week}
              weekIndex={weekIndex}
              onReorder={handleReorder}
              onEditWorkout={handleEditWorkout}
            />
          ))}
        </div>
      </div>

      {/* Edit Workout Modal */}
      {editingWorkout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 text-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Edit Workout</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Workout Type
                </label>
                <select
                  value={editingWorkout.type}
                  onChange={(e) => setEditingWorkout(prev => ({ ...prev, type: e.target.value, subtype: null }))}
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
                  value={editingWorkout.subtype || ''}
                  onChange={(e) => setEditingWorkout(prev => ({ ...prev, subtype: e.target.value }))}
                  className="w-full p-2 rounded-lg bg-gray-700 text-white"
                >
                  <option value="">General</option>
                  {(editingWorkout.type === 'Strength'
                    ? STRENGTH_WORKOUT_TYPES
                    : CARDIO_WORKOUT_TYPES
                  ).map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={handleCancelWorkoutEdit}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWorkoutEdit}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Save
              </button>
            </div>
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
          onClick={onSubmit}
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Complete Setup
        </button>
      </div>
    </div>
  );
}

function getExperienceText(level) {
  switch (level) {
    case 0: return 'Just starting out';
    case 1: return 'Less than 6 months';
    case 2: return '6-12 months';
    case 3: return '1-2 years';
    case 4: return '2-5 years';
    case 5: return '5+ years';
    default: return 'Not specified';
  }
}
