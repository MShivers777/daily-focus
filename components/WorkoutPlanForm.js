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
    startDate: new Date().toISOString().split('T')[0],
    strengthVolume: '',
    cardioLoad: '',
    note: '',
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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Fields */}
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
