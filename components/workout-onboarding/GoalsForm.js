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

export default function GoalsForm({ goals, onChange, onNext }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (goals.length > 0) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
