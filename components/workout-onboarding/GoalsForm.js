'use client';

const WORKOUT_GOALS = [
  { id: 'build_muscle', label: 'Build Muscle' },
  { id: 'build_strength', label: 'Build Strength' },
  { id: 'improve_cardio', label: 'Improve Cardio' },
  { id: 'improve_endurance', label: 'Improve Endurance' },
  { id: 'improve_speed', label: 'Improve Speed' },
  { id: 'lose_fat', label: 'Lose Fat' },
  { id: 'recomp', label: 'Recomposition' },
  { id: 'maintain', label: 'Maintain Fitness' }
];

const PACE_OPTIONS = [
  { 
    id: 'maintain', 
    label: 'Maintain Current Level', 
    description: 'Combined load ratio: 1.0',
    detail: 'Focus on consistency and maintenance'
  },
  { 
    id: 'steady', 
    label: 'Steady Progress', 
    description: 'Combined load ratio: 1.1 - 1.3',
    detail: 'Sustainable progression with lower injury risk'
  },
  { 
    id: 'aggressive', 
    label: 'As Fast as Possible', 
    description: 'Combined load ratio: 1.4',
    detail: 'Maximum progression with higher injury risk'
  }
];

export default function GoalsForm({ goals, pace = 'maintain', onChange, onNext }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (goals.length > 0) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Goals Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white">
          Select Your Goals
        </h3>
        <div className="flex flex-wrap gap-2">
          {WORKOUT_GOALS.map(goal => (
            <button
              key={goal.id}
              type="button"
              onClick={() => {
                const newGoals = goals.includes(goal.id)
                  ? goals.filter(g => g !== goal.id)
                  : [...goals, goal.id];
                onChange(newGoals);
              }}
              className={`px-4 py-2 rounded-lg transition-all ${
                goals.includes(goal.id)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {goal.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pace Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white">
          Preferred Progress Pace
        </h3>
        <div className="grid gap-4">
          {PACE_OPTIONS.map(option => (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange({ pace: option.id })}
              className={`p-4 text-left rounded-lg transition-all ${
                pace === option.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="font-medium">{option.label}</div>
              <div className={`text-sm ${
                pace === option.id ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {option.description}
              </div>
              <div className={`text-xs mt-1 ${
                pace === option.id ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {option.detail}
              </div>
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={goals.length === 0}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </form>
  );
}
