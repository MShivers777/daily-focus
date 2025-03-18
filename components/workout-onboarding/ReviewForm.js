'use client';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function generateWorkoutPlan(formData) {
  const selectedDays = formData.schedule
    .map((day, index) => day !== null ? index : null)
    .filter(day => day !== null);

  const workoutTypes = ['Strength', 'Cardio'];
  let currentType = 0;

  // Generate 2 weeks of workouts
  const weeks = Array(2).fill().map((_, weekIndex) => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() + (weekIndex * 7));
    
    return selectedDays.map(dayIndex => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + ((dayIndex - weekStart.getDay() + 7) % 7));
      
      const workout = {
        date,
        day: DAYS[dayIndex],
        type: workoutTypes[currentType],
        duration: formData.workoutDuration
      };
      
      currentType = (currentType + 1) % workoutTypes.length;
      return workout;
    });
  });

  return weeks;
}

// Make sure to use a default export
const ReviewForm = ({ formData, onBack, onSubmit }) => {
  const selectedDays = formData.schedule.filter(day => day !== null).length;
  const workoutPlan = generateWorkoutPlan(formData);

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
        <h4 className="font-medium mb-4">2-Week Sample Schedule</h4>
        <div className="space-y-6">
          {workoutPlan.map((week, weekIndex) => (
            <div key={weekIndex}>
              <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Week {weekIndex + 1}
              </h5>
              <div className="space-y-2">
                {week.map((workout, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium">
                        {workout.day}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        workout.type === 'Strength' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                          : 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200'
                      }`}>
                        {workout.type}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {workout.duration} min
                    </span>
                  </div>
                ))}
              </div>
            </div>
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

export default ReviewForm;  // Add this line to properly export the component
