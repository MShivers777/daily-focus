'use client';

import { useState, useEffect } from 'react';

const PERFORMANCE_TYPES = [
  { id: 'strength', label: 'Strength' },
  { id: 'cardio', label: 'Cardio' }
];

const CARDIO_METRICS = [
  { id: 'mile', label: '1 Mile' },
  { id: '5k', label: '5K' },
  { id: '10k', label: '10K' },
  { id: 'half_marathon', label: 'Half Marathon' },
  { id: 'marathon', label: 'Marathon' }
];

const STRENGTH_EXERCISES = [
  { id: 'squat', label: 'Squat' },
  { id: 'bench', label: 'Bench Press' },
  { id: 'deadlift', label: 'Deadlift' },
  { id: 'press', label: 'Overhead Press' },
  { id: 'row', label: 'Barbell Row' }
];

const validateNumber = (value) => {
  // Only allow regular numbers, prevent scientific notation
  return value === '' || /^\d{0,6}$/.test(value);
};

const EXPERIENCE_OPTIONS = [
  { value: 0, label: 'Just starting out' },
  { value: 1, label: 'Less than 6 months' },
  { value: 2, label: '6-12 months' },
  { value: 3, label: '1-2 years' },
  { value: 4, label: '2-5 years' },
  { value: 5, label: '5+ years' }
];

export default function ExperienceForm({ experience, onChange, onNext, onBack }) {
  const [restingHR, setRestingHR] = useState('');
  const [maxHR, setMaxHR] = useState('');
  const [performanceType, setPerformanceType] = useState('');
  const [selectedMetric, setSelectedMetric] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [time, setTime] = useState('');
  const [baselines, setBaselines] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [timeInputs, setTimeInputs] = useState({ hours: '', minutes: '', seconds: '' });
  const [selectedExperience, setSelectedExperience] = useState(experience || 0);

  useEffect(() => {
    const fetchExperienceData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase
          .from('user_workout_settings')
          .select('training_experience, heart_rates, baselines')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) throw error;

        if (data) {
          onChange({ trainingExperience: data.training_experience || 0 });
          setRestingHR(data.heart_rates?.resting || '');
          setMaxHR(data.heart_rates?.max || '');
          setBaselines(data.baselines || []);
        }
      } catch (error) {
        console.error('Error fetching experience data:', error);
      }
    };

    fetchExperienceData();
  }, []);

  useEffect(() => {
    // Ensure the selected experience is updated when the prop changes
    setSelectedExperience(experience || 0);
  }, [experience]);

  const handleNumberInput = (e, setter) => {
    const value = e.target.value;
    if (validateNumber(value)) {
      setter(value);
    }
  };

  const handleTimeInput = (value, unit) => {
    if (value === '' || (/^\d{0,2}$/.test(value) && parseInt(value) < 60)) {
      setTimeInputs(prev => {
        const newInputs = { ...prev, [unit]: value };
        // Update the time string when inputs change
        const timeStr = formatTimeToString(newInputs);
        setTime(timeStr);
        return newInputs;
      });
    }
  };

  const formatTimeToString = ({ hours, minutes, seconds }) => {
    if (!hours && !minutes && !seconds) return '';
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
  };

  const handleAddBaseline = () => {
    const newBaseline = {
      type: performanceType,
      metric: selectedMetric,
      ...(performanceType === 'strength' 
        ? { weight: parseInt(weight), reps: parseInt(reps) }
        : { time: time }
      )
    };

    if (editingIndex !== null) {
      // Update existing baseline
      const updatedBaselines = [...baselines];
      updatedBaselines[editingIndex] = newBaseline;
      setBaselines(updatedBaselines);
      setEditingIndex(null);
    } else {
      // Add new baseline
      setBaselines([...baselines, newBaseline]);
    }

    // Reset form
    setPerformanceType('');
    setSelectedMetric('');
    setWeight('');
    setReps('');
    setTime('');
    setTimeInputs({ hours: '', minutes: '', seconds: '' });
  };

  const handleEditBaseline = (index) => {
    const baseline = baselines[index];
    setPerformanceType(baseline.type);
    setSelectedMetric(baseline.metric);
    if (baseline.type === 'strength') {
      setWeight(baseline.weight.toString());
      setReps(baseline.reps.toString());
    } else {
      const [hours, minutes, seconds] = baseline.time.split(':');
      setTimeInputs({ hours, minutes, seconds });
      setTime(baseline.time);
    }
    setEditingIndex(index);
  };

  const handleDeleteBaseline = (index) => {
    setBaselines(baselines.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onChange({
      trainingExperience: selectedExperience,
      heartRates: {
        resting: parseInt(restingHR) || null,
        max: parseInt(maxHR) || null
      },
      baselines
    });
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Experience Selection */}
      <div className="space-y-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          How long have you been working out consistently?
        </label>
        <select
          value={selectedExperience}
          onChange={(e) => setSelectedExperience(parseInt(e.target.value))}
          className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700"
        >
          {EXPERIENCE_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Heart Rate Section */}
      <div className="space-y-4 border-t pt-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white">
          Heart Rate Metrics
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Resting Heart Rate
            </label>
            <div className="relative">
              <input
                type="number"
                min="30"
                max="120"
                value={restingHR}
                onChange={(e) => handleNumberInput(e, setRestingHR)}
                placeholder="45-75"
                className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                bpm
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Maximum Heart Rate
            </label>
            <div className="relative">
              <input
                type="number"
                min="120"
                max="220"
                value={maxHR}
                onChange={(e) => handleNumberInput(e, setMaxHR)}
                placeholder="180-200"
                className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                bpm
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Baseline Performance Section */}
      <div className="space-y-4 border-t pt-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white">
          Recent Performance
        </h3>
        <div className="space-y-4">
          <select
            value={performanceType}
            onChange={(e) => setPerformanceType(e.target.value)}
            className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700"
          >
            <option value="">Select Type</option>
            {PERFORMANCE_TYPES.map(type => (
              <option key={type.id} value={type.id}>{type.label}</option>
            ))}
          </select>

          {performanceType && (
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700"
            >
              <option value="">Select {performanceType === 'strength' ? 'Exercise' : 'Distance'}</option>
              {(performanceType === 'strength' ? STRENGTH_EXERCISES : CARDIO_METRICS).map(item => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          )}

          {selectedMetric && (
            <div className="space-y-2">
              {performanceType === 'strength' ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Weight (lbs)"
                    value={weight}
                    onChange={(e) => handleNumberInput(e, setWeight)}
                    className="flex-1 p-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700"
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Reps"
                    value={reps}
                    onChange={(e) => handleNumberInput(e, setReps)}
                    className="flex-1 p-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700"
                  />
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="HH"
                      value={timeInputs.hours}
                      onChange={(e) => handleTimeInput(e.target.value, 'hours')}
                      className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700 text-center"
                      maxLength="2"
                    />
                    <label className="text-xs text-gray-500 dark:text-gray-400 text-center block mt-1">
                      Hours
                    </label>
                  </div>
                  <div className="flex items-center pt-2 text-gray-400">:</div>
                  <div className="flex-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="MM"
                      value={timeInputs.minutes}
                      onChange={(e) => handleTimeInput(e.target.value, 'minutes')}
                      className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700 text-center"
                      maxLength="2"
                    />
                    <label className="text-xs text-gray-500 dark:text-gray-400 text-center block mt-1">
                      Minutes
                    </label>
                  </div>
                  <div className="flex items-center pt-2 text-gray-400">:</div>
                  <div className="flex-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="SS"
                      value={timeInputs.seconds}
                      onChange={(e) => handleTimeInput(e.target.value, 'seconds')}
                      className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700 text-center"
                      maxLength="2"
                    />
                    <label className="text-xs text-gray-500 dark:text-gray-400 text-center block mt-1">
                      Seconds
                    </label>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={handleAddBaseline}
                className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                {editingIndex !== null ? 'Update Performance' : 'Add Performance'}
              </button>
            </div>
          )}

          {/* Display added baselines */}
          {baselines.length > 0 && (
            <div className="space-y-2 mt-4">
              <h4 className="font-medium">Added Performances:</h4>
              <div className="space-y-2">
                {baselines.map((baseline, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg text-sm"
                  >
                    <span>
                      {baseline.type === 'strength' 
                        ? `${baseline.metric}: ${baseline.weight}lbs x ${baseline.reps} reps`
                        : `${baseline.metric}: ${baseline.time}`
                      }
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditBaseline(index)}
                        className="p-1 text-blue-500 hover:text-blue-600 transition-colors"
                        aria-label="Edit performance"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBaseline(index)}
                        className="p-1 text-red-500 hover:text-red-600 transition-colors"
                        aria-label="Delete performance"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 border-t pt-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white">
          Import Workout Data
        </h3>
        <div className="bg-gray-50 dark:bg-gray-700/50 p-8 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-400 dark:text-gray-500 mb-4">
            Coming Soon!
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Support for importing workout history from other platforms
          </p>
          <div className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            🔜 Import from Strava, Apple Health, or spreadsheet
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          Back
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Next
        </button>
      </div>
    </form>
  );
}
