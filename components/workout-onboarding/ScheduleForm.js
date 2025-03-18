'use client';

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
  const selectedDays = schedule.filter(day => day !== null).length;

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
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day, index) => (
            <button
              key={day.id}
              type="button"
              onClick={() => handleDayToggle(index)}
              className={`px-4 py-2 rounded-lg transition-all ${
                schedule[index] !== null
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

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
