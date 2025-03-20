'use client';

import { useState, useEffect } from 'react';

function Calendar({ workouts = [], selectedDate, onSelectDate }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);

  // Generate calendar days for the current month view
  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Get the first day of the month
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay();
    
    // Get the last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Create array for all calendar days (including padding)
    const days = [];
    
    // Add padding days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
        isToday: false
      });
    }
    
    // Add days from current month
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: 
          date.getDate() === today.getDate() && 
          date.getMonth() === today.getMonth() && 
          date.getFullYear() === today.getFullYear()
      });
    }
    
    // Add padding days from next month
    const daysNeeded = 42 - days.length; // 6 rows of 7 days
    for (let i = 1; i <= daysNeeded; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
        isToday: false
      });
    }
    
    setCalendarDays(days);
  }, [currentMonth]);

  // Get workout for a specific day - fixed comparison
  const getWorkoutForDay = (date) => {
    if (!workouts || !Array.isArray(workouts) || workouts.length === 0) return null;
    
    // Format the date as YYYY-MM-DD for comparison
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    return workouts.find(workout => {
      // Handle both date objects and string dates in workout data
      if (!workout) return false;
      
      const workoutDate = workout.date instanceof Date 
        ? workout.date
        : new Date(workout.date);
      
      // Guard against invalid dates
      if (isNaN(workoutDate.getTime())) return false;
      
      // Format workout date the same way for comparison
      const workoutYear = workoutDate.getFullYear();
      const workoutMonth = String(workoutDate.getMonth() + 1).padStart(2, '0');
      const workoutDay = String(workoutDate.getDate()).padStart(2, '0');
      const workoutDateString = `${workoutYear}-${workoutMonth}-${workoutDay}`;
      
      return workoutDateString === dateString;
    });
  };

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentMonth(prevState => {
      const year = prevState.getFullYear();
      const month = prevState.getMonth();
      return new Date(year, month - 1, 1);
    });
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(prevState => {
      const year = prevState.getFullYear();
      const month = prevState.getMonth();
      return new Date(year, month + 1, 1);
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
          const workout = getWorkoutForDay(day.date);
          
          // Safe selected date comparison
          const isSelected = selectedDate && day.date && 
            day.date.getFullYear() === selectedDate.getFullYear() &&
            day.date.getMonth() === selectedDate.getMonth() &&
            day.date.getDate() === selectedDate.getDate();
          
          return (
            <div
              key={idx}
              onClick={() => onSelectDate(day.date)}
              className={`
                relative h-24 p-2 border border-gray-700 rounded-md 
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
                {day.date.getDate()}
              </div>

              {/* Workout indicator */}
              {workout && (
                <div className="mt-2 space-y-1">
                  {workout.strength_volume > 0 && (
                    <div className="flex items-center space-x-1 text-green-500">
                      <span role="img" aria-label="strength">💪</span>
                      <span>{workout.strength_volume}</span>
                    </div>
                  )}
                  {workout.cardio_load > 0 && (
                    <div className="flex items-center space-x-1 text-red-500">
                      <span role="img" aria-label="cardio">❤️</span>
                      <span>{workout.cardio_load}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Calendar;
