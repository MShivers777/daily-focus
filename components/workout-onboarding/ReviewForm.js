'use client';
import { useState } from 'react';
import { DndContext, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function generateWorkoutPlan(formData) {
  const selectedDays = formData.schedule
    .map((day, index) => day !== null ? index : null)
    .filter(day => day !== null);

  // Create two weeks with fixed days but alternating workouts
  return Array(2).fill().map((_, weekIndex) => {
    const weekDays = DAYS.map((day, dayIndex) => ({
      dayIndex,
      dayName: day,
      isSelected: selectedDays.includes(dayIndex),
      workout: selectedDays.includes(dayIndex) ? {
        type: selectedDays.indexOf(dayIndex) % 2 === 0 ? 'Strength' : 'Cardio',
        duration: formData.workoutDuration
      } : null
    }));
    return weekDays;
  });
}

const SortableWorkout = ({ workout, dayName, id }) => {
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
          className={`flex-1 p-2 rounded cursor-move flex items-center justify-between ${
            workout.type === 'Strength' 
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
              : 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200'
          }`}
        >
          <span className="text-sm font-medium">{workout.type}</span>
          <span className="text-sm">{workout.duration} min</span>
        </div>
      )}
    </div>
  );
};

const WorkoutWeek = ({ week, weekIndex, onReorder }) => {
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;

    // Extract day indices from the IDs
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

  const handleReorder = (weekIndex, oldDayIndex, newDayIndex) => {
    setWorkoutPlan(prev => {
      const newPlan = [...prev];
      const week = [...newPlan[weekIndex]];
      
      // Swap workout types between days
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
          <span className="text-sm text-gray-500 ml-2">(drag to reorder)</span>
        </h4>
        <div className="space-y-6">
          {workoutPlan.map((week, weekIndex) => (
            <WorkoutWeek
              key={weekIndex}
              week={week}
              weekIndex={weekIndex}
              onReorder={handleReorder}
            />
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
