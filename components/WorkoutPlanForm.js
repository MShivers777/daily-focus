'use client';

import { useState } from 'react';

const WEEKDAYS = [
  { id: 'sunday', label: 'Sun' },
  { id: 'monday', label: 'Mon' },
  { id: 'tuesday', label: 'Tue' },
  { id: 'wednesday', label: 'Wed' },
  { id: 'thursday', label: 'Thu' },
  { id: 'friday', label: 'Fri' },
  { id: 'saturday', label: 'Sat' }
];

const WORKOUT_TYPES = [
  { id: 'strength', label: 'Strength' },
  { id: 'cardio', label: 'Cardio' },
  { id: 'both', label: 'Both' }
];

const CARDIO_TYPES = [
  { id: 'intervals', label: 'Intervals' },
  { id: 'tempo', label: 'Tempo' },
  { id: 'steady_state', label: 'Steady State' },
  { id: 'zone2', label: 'Zone 2' },
  { id: 'sprints', label: 'Sprints' },
  { id: 'hill_sprints', label: 'Hill Sprints' },
  { id: 'custom', label: 'Custom' }
];

export default function WorkoutPlanForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    workoutType: '',
    strength_volume: '',
    cardio_load: '',
    cardio: {
      type: '',
      customType: '',
      metricType: 'pace',
      metricValue: '',
      duration: '',
      repeats: '1',
      restDuration: '',
      includeWarmup: false,
      warmupDuration: '',
      includeCooldown: false,
      cooldownDuration: ''
    },
    note: '',
    start_date: new Date().toISOString().split('T')[0],
    recurrence: 'once',
    customDays: WEEKDAYS.reduce((acc, day) => ({ ...acc, [day.id]: false }), {}),
    endType: 'never',
    endAfter: 1,
    endDate: ''
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCardioChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      cardio: {
        ...prev.cardio,
        [field]: value
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      // Calculate cardio_load based on cardio details if it's a cardio workout
      cardio_load: formData.workoutType === 'strength' ? 0 : 
        calculateCardioLoad(formData.cardio)
    };
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Workout Type Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Workout Type
        </label>
        <div className="flex flex-wrap gap-2">
          {WORKOUT_TYPES.map(type => (
            <button
              key={type.id}
              type="button"
              onClick={() => handleChange('workoutType', type.id)}
              className={`px-3 py-2 rounded ${
                formData.workoutType === type.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Strength Section */}
      {(formData.workoutType === 'strength' || formData.workoutType === 'both') && (
        <div className="space-y-4">
          <input
            type="number"
            placeholder="Strength Volume (lbs)"
            value={formData.strength_volume}
            onChange={(e) => handleChange('strength_volume', e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
          />
        </div>
      )}

      {/* Cardio Section */}
      {(formData.workoutType === 'cardio' || formData.workoutType === 'both') && (
        <div className="space-y-4 border-t pt-4">
          <div className="flex flex-wrap gap-2">
            {CARDIO_TYPES.map(type => (
              <button
                key={type.id}
                type="button"
                onClick={() => handleCardioChange('type', type.id)}
                className={`px-3 py-2 rounded ${
                  formData.cardio.type === type.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {formData.cardio.type === 'custom' && (
            <input
              type="text"
              value={formData.cardio.customType}
              onChange={(e) => handleCardioChange('customType', e.target.value)}
              placeholder="Enter custom cardio type"
              className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
            />
          )}

          {/* Metric Selection */}
          <div className="space-y-2">
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="pace"
                  checked={formData.cardio.metricType === 'pace'}
                  onChange={(e) => handleCardioChange('metricType', e.target.value)}
                  className="mr-2"
                />
                Pace
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="heart_rate"
                  checked={formData.cardio.metricType === 'heart_rate'}
                  onChange={(e) => handleCardioChange('metricType', e.target.value)}
                  className="mr-2"
                />
                Heart Rate
              </label>
            </div>

            {/* Rest of cardio fields... */}
          </div>
        </div>
      )}

      {/* Common Fields */}
      <div className="space-y-4">
        <textarea
          placeholder="Notes"
          value={formData.note}
          onChange={(e) => handleChange('note', e.target.value)}
          rows="3"
          className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Recurrence Section */}
      <div className="space-y-4 border-t pt-4">
        <div className="flex flex-wrap gap-2">
          {['once', 'daily', 'weekly', 'biweekly', 'custom'].map(type => (
            <button
              key={type}
              type="button"
              onClick={() => handleChange('recurrence', type)}
              className={`px-3 py-2 rounded ${
                formData.recurrence === type 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {formData.recurrence === 'custom' && (
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map(day => (
              <button
                key={day.id}
                type="button"
                onClick={() => handleChange('customDays', {
                  ...formData.customDays,
                  [day.id]: !formData.customDays[day.id]
                })}
                className={`px-3 py-2 rounded ${
                  formData.customDays[day.id]
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
        )}

        {/* End Options */}
        <div className="space-y-4 border-t pt-4">
          <div className="flex flex-wrap gap-2">
            {['never', 'after', 'on'].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => handleChange('endType', type)}
                className={`px-3 py-2 rounded ${
                  formData.endType === type
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700'
                }`}
              >
                End {type}
              </button>
            ))}
          </div>

          {formData.endType === 'after' && (
            <input
              type="number"
              min="1"
              value={formData.endAfter}
              onChange={(e) => handleChange('endAfter', parseInt(e.target.value))}
              className="w-full p-2 border rounded"
              placeholder="Number of occurrences"
            />
          )}

          {formData.endType === 'on' && (
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              className="w-full p-2 border rounded"
            />
          )}
        </div>
      </div>

      {/* Submit/Cancel Buttons */}
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Save Workout
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-100 text-gray-700 p-2 rounded hover:bg-gray-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function calculateCardioLoad(cardio) {
  // Implement cardio load calculation based on type, duration, intensity
  // This is a placeholder implementation
  const baseLoad = parseInt(cardio.duration) || 0;
  const repeats = parseInt(cardio.repeats) || 1;
  const intensityFactor = cardio.metricType === 'heart_rate' ? 1.2 : 1;
  return Math.round(baseLoad * repeats * intensityFactor);
}
