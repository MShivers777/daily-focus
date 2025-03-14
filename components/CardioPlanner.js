'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import supabase from '../api/supabase';

const WORKOUT_TYPES = [
  { id: 'intervals', label: 'Intervals' },
  { id: 'tempo', label: 'Tempo' },
  { id: 'steady_state', label: 'Steady State' },
  { id: 'zone2', label: 'Zone 2' },
  { id: 'sprints', label: 'Sprints' },
  { id: 'hill_sprints', label: 'Hill Sprints' },
  { id: 'custom', label: 'Custom' }
];

export default function CardioPlanner() {
  const [workoutData, setWorkoutData] = useState({
    type: '',
    customType: '',
    metricType: 'pace', // or 'heart_rate'
    metricValue: '',
    duration: '',
    repeats: '1',
    restDuration: '',
    includeWarmup: false,
    warmupDuration: '',
    includeCooldown: false,
    cooldownDuration: '',
    notes: ''
  });

  const handleChange = (field, value) => {
    setWorkoutData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('cardio_workouts')
        .insert([{
          user_id: session.user.id,
          workout_type: workoutData.type === 'custom' ? workoutData.customType : workoutData.type,
          metric_type: workoutData.metricType,
          metric_value: workoutData.metricValue,
          duration: workoutData.duration,
          repeats: parseInt(workoutData.repeats),
          rest_duration: workoutData.restDuration,
          warmup_duration: workoutData.includeWarmup ? workoutData.warmupDuration : null,
          cooldown_duration: workoutData.includeCooldown ? workoutData.cooldownDuration : null,
          notes: workoutData.notes,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
      toast.success('Workout saved successfully');
      
    } catch (error) {
      console.error('Error saving workout:', error);
      toast.error('Failed to save workout');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      {/* Workout Type */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Workout Type
        </label>
        <div className="flex flex-wrap gap-2">
          {WORKOUT_TYPES.map(type => (
            <button
              key={type.id}
              type="button"
              onClick={() => handleChange('type', type.id)}
              className={`px-3 py-2 rounded ${
                workoutData.type === type.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
        {workoutData.type === 'custom' && (
          <input
            type="text"
            value={workoutData.customType}
            onChange={(e) => handleChange('customType', e.target.value)}
            placeholder="Enter custom workout type"
            className="mt-2 w-full p-2 rounded border dark:bg-gray-700"
          />
        )}
      </div>

      {/* Metric Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Metric Type
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="pace"
              checked={workoutData.metricType === 'pace'}
              onChange={(e) => handleChange('metricType', e.target.value)}
              className="mr-2"
            />
            Pace
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="heart_rate"
              checked={workoutData.metricType === 'heart_rate'}
              onChange={(e) => handleChange('metricType', e.target.value)}
              className="mr-2"
            />
            Heart Rate
          </label>
        </div>
        <div className="flex gap-4">
          <input
            type="text"
            value={workoutData.metricValue}
            onChange={(e) => handleChange('metricValue', e.target.value)}
            placeholder={workoutData.metricType === 'pace' ? "min/mile" : "BPM"}
            className="flex-1 p-2 rounded border dark:bg-gray-700"
          />
          <input
            type="text"
            value={workoutData.duration}
            onChange={(e) => handleChange('duration', e.target.value)}
            placeholder="Duration (minutes)"
            className="flex-1 p-2 rounded border dark:bg-gray-700"
          />
        </div>
      </div>

      {/* Repeats and Rest */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Repeats and Rest
        </label>
        <div className="flex gap-4">
          <input
            type="number"
            min="1"
            value={workoutData.repeats}
            onChange={(e) => handleChange('repeats', e.target.value)}
            placeholder="Number of repeats"
            className="flex-1 p-2 rounded border dark:bg-gray-700"
          />
          <input
            type="text"
            value={workoutData.restDuration}
            onChange={(e) => handleChange('restDuration', e.target.value)}
            placeholder="Rest duration (minutes)"
            className="flex-1 p-2 rounded border dark:bg-gray-700"
          />
        </div>
      </div>

      {/* Warmup */}
      <div className="space-y-2">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={workoutData.includeWarmup}
            onChange={(e) => handleChange('includeWarmup', e.target.checked)}
            className="mr-2"
          />
          Include Warmup
        </label>
        {workoutData.includeWarmup && (
          <input
            type="text"
            value={workoutData.warmupDuration}
            onChange={(e) => handleChange('warmupDuration', e.target.value)}
            placeholder="Warmup duration (minutes)"
            className="w-full p-2 rounded border dark:bg-gray-700"
          />
        )}
      </div>

      {/* Cooldown */}
      <div className="space-y-2">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={workoutData.includeCooldown}
            onChange={(e) => handleChange('includeCooldown', e.target.checked)}
            className="mr-2"
          />
          Include Cooldown
        </label>
        {workoutData.includeCooldown && (
          <input
            type="text"
            value={workoutData.cooldownDuration}
            onChange={(e) => handleChange('cooldownDuration', e.target.value)}
            placeholder="Cooldown duration (minutes)"
            className="w-full p-2 rounded border dark:bg-gray-700"
          />
        )}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Notes
        </label>
        <textarea
          value={workoutData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Additional notes..."
          rows="3"
          className="w-full p-2 rounded border dark:bg-gray-700"
        />
      </div>

      <button
        type="submit"
        className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
      >
        Save Workout
      </button>
    </form>
  );
}
