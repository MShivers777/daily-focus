'use client';
import { useState, useEffect } from 'react';
import WorkoutList from './WorkoutList';
import WorkoutPlanForm from './WorkoutPlanForm';
import { createPlannedWorkout, getPlannedWorkouts } from '../services/plannedWorkouts';
import ErrorMessage from './ErrorMessage';

export default function WorkoutPlanner({ session }) {
  const [view, setView] = useState('list');
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [plannedWorkouts, setPlannedWorkouts] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPlannedWorkouts();
  }, []);

  async function loadPlannedWorkouts() {
    try {
      const data = await getPlannedWorkouts(session.user.id);
      setPlannedWorkouts(data);
    } catch (err) {
      setError('Failed to load planned workouts');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  const handlePlanWorkout = async (planData) => {
    try {
      setError(null);
      const newWorkout = await createPlannedWorkout({
        ...planData,
        user_id: session.user.id
      });
      setPlannedWorkouts(prev => [...prev, newWorkout]);
      setShowPlanForm(false);
    } catch (err) {
      setError('Failed to plan workout');
      console.error(err);
    }
  };

  if (isLoading) {
    return <div>Loading planned workouts...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Workout Planner
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowPlanForm(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all"
          >
            Plan New Workout
          </button>
          <button 
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-lg transition-all ${
              view === 'list'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`px-4 py-2 rounded-lg transition-all ${
              view === 'calendar'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Calendar View
          </button>
        </div>
      </div>

      {showPlanForm ? (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Plan New Workout
            </h3>
            <button
              onClick={() => setShowPlanForm(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
          <WorkoutPlanForm onSubmit={handlePlanWorkout} />
        </div>
      ) : view === 'list' ? (
        <WorkoutList workouts={plannedWorkouts} />
      ) : (
        <div className="text-gray-600 dark:text-gray-400 text-center p-8">
          Calendar view coming soon
        </div>
      )}
      {error && <ErrorMessage message={error} />}
    </div>
  );
}
