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

export default function WorkoutPlanForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    start_date: new Date().toISOString().split('T')[0],
    strength_volume: '',
    cardio_load: '',
    note: '',
    recurrence: 'once',
    custom_days: [],
    end_type: 'never',
    end_after: '',
    end_date: ''
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      strength_volume: parseInt(formData.strength_volume) || null,
      cardio_load: parseInt(formData.cardio_load) || null,
      custom_days: formData.recurrence === 'custom' ? formData.custom_days : null,
      end_after: formData.end_type === 'after' ? parseInt(formData.end_after) : null,
      end_date: formData.end_type === 'on_date' ? formData.end_date : null
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Fields */}
      <div className="space-y-4">
        <input
          type="date"
          value={formData.start_date}
          onChange={(e) => handleChange('start_date', e.target.value)}
          className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
        />
        <input
          type="number"
          placeholder="Strength Volume (lbs)"
          value={formData.strength_volume}
          onChange={(e) => handleChange('strength_volume', e.target.value)}
          className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
        />
        <input
          type="number"
          placeholder="Cardio Load"
          value={formData.cardio_load}
          onChange={(e) => handleChange('cardio_load', e.target.value)}
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
                onClick={() => handleChange('custom_days', {
                  ...formData.custom_days,
                  [day.id]: !formData.custom_days[day.id]
                })}
                className={`px-3 py-2 rounded ${
                  formData.custom_days[day.id]
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
                onClick={() => handleChange('end_type', type)}
                className={`px-3 py-2 rounded ${
                  formData.end_type === type
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700'
                }`}
              >
                End {type}
              </button>
            ))}
          </div>

          {formData.end_type === 'after' && (
            <input
              type="number"
              min="1"
              value={formData.end_after}
              onChange={(e) => handleChange('end_after', parseInt(e.target.value))}
              className="w-full p-2 border rounded"
              placeholder="Number of occurrences"
            />
          )}

          {formData.end_type === 'on' && (
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => handleChange('end_date', e.target.value)}
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
          Plan Workout
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
