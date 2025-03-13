'use client';

import { useState, useEffect } from 'react';
import supabase from '../api/supabase';

export default function CalendarView({ workoutHistory = [] }) {  // Add default value
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [plannedWorkouts, setPlannedWorkouts] = useState([]);

  useEffect(() => {
    fetchPlannedWorkouts();
  }, [currentMonth]);

  const fetchPlannedWorkouts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const { data } = await supabase
        .from('planned_workouts')
        .select('*')
        .eq('user_id', session.user.id)
        .lte('start_date', endOfMonth.toISOString())
        .or(`end_date.gt.${startOfMonth.toISOString()},end_date.is.null`);

      setPlannedWorkouts(data || []);
    } catch (error) {
      console.error('Error fetching planned workouts:', error);
    }
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Add padding for days before the first of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getWorkoutsForDate = (date) => {
    if (!date || !Array.isArray(workoutHistory)) return [];

    const dateString = date.toISOString().split('T')[0];
    
    // Only include completed workouts that have non-zero values
    const completed = workoutHistory?.filter(w => 
      w?.workout_date === dateString && 
      (w?.strength_volume > 0 || w?.cardio_load > 0)
    ) || [];
    
    // Only include planned workouts that have non-zero values
    const planned = plannedWorkouts?.filter(workout => {
      // Skip if all values are zero
      if (!workout.strength_volume && !workout.cardio_load) {
        return false;
      }

      const startDate = new Date(workout.start_date);
      const endDate = workout.end_date ? new Date(workout.end_date) : null;
      const currentDate = new Date(dateString);

      // Check if date is within range
      if (endDate && currentDate > endDate) return false;
      if (currentDate < startDate) return false;

      // Handle different recurrence types
      switch (workout.recurrence) {
        case 'daily':
          return true;
        case 'weekly':
          return currentDate.getDay() === startDate.getDay();
        case 'custom':
          return workout.custom_days?.includes(currentDate.getDay());
        default:
          return currentDate.getTime() === startDate.getTime();
      }
    }) || [];

    return [...completed, ...planned];
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={previousMonth}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            ←
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2">
            {day}
          </div>
        ))}

        {getDaysInMonth().map((date, index) => (
          <div 
            key={index}
            className={`
              aspect-square p-2 border border-gray-200 dark:border-gray-700 rounded-lg
              ${date ? 'hover:bg-gray-50 dark:hover:bg-gray-700' : 'bg-gray-50 dark:bg-gray-800'}
            `}
          >
            {date && (
              <>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {date.getDate()}
                </div>
                {getWorkoutsForDate(date).map((workout, i) => (
                  <div 
                    key={i}
                    className={`
                      text-xs p-1 mt-1 rounded
                      ${workout.workout_date ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 
                       'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'}
                    `}
                  >
                    {workout.workout_date ? '✓ Completed' : '○ Planned'}
                  </div>
                ))}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
