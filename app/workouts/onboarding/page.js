'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BackIcon from '../../../components/icons/BackIcon';
import GoalsForm from '../../../components/workout-onboarding/GoalsForm';
import ExperienceForm from '../../../components/workout-onboarding/ExperienceForm';

export default function WorkoutOnboarding() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    goals: [],
    progressPace: 'slow_steady',
    deloadFrequency: 4,
    workoutsPerWeek: 3,
    workoutDuration: 60,
    schedule: Array(7).fill(null),
    baselines: [],
    trainingExperience: 0
  });

  const handleStepComplete = (stepData) => {
    setFormData(prev => ({ ...prev, ...stepData }));
    setCurrentStep(prev => prev + 1);
  };

  const handleSubmit = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      // Save to planned_workouts table
      const { error } = await supabase
        .from('planned_workouts')
        .insert([{
          user_id: session.user.id,
          workout_type: 'onboarding',
          workouttype: formData.progressPace,
          planned_date: new Date().toISOString().split('T')[0],
          notes: JSON.stringify(formData),
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
      router.push('/workouts');
    } catch (error) {
      console.error('Error saving workout preferences:', error);
    }
  };

  const steps = ['Goals', 'Experience', 'Schedule', 'Review'];

  return (
    <div className="relative">
      <button
        onClick={() => router.push('/workouts')}
        className="absolute top-0 left-0 p-2 rounded-lg transition-all bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
        aria-label="Back to workouts"
      >
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
              onChange={(experience) => setFormData(prev => ({ ...prev, trainingExperience: experience }))}
              onNext={() => setCurrentStep(3)}
            />
          )}
          {/* Add other step components here */}
        </div>
      </div>
    </div>
  );
}
