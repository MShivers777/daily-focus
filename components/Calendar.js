'use client';

import React, { useState, useEffect } from 'react'; // Import React
import { getWorkoutTypeLabel } from '../utils/workoutSchedules';

function Calendar({ workouts = [], selectedDate, onSelectDate, onDoubleClickWorkout }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);

  // Generate calendar days for the current month view
  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Get the first day of the month
    const firstDay = new Date(Date.UTC(year, month, 1));
    const startingDayOfWeek = firstDay.getUTCDay();

    // Get the last day of the month
    const lastDay = new Date(Date.UTC(year, month + 1, 0));
    const daysInMonth = lastDay.getUTCDate();

    // Create array for all calendar days (including padding)
    const days = [];

    // Add padding days from previous month
    const prevMonthLastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(Date.UTC(year, month - 1, prevMonthLastDay - i)),
        isCurrentMonth: false,
        isToday: false
      });
    }

    // Add days from current month
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(Date.UTC(year, month, i));
      days.push({
        date,
        isCurrentMonth: true,
        isToday:
          date.getUTCDate() === today.getUTCDate() &&
          date.getUTCMonth() === today.getUTCMonth() &&
          date.getUTCFullYear() === today.getUTCFullYear()
      });
    }

    // Add padding days from next month
    const daysNeeded = 42 - days.length; // 6 rows of 7 days
    for (let i = 1; i <= daysNeeded; i++) {
      days.push({
        date: new Date(Date.UTC(year, month + 1, i)),
        isCurrentMonth: false,
        isToday: false
      });
    }

    setCalendarDays(days);
  }, [currentMonth]);

  // Get workouts for a specific day - include both planned and completed workouts
  const getWorkoutsForDay = (date) => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    return workouts.filter(workout => {
      const workoutDate = new Date(workout.date).toISOString().split('T')[0];
      return workoutDate === dateString;
    });
  };

  // Debug log to verify the workouts for each day
  console.log('Workouts for calendar:', workouts);

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentMonth(prevState => {
      const year = prevState.getUTCFullYear();
      const month = prevState.getUTCMonth();
      return new Date(Date.UTC(year, month - 1, 1));
    });
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(prevState => {
      const year = prevState.getUTCFullYear();
      const month = prevState.getUTCMonth();
      return new Date(Date.UTC(year, month + 1, 1));
    });
  };

  // Get today's date
  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Format date for display
  const formatMonthYear = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="w-full bg-gray-900 text-white rounded-lg p-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">
          {formatMonthYear(currentMonth)}
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={goToToday}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Today
          </button>
          <button
            onClick={prevMonth}
            className="p-1 rounded-full hover:bg-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextMonth}
            className="p-1 rounded-full hover:bg-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-1 text-center">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-gray-400 text-xs font-medium py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, idx) => {
          const dayWorkouts = getWorkoutsForDay(day.date);

          // Safe selected date comparison
          const isSelected = selectedDate && day.date &&
            day.date.getUTCFullYear() === selectedDate.getUTCFullYear() &&
            day.date.getUTCMonth() === selectedDate.getUTCMonth() &&
            day.date.getUTCDate() === selectedDate.getUTCDate();

          return (
            <div
              key={idx}
              onClick={() => onSelectDate(day.date)}
              onDoubleClick={() => {
                // Trigger modal for the entire day
                if (dayWorkouts.length > 0) {
                  onDoubleClickWorkout(dayWorkouts);
                }
              }}
              className={`
                relative h-32 p-2 border border-gray-700 rounded-md 
                ${!day.isCurrentMonth ? 'bg-gray-800 opacity-50' : 'bg-gray-900'}
                ${isSelected ? 'ring-2 ring-blue-500' : ''}
                ${day.isToday ? 'border-blue-500' : ''}
                hover:bg-gray-700 cursor-pointer transition-colors
              `}
            >
              <div className={`
                text-xs font-medium 
                ${day.isToday ? 'text-blue-400' : 'text-gray-400'}
              `}>
                {day.date.getUTCDate()}
              </div>

              {/* Multiple workout indicators */}
              {dayWorkouts.length > 0 && (
                <div className="mt-2 space-y-1 text-xs max-h-24 overflow-y-auto">
                  {dayWorkouts.map((workout, index) => {
                    const workoutType = workout.workout_type || workout.type; // Ensure compatibility with both fields
                    const workoutSubtype = workout.subtype;
                    const workoutLabel = getWorkoutTypeLabel(workoutType, workoutSubtype);

                    // Determine the color based on whether the workout is planned or completed
                    const isCompleted = !workout.planned;
                    const bgColor = isCompleted ? 'bg-green-900/40 text-green-200' : 
                                    workoutType === 'Strength' ? 'bg-blue-900/40 text-blue-200' : 
                                    'bg-orange-900/40 text-orange-200';

                    return (
                      <div
                        key={index}
                        className={`p-1 rounded ${bgColor}`}
                      >
                        <div className="text-xs font-medium break-words">
                          {workoutLabel || 'Unknown'}
                        </div>
                        <div className="flex gap-1 text-xs">
                          {workout.strength_volume > 0 && (
                            <span className="text-green-400">
                              {workout.strength_volume}
                            </span>
                          )}
                          {workout.cardio_load > 0 && (
                            <span className="text-red-400">
                              {workout.cardio_load}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default React.memo(Calendar); // Wrap with React.memo
