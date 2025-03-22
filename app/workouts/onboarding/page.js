'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '../../../api/supabase';
import BackIcon from '../../../components/icons/BackIcon';
import GoalsForm from '../../../components/workout-onboarding/GoalsForm';
import ExperienceForm from '../../../components/workout-onboarding/ExperienceForm';
import ScheduleForm from '../../../components/workout-onboarding/ScheduleForm';
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
    baselines: [],
    trainingExperience: 0
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
            baselines: data.baselines || [],
            trainingExperience: data.training_experience || 0,
            heartRates: data.heart_rates || {}
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

      const workoutSettings = {
        user_id: session.user.id,
        goals: formData.goals,
        training_experience: formData.trainingExperience || 0,
        workout_duration: formData.workoutDuration,
        workouts_per_week: formData.schedule.filter(day => day !== null).length,
        deload_frequency: formData.deloadFrequency,
        schedule: formData.schedule.map((day, index) => day !== null ? index : null).filter(day => day !== null),
        workout_types: formData.workoutTypes || Array(7).fill([]),
        heart_rates: formData.heartRates || {},
        baselines: formData.baselines || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        plan_start_date: formData.planStartDate || new Date().toISOString().split('T')[0]
      };

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

  const steps = ['Goals', 'Experience', 'Schedule', 'Review'];

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
            <GoalsForm 
              goals={formData.goals}
              onChange={(goals) => setFormData(prev => ({ ...prev, goals }))}
              onNext={() => setCurrentStep(2)}
            />
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
