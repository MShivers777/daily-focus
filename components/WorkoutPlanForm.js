'use client';
import { useState } from 'react';

export default function WorkoutPlanForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    strengthVolume: '',
    cardioLoad: '',
    note: '',
    recurrence: 'once', // once, daily, weekly, biweekly, custom
    customDays: {
      sunday: false,
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false
    },
    endType: 'never', // never, after, on
    endAfter: 1,
    endDate: '',
  });

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCustomDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      customDays: {
        ...prev.customDays,
        [day]: !prev.customDays[day]
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Workout Info */}
      <div className="space-y-4">
        <input
          type="date"
          value={formData.startDate}
          onChange={(e) => handleChange('startDate', e.target.value)}
          className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
        />
        <input
          type="number"
          placeholder="Strength Volume (lbs)"
          value={formData.strengthVolume}
          onChange={(e) => handleChange('strengthVolume', e.target.value)}
          className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
        />
        <input
          type="number"
          placeholder="Cardio Load"
          value={formData.cardioLoad}
          onChange={(e) => handleChange('cardioLoad', e.target.value)}
          className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
        />
        <textarea
          placeholder="Notes"
          value={formData.note}
          onChange={(e) => handleChange('note', e.target.value)}
          className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
          rows="3"
        />
      </div>

      {/* Recurrence Options */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {['once', 'daily', 'weekly', 'biweekly', 'custom'].map(option => (
            <button
              key={option}
              type="button"
              onClick={() => handleChange('recurrence', option)}
              className={`px-4 py-2 rounded-lg ${
                formData.recurrence === option
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>

        {/* Custom Days Selector */}
        {formData.recurrence === 'custom' && (
          <div className="flex flex-wrap gap-2">
            {dayNames.map(day => (
              <button
                key={day}
                type="button"
                onClick={() => handleCustomDayToggle(day)}
                className={`px-4 py-2 rounded-lg ${
                  formData.customDays[day]
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {day.charAt(0).toUpperCase() + day.slice(1, 3)}
              </button>
            ))}
          </div>
        )}

        {/* End Options */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {['never', 'after', 'on'].map(option => (
              <button
                key={option}
                type="button"
                onClick={() => handleChange('endType', option)}
                className={`px-4 py-2 rounded-lg ${
                  formData.endType === option
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                End {option}
              </button>
            ))}
          </div>

          {formData.endType === 'after' && (
            <input
              type="number"
              min="1"
              value={formData.endAfter}
              onChange={(e) => handleChange('endAfter', parseInt(e.target.value))}
              className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
              placeholder="Number of occurrences"
            />
          )}

          {formData.endType === 'on' && (
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
            />
          )}
        </div>
      </div>

      <button
        type="submit"
        className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        Plan Workout
      </button>
    </form>
  );
}
