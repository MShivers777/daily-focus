'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '../../../api/supabase';
import BackIcon from '../../../components/icons/BackIcon';
import GoalsForm from '../../../components/workout-onboarding/GoalsForm';
import ExperienceForm from '../../../components/workout-onboarding/ExperienceForm';
import ScheduleForm from '../../../components/workout-onboarding/ScheduleForm';
import WorkoutSelectionForm from '../../../components/workout-onboarding/WorkoutSelectionForm'; // New step
import toast from 'react-hot-toast';
import { default as ReviewFormComponent } from '../../../components/workout-onboarding/ReviewForm';  // Fix import

export default function WorkoutOnboarding() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    goals: [],
    deloadFrequency: 4,
    workoutsPerWeek: 3,
    workoutDuration: 60,
    schedule: Array(7).fill(null),
    workoutTypes: Array(7).fill([]),
    selectedWorkouts: [], // New field for selected workouts
    baselines: [],
    trainingExperience: 0,
    planStartDate: new Date().toISOString().split('T')[0] // Default to today's date
  });

  useEffect(() => {
    const fetchExistingSettings = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase
          .from('user_workout_settings')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false }) // Ensure the latest row is fetched
          .limit(1) // Fetch only one row
          .single();

        if (error) throw error;

        if (data) {
          setFormData({
            goals: data.goals || [],
            deloadFrequency: data.deload_frequency || 4,
            workoutsPerWeek: data.workouts_per_week || 3,
            workoutDuration: data.workout_duration || 60,
            schedule: Array(7).fill(null).map((_, i) => 
              data.schedule?.includes(i) ? i : null
            ),
            workoutTypes: data.workout_types || Array(7).fill([]),
            selectedWorkouts: data.selected_workouts || [],
            baselines: data.baselines || [],
            trainingExperience: data.training_experience || 0,
            heartRates: data.heart_rates || {},
            planStartDate: data.plan_start_date || new Date().toISOString().split('T')[0]
          });
        }
      } catch (error) {
        console.error('Error fetching existing settings:', error);
        toast.error('Failed to load previous settings');
      }
    };

    fetchExistingSettings();
  }, []);

  const handleStepComplete = (stepData) => {
    setFormData(prev => ({ ...prev, ...stepData }));
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      // Convert selected workouts into workout_types array
      const workout_types = Array(7).fill([]);
      
      // Map selected workouts to days of the week
      formData.selectedWorkouts.forEach(workout => {
        const dayIndex = DAYS.findIndex(day => 
          day.toLowerCase() === workout.day.toLowerCase()
        );
        if (dayIndex !== -1) {
          workout_types[dayIndex] = [
            {
              type: workout.type,
              subtype: workout.subtype,
              frequency: workout.frequency
            }
          ];
        }
      });

      const schedule = workout_types
        .map((types, index) => types.length > 0 ? index : null)
        .filter(day => day !== null);

      const workoutSettings = {
        user_id: session.user.id,
        goals: formData.goals,
        training_experience: formData.trainingExperience || 0,
        workout_duration: formData.workoutDuration,
        workouts_per_week: schedule.length,
        deload_frequency: formData.deloadFrequency,
        schedule,
        workout_types,
        selected_workouts: formData.selectedWorkouts,
        heart_rates: formData.heartRates || {},
        baselines: formData.baselines || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        plan_start_date: formData.planStartDate
      };

      // Debug logs
      console.log('Saving workout settings:', workoutSettings);
      console.log('Selected workouts:', formData.selectedWorkouts);
      console.log('Generated workout_types:', workout_types);

      const { error } = await supabase
        .from('user_workout_settings')
        .upsert(workoutSettings);

      if (error) throw error;

      toast.success('Workout preferences saved!');
      router.push('/workouts');
    } catch (error) {
      console.error('Error details:', error);
      toast.error(error.message || 'Failed to save workout preferences');
    }
  };

  const steps = ['Goals', 'Experience', 'Schedule', 'Workout Selection', 'Review'];

  return (
    <div className="relative">
      <button
        onClick={() => router.push('/workouts')}
        className="absolute top-0 left-0 p-2 rounded-lg transition-all bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
        aria-label="Back to workouts">
        <BackIcon />
      </button>
      
      <div className="max-w-4xl mx-auto pt-16 p-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          Workout Setup
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          {/* Step indicators */}
          <div className="flex justify-between mb-8">
            {steps.map((step, index) => (
              <div
                key={step}
                className={`flex items-center ${
                  index + 1 === currentStep ? 'text-blue-500' : 'text-gray-400'
                }`}
              >
                <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center">
                  {index + 1}
                </div>
                <span className="ml-2">{step}</span>
              </div>
            ))}
          </div>

          {/* Form Steps */}
          {currentStep === 1 && (
            <div className="space-y-8">
              <GoalsForm 
                goals={formData.goals}
                onChange={(goals) => setFormData(prev => ({ ...prev, goals }))}
                onNext={() => setCurrentStep(2)}
              />
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                  Select Plan Start Date
                </h3>
                <input
                  type="date"
                  value={formData.planStartDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, planStartDate: e.target.value }))}
                  className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>
          )}
          {currentStep === 2 && (
            <ExperienceForm
              experience={formData.trainingExperience}
              onChange={(data) => setFormData(prev => ({ 
                ...prev, 
                trainingExperience: data.trainingExperience,
                heartRates: data.heartRates,
                baselines: data.baselines
              }))}
              onNext={() => setCurrentStep(3)}
              onBack={handleBack}
            />
          )}
          {currentStep === 3 && (
            <ScheduleForm
              schedule={formData.schedule}
              workoutDuration={formData.workoutDuration}
              onChange={(data) => setFormData(prev => ({ ...prev, ...data }))}
              onNext={() => setCurrentStep(4)}
              onBack={handleBack}
            />
          )}
          {currentStep === 4 && (
            <WorkoutSelectionForm
              selectedWorkouts={formData.selectedWorkouts}
              onChange={(selectedWorkouts) => setFormData(prev => ({ ...prev, selectedWorkouts }))}
              onNext={() => setCurrentStep(5)}
              onBack={handleBack}
            />
          )}
          {currentStep === 5 && (
            <ReviewFormComponent
              formData={formData}
              onBack={handleBack}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      </div>
    </div>
  );
}
