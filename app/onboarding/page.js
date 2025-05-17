'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '../../api/supabase';
import ScheduleForm from '../../components/workout-onboarding/ScheduleForm'; // Ensure this is correct

export default function OnboardingPage() {
  const router = useRouter();
  const [goals, setGoals] = useState([]);
  const [pace, setPace] = useState('maintain');
  const [deloadFrequency, setDeloadFrequency] = useState(4);
  const [workoutDays, setWorkoutDays] = useState([]);
  const [workoutDuration, setWorkoutDuration] = useState('');
  const [defaultOrder, setDefaultOrder] = useState({});
  const [fitnessBaselines, setFitnessBaselines] = useState({});
  const [workoutHistory, setWorkoutHistory] = useState('');
  const [importData, setImportData] = useState(false);

  useEffect(() => {
    // Check for existing preferences when component mounts
    const checkExistingPreferences = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      // If preferences exist, pre-fill the form
      if (preferences) {
        setGoals(preferences.goals || []);
        setPace(preferences.pace || 'maintain');
        setDeloadFrequency(preferences.deload_frequency || 4);
        setWorkoutDays(preferences.workout_days || []);
        setWorkoutDuration(preferences.workout_duration || '');
        setDefaultOrder(preferences.default_order || {});
        setFitnessBaselines(preferences.fitness_baselines || {});
        setWorkoutHistory(preferences.workout_history || '');
      }
    };

    checkExistingPreferences();
  }, []);

  const handleSubmit = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      // Save user preferences
      const { error: preferencesError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: session.user.id,
          goals,
          pace,
          deload_frequency: deloadFrequency,
          workout_days: workoutDays,
          workout_duration: workoutDuration,
          default_order: defaultOrder,
          fitness_baselines: fitnessBaselines,
          workout_history: workoutHistory,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (preferencesError) throw preferencesError;

      // Generate planned workouts
      const plannedWorkouts = generatePlannedWorkouts(goals, pace, deloadFrequency, workoutDays, defaultOrder, fitnessBaselines);
      const { error: workoutsError } = await supabase
        .from('planned_workouts')
        .insert(plannedWorkouts);

      if (workoutsError) throw workoutsError;

      router.push('/workouts');
    } catch (error) {
      console.error('Error during onboarding:', error);
    }
  };

  const generatePlannedWorkouts = (goals, pace, deloadFrequency, workoutDays, defaultOrder, fitnessBaselines) => {
    // Logic to generate planned workouts based on user inputs
    // Example: Create a schedule with strength and cardio workouts, deload weeks, and progression
    return workoutDays.map((day, index) => ({
      user_id: supabase.auth.user().id,
      planned_date: day,
      workout_type: defaultOrder[day] || 'rest',
      strength_volume: goals.includes('build strength') ? calculateStrengthVolume(index, pace) : 0,
      cardio_load: goals.includes('improve cardio') ? calculateCardioLoad(index, pace) : 0,
      note: `Focus on ${defaultOrder[day]} workout. ${getWorkoutPurpose(index, goals)}`,
      created_at: new Date().toISOString(),
    }));
  };

  const calculateStrengthVolume = (index, pace) => {
    // Example logic for strength volume progression
    return pace === 'as fast as possible' ? 100 + index * 10 : 100 + index * 5;
  };

  const calculateCardioLoad = (index, pace) => {
    // Example logic for cardio load progression
    return pace === 'as fast as possible' ? 50 + index * 5 : 50 + index * 2;
  };

  const getWorkoutPurpose = (index, goals) => {
    // Example logic for workout purpose based on mesocycle
    if (index % 4 === 0) return 'Deload week. Focus on recovery.';
    if (goals.includes('build muscle')) return 'Building volume. Focus on hypertrophy.';
    if (goals.includes('improve speed')) return 'Top-end speed. Focus on sprints.';
    return 'General fitness maintenance.';
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Workout Onboarding</h1>
      {/* Add UI components for each input field */}
      <button onClick={handleSubmit} className="px-4 py-2 bg-blue-500 text-white rounded-lg">
        Submit
      </button>
    </div>
  );
}
