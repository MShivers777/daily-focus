'use client';
import { useState, useEffect } from 'react';
import supabase from '../api/supabase';
import WorkoutList from './WorkoutList';
import WorkoutPlanForm from './WorkoutPlanForm';
import ErrorMessage from './ErrorMessage';
import CalendarView from './CalendarView';
import { useRouter } from 'next/navigation';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function WorkoutPlanner() {
  const router = useRouter();
  const [view, setView] = useState('list');
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [plannedWorkouts, setPlannedWorkouts] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [workoutSettings, setWorkoutSettings] = useState(null);
  const [scheduledWorkouts, setScheduledWorkouts] = useState([]);

  useEffect(() => {
    loadPlannedWorkouts();
    loadWorkoutHistory();
    fetchWorkoutSettings();
  }, []);

  const loadPlannedWorkouts = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No session found');
        return;
      }

      const { data, error } = await supabase
        .from('planned_workouts')
        .select('*')
        .eq('user_id', session.user.id)
        .order('planned_date');

      if (error) throw error;
      setPlannedWorkouts(data || []);
    } catch (error) {
      console.error('Error loading planned workouts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWorkoutHistory = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', session.user.id)
        .order('workout_date', { ascending: false });

      setHistory(data || []);
    } catch (error) {
      console.error('Error loading workout history:', error);
    }
  };

  const fetchWorkoutSettings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('user_workout_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      setWorkoutSettings(data);
    } catch (error) {
      console.error('Error fetching workout settings:', error);
    }
  };

  const handlePlanWorkout = async (planData) => {
    try {
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('planned_workouts')
        .insert([{
          ...planData,
          user_id: session.user.id,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
      
      await loadPlannedWorkouts();
      setShowPlanForm(false);
      toast.success('Workout planned successfully');
    } catch (err) {
      console.error('Error planning workout:', err);
      setError('Failed to plan workout');
      toast.error('Failed to plan workout');
    }
  };

  const getWorkoutsForDay = (dayIndex, settings) => {
    try {
      const selectedWorkouts = settings?.selected_workouts || [];
      const dayName = DAYS[dayIndex].toLowerCase();
      return selectedWorkouts.filter(workout => workout.day === dayName);
    } catch (error) {
      console.error(`Error getting workouts for day ${dayIndex}:`, error);
      return [];
    }
  };

  if (isLoading) {
    return <div className="animate-pulse h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Workout Planner
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => router.push('/workouts/onboarding')}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all"
          >
            Reconfigure Plan
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

      {workoutSettings && (
        <>
          <div className="mb-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Current Workout Plan
            </h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300">Goals</h4>
                  <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
                    {workoutSettings.goals.map((goal, index) => (
                      <li key={index}>{goal}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300">Schedule</h4>
                  <div className="grid grid-cols-7 gap-2 mt-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                      <div
                        key={index}
                        className={`text-center p-2 rounded ${
                          workoutSettings.schedule.includes(index)
                            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                        }`}
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300">Plan Details</h4>
                  <ul className="text-gray-600 dark:text-gray-400">
                    <li>Experience Level: {workoutSettings.training_experience}</li>
                    <li>Workouts per Week: {workoutSettings.workouts_per_week}</li>
                    <li>Duration: {workoutSettings.workout_duration} minutes</li>
                    <li>Deload Frequency: Every {workoutSettings.deload_frequency} weeks</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300">Date Range</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {new Date(workoutSettings.plan_start_date).toLocaleDateString()} - {' '}
                    {new Date(workoutSettings.plan_end_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Schedule Card */}
          <div className="mb-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Weekly Schedule
            </h2>
            <div className="grid grid-cols-7 gap-2 text-center mb-4">
              {DAYS.map((day, index) => {
                const isWorkoutDay = workoutSettings.schedule?.includes(index);
                const dayWorkouts = getWorkoutsForDay(index, workoutSettings);
                
                return (
                  <div key={day} className="space-y-1">
                    <div className={`p-2 rounded-lg text-sm ${
                      isWorkoutDay
                        ? 'bg-gray-50 dark:bg-gray-700/50'
                        : 'text-gray-400'
                    }`}>
                      {day.slice(0, 3)}
                    </div>
                    {dayWorkouts && dayWorkouts.length > 0 && (
                      <div className="space-y-1">
                        {dayWorkouts.map((workoutItem, i) => (
                          <div 
                            key={i}
                            className={`text-xs px-2 py-1 rounded ${
                              workoutItem.type === 'Strength'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                                : 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200'
                            }`}>
                            <div>{workoutItem.type}</div>
                            {workoutItem.subtype && (
                              <div className="text-xs opacity-75">
                                {workoutItem.subtype}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>{workoutSettings.workouts_per_week} workouts per week</p>
              <p>{workoutSettings.workout_duration} minutes per session</p>
            </div>
          </div>
        </>
      )}

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
        <CalendarView 
          workoutHistory={history} 
          plannedWorkouts={plannedWorkouts}
          onAddWorkout={handlePlanWorkout}
        />
      )}
      {error && <ErrorMessage message={error} />}
    </div>
  );
}
