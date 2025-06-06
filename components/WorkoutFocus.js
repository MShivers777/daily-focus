'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Added useCallback, useMemo
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast from 'react-hot-toast';
import ErrorMessage from './ErrorMessage';
import { calculateLoads, previewWorkoutLoads, validateLoads } from '../utils/loadCalculations';
import { BASE_WORKOUT_SCHEDULE, fetchUserWorkoutSettings, getWorkoutTypeLabel } from '../utils/workoutSchedules';
import Calendar from './Calendar';
import WorkoutTypeSelector from './workout-onboarding/WorkoutTypeSelector';
import WorkoutDetailsModal from './WorkoutDetailsModal'; // Import the modal component

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const STRENGTH_WORKOUT_TYPES = [
  { id: 'full_body', label: 'Full Body' },
  { id: 'upper_body', label: 'Upper Body' },
  { id: 'lower_body', label: 'Lower Body' },
  { id: 'push', label: 'Push' },
  { id: 'pull', label: 'Pull' },
  { id: 'legs', label: 'Legs' },
  { id: 'squats', label: 'Squats' },
  { id: 'deadlifts', label: 'Deadlifts' },
  { id: 'bench', label: 'Bench Press' },
  { id: 'olympic', label: 'Olympic Lifts' },
  { id: 'workout_a', label: 'Workout A' },
  { id: 'workout_b', label: 'Workout B' },
  { id: 'workout_c', label: 'Workout C' }
];

const CARDIO_WORKOUT_TYPES = [
  { id: 'zone2', label: 'Zone 2' },
  { id: 'intervals', label: 'Intervals' },
  { id: 'hiit', label: 'HIIT' },
  { id: 'sprints', label: 'Sprints' },
  { id: 'hill_sprints', label: 'Hill Sprints' },
  { id: 'steady_state', label: 'Steady State' },
  { id: 'tempo', label: 'Tempo Run' },
  { id: 'long_run', label: 'Long Run' },  // Add this line
  { id: 'cycling', label: 'Cycling' },
  { id: 'swimming', label: 'Swimming' },
  { id: 'rowing', label: 'Rowing' },
  { id: 'cardio_a', label: 'Cardio A' },
  { id: 'cardio_b', label: 'Cardio B' }
];

export default function WorkoutTracker() {
  const supabase = createClientComponentClient();
  const [workoutDate, setWorkoutDate] = useState(() => {
    // Get today's date in YYYY-MM-DD format in local timezone
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [strengthVolume, setStrengthVolume] = useState('');
  const [cardioLoad, setCardioLoad] = useState('');
  const [note, setNote] = useState('');
  const [history, setHistory] = useState([]);
  const [metrics, setMetrics] = useState({
    strengthRatio: 0,
    cardioRatio: 0,
    combinedRatio: 0
  });
  const [visibleLines, setVisibleLines] = useState({
    strength: true,
    cardio: true,
    combined: true
  });
  const [showHydrationGuide, setShowHydrationGuide] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [showWorkoutConfirm, setShowWorkoutConfirm] = useState(false);
  const [existingWorkout, setExistingWorkout] = useState(null);
  const [pendingWorkout, setPendingWorkout] = useState(null);
  const [previewLoads, setPreviewLoads] = useState(null);
  const [isGraphExpanded, setIsGraphExpanded] = useState(false);
  const [workoutSettings, setWorkoutSettings] = useState(null);
  const [activeTab, setActiveTab] = useState('track');
  const [planStartDate, setPlanStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [tempSchedule, setTempSchedule] = useState([]);
  const [tempWorkoutTypes, setTempWorkoutTypes] = useState({});
  const [showAllWorkouts, setShowAllWorkouts] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingWorkoutDay, setEditingWorkoutDay] = useState(null);
  const [scheduledWorkouts, setScheduledWorkouts] = useState([]);
  const [selectedWorkoutsForModal, setSelectedWorkoutsForModal] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [workoutType, setWorkoutType] = useState('Strength');
  const [workoutSubtype, setWorkoutSubtype] = useState('');

  useEffect(() => {
    fetchHistory();
    
    const fetchSettings = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const data = await fetchUserWorkoutSettings(supabase, session.user.id);
        if (data) {
          setWorkoutSettings(data);
        }
      } catch (error) {
        console.error('Error fetching workout settings:', error);
      }
    };

    fetchSettings();
  }, []);

  // Add this effect to update preview loads when form changes
  useEffect(() => {
    if (!strengthVolume && !cardioLoad) {
      setPreviewLoads(null);
      return;
    }

    const handler = setTimeout(() => {
      const previewWorkout = {
        workout_date: workoutDate,
        strength_volume: parseInt(strengthVolume) || 0,
        cardio_load: parseInt(cardioLoad) || 0,
        note: note
      };
      const preview = previewWorkoutLoads(
        history,
        previewWorkout
      );
      setPreviewLoads(preview);
    }, 500); // Debounce by 500ms

    return () => {
      clearTimeout(handler);
    };
  }, [workoutDate, strengthVolume, cardioLoad, note, history]); // Added note to dependencies

  // Helper function to get workouts for a specific day - consolidated version
  const getWorkoutsForDay = useCallback((dayIndex, settings) => {
    try {
      const selectedWorkouts = settings?.selected_workouts || [];
      const dayName = DAYS[dayIndex].toLowerCase();

      // Filter workouts for the specific day
      const dayWorkouts = selectedWorkouts.filter(workout => workout.day === dayName);

      // REMOVED DEBUG LOG: console.log(`Getting workouts for day ${dayIndex} (${dayName}):`, dayWorkouts);

      return dayWorkouts;
    } catch (error) {
      console.error(`Error getting workouts for day ${dayIndex}:`, error);
      return [];
    }
  }, []); // DAYS is a constant from outer scope

  // Update getScheduledWorkouts to use the consolidated getWorkoutsForDay
  const memoizedGetScheduledWorkouts = useCallback(() => {
    const workouts = [];
    if (!workoutSettings) return workouts;

    DAYS.forEach((_, dayIndex) => {
      const dayWorkouts = getWorkoutsForDay(dayIndex, workoutSettings);
      dayWorkouts.forEach(workout => {
        const date = new Date(planStartDate);
        date.setDate(date.getDate() + dayIndex);
        workouts.push({
          date: new Date(date), // Ensure it's a Date object
          type: workout.type,
          subtype: workout.subtype || null,
          duration: workout.duration || workoutSettings.workout_duration,
          planned: true,
        });
      });
    });

    return workouts;
  }, [workoutSettings, planStartDate, getWorkoutsForDay]); // getWorkoutsForDay is stable

  // Add this effect to update the scheduled workouts when plan start date changes
  useEffect(() => {
    setScheduledWorkouts(memoizedGetScheduledWorkouts());
  }, [memoizedGetScheduledWorkouts]); // Dependency is the memoized function itself

  // Copy all the workout-related functions from the dashboard
  const fetchHistory = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch only completed workouts (planned = false)
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('planned', false) // Exclude planned workouts
        .order('workout_date', { ascending: false });

      if (error) throw error;

      setHistory(data);

      const latestEntry = data[0];
      if (latestEntry) {
        setMetrics({
          strengthRatio: latestEntry.strength_ratio || 0,
          cardioRatio: latestEntry.cardio_ratio || 0,
          combinedRatio: latestEntry.combined_ratio || 0
        });
      }
    } catch (error) {
      console.error('History fetch error:', error);
    }
  };

  const getWorkoutTypeForDate = (date) => {
    if (!workoutSettings?.schedule) return 'mixed';
    const dayIndex = new Date(date).getDay();
    const scheduleIndex = workoutSettings.schedule.indexOf(dayIndex);
    if (scheduleIndex === -1) return 'unscheduled';
    
    // Check for specific workout types in the workout settings
    if (workoutSettings.workout_types && workoutSettings.workout_types[dayIndex]) {
      // Return the type string, not the object
      const workoutType = workoutSettings.workout_types[dayIndex];
      return workoutType.type || 'mixed';
    }
    
    const pattern = getWorkoutPattern(workoutSettings);
    return pattern?.[scheduleIndex % pattern.length] || 'mixed';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to save workouts');
        return;
      }
      const formattedData = {
        workout_date: workoutDate,
        strength_volume: parseInt(strengthVolume) || 0,
        cardio_load: parseInt(cardioLoad) || 0,
        note: note,
        user_id: session.user.id,
        workout_type: workoutType,
        subtype: workoutSubtype || null, // Add subtype field
        planned: false  // Ensure completed workouts are not marked as planned
      };
      const { data: existingData, error: checkError } = await supabase
        .from('workouts')
        .select('*')
        .eq('workout_date', workoutDate)
        .eq('user_id', session.user.id);
      if (checkError) {
        toast.error('Error checking for existing workout');
        console.error('Error checking existing workout:', checkError);
        return;
      }
      if (existingData && existingData.length > 0) {
        setExistingWorkout(existingData[0]);
        setPendingWorkout(formattedData);
        setShowWorkoutConfirm(true);
        return;
      }
      await saveWorkout(formattedData);
      toast.success('Workout saved successfully');
    } catch (error) {
      console.error('Error submitting workout:', error);
      toast.error(error.message || 'Failed to save workout');
    }
  };

  const handleEdit = () => {
    // Pre-fill form with existing data
    setWorkoutDate(existingWorkout.workout_date);
    setStrengthVolume(existingWorkout.strength_volume.toString());
    setCardioLoad(existingWorkout.cardio_load.toString());
    setNote(existingWorkout.note || '');
    setShowWorkoutConfirm(false);
  };

  const saveWorkout = async (data, mode = 'new') => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session found');
      }
      const baseData = {
        workout_date: data.workout_date,
        strength_volume: parseInt(data.strength_volume) || 0,
        cardio_load: parseInt(data.cardio_load) || 0,
        note: data.note || '',
        user_id: session.user.id,
        workout_type: data.workout_type,
        subtype: data.subtype || null,
        planned: false  // Always set planned to false when saving a workout
      };

      let response;
      if (mode === 'add' || mode === 'replace') {
        if (!existingWorkout?.id) {
          throw new Error('No existing workout found for update');
        }
        const updatedData = mode === 'add' 
          ? { 
              ...baseData,
              strength_volume: (existingWorkout.strength_volume || 0) + (baseData.strength_volume || 0),
              cardio_load: (existingWorkout.cardio_load || 0) + (baseData.cardio_load || 0),
              note: baseData.note ? `${existingWorkout.note || ''}\n${baseData.note}` : existingWorkout.note
            } 
          : baseData;
        response = await supabase
          .from('workouts')
          .update(updatedData)
          .eq('id', existingWorkout.id)
          .select()
          .single();
      } else {
        response = await supabase
          .from('workouts')
          .insert([baseData])
          .select()
          .single();
      }
      if (response.error) {
        throw new Error(response.error.message);
      }
      await fetchHistory();
      setShowHydrationGuide(true);
      // Reset form
      setWorkoutDate(new Date().toISOString().split('T')[0]);
      setStrengthVolume('');
      setCardioLoad('');
      setNote('');
      toast.success('Workout saved successfully');
    } catch (error) {
      console.error('Failed to save workout:', error);
      setSaveError(error.message);
      toast.error(error.message || 'Failed to save workout');
      throw error;
    } finally {
      setIsSaving(false);
      setShowWorkoutConfirm(false);
      setExistingWorkout(null);
      setPendingWorkout(null);
    }
  };

  const toggleLine = (line) => {
    setVisibleLines(prev => ({
      ...prev,
      [line]: !prev[line]
    }));
  };

  const handleNumberInput = (e, setter) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setter(value);
    }
  };

  const handleEditWorkout = (workout) => {
    setExistingWorkout(workout);
    setWorkoutDate(workout.workout_date);
    setStrengthVolume(workout.strength_volume.toString());
    setCardioLoad(workout.cardio_load.toString());
    setNote(workout.note || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHistoryDoubleClick = () => {
    router.push('/workouts/history');
  };

  const getWorkoutPattern = (workoutSettings) => {
    if (!workoutSettings) return null;
    
    // First check for custom workout types
    if (workoutSettings.workout_types) {
      const pattern = Object.entries(workoutSettings.workout_types)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .map(([_, type]) => type);
      if (pattern.length > 0) return pattern;
    }

    // Fall back to default patterns if no custom pattern exists
    const experienceLevel = workoutSettings.training_experience >= 3 
      ? 'advanced' 
      : workoutSettings.training_experience >= 1 
        ? 'intermediate' 
        : 'beginner';
    const daysPerWeek = workoutSettings.schedule.length;
    return BASE_WORKOUT_SCHEDULE[experienceLevel][daysPerWeek]?.pattern;
  };

const handleScheduleUpdate = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Debug log
    console.log('Current tempWorkoutTypes:', tempWorkoutTypes);

    // Convert workouts to array format and add debug logging
    const workout_types = Array(7).fill([]); // Initialize with empty arrays for each day
    Object.keys(tempWorkoutTypes).forEach((dayIndex) => {
      const workouts = tempWorkoutTypes[dayIndex];
      if (workouts && Array.isArray(workouts) && workouts.length > 0) {
        // Debug log
        console.log(`Processing day ${dayIndex}:`, workouts);
        workout_types[dayIndex] = workouts.map((w) => ({
          type: w.type,
          subtype: w.subtype || null,
        }));
      }
    });

    // Debug log
    console.log('Processed workout_types:', workout_types);

    const schedule = Object.keys(tempWorkoutTypes)
      .filter((dayIndex) => tempWorkoutTypes[dayIndex]?.length > 0)
      .map((dayIndex) => parseInt(dayIndex));

    const updatedSettings = {
      ...workoutSettings,
      schedule,
      workout_types,
      workouts_per_week: schedule.length,
      updated_at: new Date().toISOString(),
    };

    // Debug log
    console.log('Saving settings:', updatedSettings);

    const { error } = await supabase
      .from('user_workout_settings')
      .upsert(updatedSettings);

    if (error) throw error;

    setWorkoutSettings(updatedSettings);
    setEditingSchedule(false);
    setTempWorkoutTypes({});

    // Force refresh of scheduled workouts by updating plan start date
    setPlanStartDate(new Date().toISOString().split('T')[0]);

    toast.success('Schedule updated successfully');
  } catch (error) {
    console.error('Error updating schedule:', error);
    toast.error('Failed to update schedule');
  }
};

const getLatestLoads = (history, previousWeekDate) => {
  // Find the most recent workout from the previous week
  const previousWeekWorkout = history.find(workout => {
    const workoutDate = new Date(workout.workout_date);
    return workoutDate <= previousWeekDate;
  });

  // If we found a previous week's workout, use its values
  if (previousWeekWorkout) {
    return {
      strengthVolume: previousWeekWorkout.strength_volume,
      cardioLoad: previousWeekWorkout.cardio_load,
      strengthRatio: previousWeekWorkout.strength_ratio || 1.0,
      cardioRatio: previousWeekWorkout.cardio_ratio || 1.0
    };
  }

  // If no previous workout, fall back to chronic loads or defaults
  const latestWorkout = history[0];
  return {
    strengthVolume: latestWorkout?.strength_chronic_load || 100,
    cardioLoad: latestWorkout?.cardio_chronic_load || 50,
    strengthRatio: 1.0,
    cardioRatio: 1.0
  };
};

const calculateProgressiveLoads = (baseLoads, totalWeeks = 16) => {
  const loads = [];
  let currentStrength = baseLoads.strengthVolume;
  let currentCardio = baseLoads.cardioLoad;
  let strengthRatio = baseLoads.strengthRatio;
  let cardioRatio = baseLoads.cardioRatio;

  // Store last non-deload values to resume after deload weeks
  let lastNonDeloadStrength = currentStrength;
  let lastNonDeloadCardio = currentCardio;
  let lastNonDeloadStrengthRatio = strengthRatio;
  let lastNonDeloadCardioRatio = cardioRatio;

  for (let week = 0; week < totalWeeks; week++) {
    const isDeloadWeek = (week + 1) % 4 === 0;
    
    if (isDeloadWeek) {
      // Deload week - reduce volume but maintain intensity
      currentStrength = Math.round(lastNonDeloadStrength * 0.5);
      currentCardio = Math.round(lastNonDeloadCardio * 0.5);
      strengthRatio = 0.8;
      cardioRatio = 0.8;
    } else {
      if (week % 4 === 0 && week > 0) {
        // First week after deload - return to pre-deload levels
        currentStrength = lastNonDeloadStrength;
        currentCardio = lastNonDeloadCardio;
        strengthRatio = lastNonDeloadStrengthRatio;
        cardioRatio = lastNonDeloadCardioRatio;
      } else if (week > 0) {
        // Progressive overload with ratio management
        const strengthIncrease = Math.min(1.1, 1.4 / strengthRatio);
        const cardioIncrease = Math.min(1.1, 1.4 / cardioRatio);
        
        currentStrength = Math.round(currentStrength * strengthIncrease);
        currentCardio = Math.round(currentCardio * cardioIncrease);
        
        // Update ratios (capped at 1.4)
        strengthRatio = Math.min(1.4, strengthRatio * strengthIncrease);
        cardioRatio = Math.min(1.4, cardioRatio * cardioIncrease);
      }

      // Store non-deload values
      lastNonDeloadStrength = currentStrength;
      lastNonDeloadCardio = currentCardio;
      lastNonDeloadStrengthRatio = strengthRatio;
      lastNonDeloadCardioRatio = cardioRatio;
    }

    loads.push({
      strength: currentStrength,
      cardio: currentCardio,
      strengthRatio,
      cardioRatio,
      isDeload: isDeloadWeek
    });
  }

  return loads;
};

// REMOVED getWorkoutsForDay from here as it's defined above with useCallback

// REMOVED getScheduledWorkouts from here as it's defined above with useCallback (memoizedGetScheduledWorkouts)

// REMOVED useEffect for scheduledWorkouts as it's defined above

  const cycleWorkoutType = (current, subtype) => {
    if (!current) return { type: 'Strength', subtype: null };
    if (current === 'Strength') return { type: 'Cardio', subtype: null };
    return { type: null, subtype: null }; // back to rest
  };

  const handleWorkoutTypeSelect = (dayIndex, selectedWorkouts) => {
    // If selectedWorkouts is not an array, wrap it in an array
    const workoutsArray = Array.isArray(selectedWorkouts) ? selectedWorkouts : 
                          (selectedWorkouts ? [selectedWorkouts] : []);
    setTempWorkoutTypes(prev => ({
      ...prev,
      [dayIndex]: workoutsArray
    }));
    
    // Update schedule to match (active if has workout types)
    const newSchedule = [...tempSchedule];
    newSchedule[dayIndex] = workoutsArray.length > 0;
    setTempSchedule(newSchedule);
    setEditingWorkoutDay(null);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setWorkoutDate(date.toISOString().split('T')[0]);
    // If we're on the tracking tab, scroll to the form
    if (activeTab === 'track') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleEditScheduleClick = () => {
    const schedule = workoutSettings?.schedule || [];
    const types = workoutSettings?.workout_types || {};
    
    setTempSchedule(DAYS.map((_, i) => schedule.includes(i)));
    
    // Initialize temp workout types
    const initialWorkoutTypes = {};
    DAYS.forEach((_, i) => {
      if (schedule.includes(i)) {
        const existingType = types[i];
        initialWorkoutTypes[i] = Array.isArray(existingType) ? existingType : 
          existingType ? [existingType] : [{ type: 'Strength', subtype: null }];
      } else {
        initialWorkoutTypes[i] = [];
      }
    });
    
    setTempWorkoutTypes(initialWorkoutTypes);
    setEditingSchedule(true);
  };

  const handleDoubleClickWorkout = (workouts) => {
    setSelectedWorkoutsForModal(workouts);
    setIsModalOpen(true); // Open the modal
  };

  const handleCloseModal = () => {
    setIsModalOpen(false); // Close the modal
    setSelectedWorkoutsForModal([]);
  };

  const calendarWorkouts = useMemo(() => {
    return scheduledWorkouts.concat(
      history.map(entry => ({
        ...entry,
        date: new Date(entry.workout_date),
      }))
    );
  }, [scheduledWorkouts, history]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column */}
      <div className="lg:col-span-2 space-y-6">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('track')}
            className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'track'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Track Workout
          </button>
          <button
            onClick={() => setActiveTab('zones')}
            className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'zones'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Workout Zones
          </button>
          <button
            onClick={() => setActiveTab('workouts')}
            className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'workouts'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Workouts
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'track' && (
          <>
            {/* Existing Workout Form */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Add Workout</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input 
                  type="date" 
                  value={workoutDate} 
                  onChange={(e) => setWorkoutDate(e.target.value)} 
                  className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Workout Type
                  </label>
                  <select
                    value={workoutType}
                    onChange={(e) => setWorkoutType(e.target.value)}
                    className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="Strength">Strength</option>
                    <option value="Cardio">Cardio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Workout Subtype
                  </label>
                  <select
                    value={workoutSubtype}
                    onChange={(e) => setWorkoutSubtype(e.target.value)}
                    className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">General</option>
                    {(workoutType === 'Strength'
                      ? STRENGTH_WORKOUT_TYPES
                      : CARDIO_WORKOUT_TYPES
                    ).map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <input 
                  type="text" 
                  inputMode="numeric"
                  pattern="\d*"
                  placeholder="Strength Volume (lbs)" 
                  value={strengthVolume}
                  onChange={(e) => handleNumberInput(e, setStrengthVolume)} 
                  className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                />
                <input 
                  type="text" 
                  inputMode="numeric"
                  pattern="\d*"
                  placeholder="Cardio Load (minutes)" 
                  value={cardioLoad}
                  onChange={(e) => handleNumberInput(e, setCardioLoad)} 
                  className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                />
                <textarea 
                  placeholder="Notes" 
                  value={note} 
                  onChange={(e) => setNote(e.target.value)} 
                  className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                />
                <button 
                  type="submit" 
                  className="w-full p-3 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-all"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Workout'}
                </button>
              </form>
            </div>

            {/* Workout History */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Workout History</h2>
              {history.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">No workouts recorded yet.</p>
              ) : (
                <ul className="space-y-4">
                  {history.map((workout) => (
                    <WorkoutHistoryItem 
                      key={workout.id} 
                      workout={workout} 
                      onEdit={() => handleEditWorkout(workout)} 
                      onDoubleClick={handleHistoryDoubleClick}
                    />
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {activeTab === 'zones' && (
          <div className="lg:col-span-2 space-y-6">
            {/* Render Workout Zones content */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Workout Zones</h2>
              <p className="text-gray-600 dark:text-gray-400">
                View and manage your workout zones here.
              </p>
              {/* Add zones-specific components or logic here */}
            </div>
          </div>
        )}

        {activeTab === 'workouts' && (
          <div className="lg:col-span-2 space-y-6"></div>
            {/* Render Workouts content */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                Workouts
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                View and manage your planned and completed workouts here.
              </p>
              {/* Add workouts-specific components or logic here */}
            </div>
          </div>
        )}
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        {/* Load Ratios Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <LoadRatiosHeader />
          <div className="space-y-2 mb-4">
            {/* ...existing code... */}
          </div>
          <div 
            onClick={() => setIsGraphExpanded(true)}
            className="cursor-pointer transition-all hover:opacity-80"
          >
            <LoadRatiosGraph 
              data={history.slice(-14)} // Use last 14 entries
              visibleLines={visibleLines} 
            />
          </div>
        </div>
        
        {/* Calendar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <Calendar 
            selectedDate={selectedDate} 
            onDateSelect={handleDateSelect} 
            scheduledWorkouts={calendarWorkouts} // Use memoized prop
            onDoubleClickWorkout={handleDoubleClickWorkout}
          />
        </div>

        {/* Hydration Guide */}
        {showHydrationGuide && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <HydrationGuide onClose={() => setShowHydrationGuide(false)} />
          </div>
        )}
      </div>

      {/* Workout Confirmation Modal */}
      {showWorkoutConfirm && (
        <WorkoutConfirmation 
          existingWorkout={existingWorkout} 
          pendingWorkout={pendingWorkout} 
          onConfirm={saveWorkout} 
          onCancel={() => setShowWorkoutConfirm(false)} 
          onEdit={handleEdit}
        />
      )}

      {/* Expanded Graph Modal */}
      {isGraphExpanded && (
        <ExpandedGraphModal 
          isOpen={isGraphExpanded}
          onClose={() => setIsGraphExpanded(false)}
        >
          <LoadRatiosGraph 
            data={history.slice(-14)} // Keep consistent with small view
            visibleLines={visibleLines}
            expanded={true}
          />
        </ExpandedGraphModal>
      )}

      {/* Workout Details Modal */}
      {isModalOpen && (
        <WorkoutDetailsModal 
          workouts={selectedWorkoutsForModal} 
          onClose={handleCloseModal} 
        />
      )}
    </div>
  );
}