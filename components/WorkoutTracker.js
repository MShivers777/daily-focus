'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react'; // Ensured useCallback is imported
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast from 'react-hot-toast';
import HydrationGuide from './HydrationGuide';
import LoadRatiosGraph from './LoadRatiosGraph';
import LoadRatioDisplay from './LoadRatioDisplay';
import LoadRatiosHeader from './LoadRatiosHeader';
import ErrorMessage from './ErrorMessage';
import WorkoutConfirmation from './WorkoutConfirmation';
import WorkoutHistoryItem from './WorkoutHistoryItem';
import { useRouter } from 'next/navigation';
import { calculateLoads, previewWorkoutLoads, validateLoads } from '../utils/loadCalculations';
import ExpandedGraphModal from './ExpandedGraphModal';
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

// IMPORTANT: For the memoizations in this component (useMemo, useCallback) to effectively 
// prevent unnecessary re-renders of child components (like Calendar, LoadRatiosGraph, 
// LoadRatioDisplay, WorkoutHistoryItem), those child components *must* be wrapped 
// with React.memo in their respective files. 
// e.g., export default React.memo(Calendar);

export default function WorkoutTracker() {
  const supabase = createClientComponentClient();
  const router = useRouter();
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

  // Add this effect to update the scheduled workouts when plan start date changes
  useEffect(() => {
    setScheduledWorkouts(getScheduledWorkouts());
  }, [planStartDate, workoutSettings, history]); // Removed getScheduledWorkouts from deps, it's defined in component scope

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

      // Construct workout data for load calculation
      const currentWorkoutData = {
        workout_date: workoutDate,
        strength_volume: parseInt(strengthVolume) || 0,
        cardio_load: parseInt(cardioLoad) || 0,
        note: note,
        user_id: session.user.id,
        workout_type: workoutType,
        subtype: workoutSubtype || null,
        planned: false
      };
      
      // Call previewWorkoutLoads here, only on submit
      // Ensure previewWorkoutLoads returns all necessary fields for saving (e.g., ratios, acute/chronic loads)
      const calculatedLoadData = previewWorkoutLoads(history, currentWorkoutData);

      // Merge current workout data with calculated load data
      const formattedData = {
        ...currentWorkoutData,
        ...calculatedLoadData, // Assuming calculatedLoadData contains fields like strength_ratio, cardio_ratio etc.
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
        setPendingWorkout(formattedData); // pendingWorkout now includes calculated loads
        setShowWorkoutConfirm(true);
        return;
      }

      await saveWorkout(formattedData); // saveWorkout receives data with calculated loads
      // toast.success('Workout saved successfully'); // Toast is handled in saveWorkout
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
      // data already includes calculated loads from handleSubmit
      const baseData = {
        workout_date: data.workout_date,
        strength_volume: parseInt(data.strength_volume) || 0,
        cardio_load: parseInt(data.cardio_load) || 0,
        note: data.note || '',
        user_id: session.user.id,
        workout_type: data.workout_type,
        subtype: data.subtype || null,
        planned: data.planned || false, // Ensure planned status is preserved or defaulted
        // Include other fields from calculatedLoadData if they are separate columns
        strength_ratio: data.strength_ratio, // Example: ensure these are in data
        cardio_ratio: data.cardio_ratio,     // Example: ensure these are in data
        combined_ratio: data.combined_ratio, // Example: ensure these are in data
        // Add other calculated fields as necessary
        // strength_acute_load: data.strength_acute_load, 
        // strength_chronic_load: data.strength_chronic_load,
        // cardio_acute_load: data.cardio_acute_load,
        // cardio_chronic_load: data.cardio_chronic_load,
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

  const toggleLine = useCallback((line) => {
    setVisibleLines(prev => ({
      ...prev,
      [line]: !prev[line]
    }));
  }, [setVisibleLines]); // setVisibleLines is stable

  const handleNumberInput = (e, setter) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setter(value);
    }
  };

  const handleEditWorkout = useCallback((workout) => {
    setExistingWorkout(workout);
    setWorkoutDate(workout.workout_date);
    setStrengthVolume(workout.strength_volume.toString());
    setCardioLoad(workout.cardio_load.toString());
    setNote(workout.note || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setExistingWorkout, setWorkoutDate, setStrengthVolume, setCardioLoad, setNote]); // Added dependencies

  const handleHistoryDoubleClick = useCallback(() => {
    router.push('/workouts/history');
  }, [router]);

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

// Helper function to get workouts for a specific day - consolidated version
const getWorkoutsForDay = (dayIndex, settings) => {
  try {
    const selectedWorkouts = settings?.selected_workouts || [];
    const dayName = DAYS[dayIndex].toLowerCase();

    // Filter workouts for the specific day
    const dayWorkouts = selectedWorkouts.filter(workout => workout.day === dayName);

    return dayWorkouts;
  } catch (error) {
    console.error(`Error getting workouts for day ${dayIndex}:`, error);
    return [];
  }
};

// Update getScheduledWorkouts to use the consolidated getWorkoutsForDay
// This function depends on workoutSettings and planStartDate, which are state/props.
// To avoid it being a dependency in useEffect that causes re-runs,
// ensure its dependencies are stable or wrap its usage.
// For now, assuming its definition here is fine and its dependencies are handled in the useEffect.
const getScheduledWorkouts = useCallback(() => {
    const workouts = [];
    if (!workoutSettings) return workouts;

    DAYS.forEach((_, dayIndex) => {
      const dayWorkouts = getWorkoutsForDay(dayIndex, workoutSettings); // getWorkoutsForDay also needs to be stable or its deps listed
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
  }, [workoutSettings, planStartDate]); // Added dependencies

  useEffect(() => {
    setScheduledWorkouts(getScheduledWorkouts());
  }, [getScheduledWorkouts]); // Now correctly depends on the memoized getScheduledWorkouts


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

  const handleDateSelect = useCallback((date) => {
    setSelectedDate(date);
    setWorkoutDate(date.toISOString().split('T')[0]);
    // If we're on the tracking tab, scroll to the form
    if (activeTab === 'track') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab, setSelectedDate, setWorkoutDate]); // Added dependencies

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

  const handleDoubleClickWorkout = useCallback((workouts) => {
    setSelectedWorkoutsForModal(workouts);
    setIsModalOpen(true); // Open the modal
  }, [setSelectedWorkoutsForModal, setIsModalOpen]); // Added dependencies

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false); // Close the modal
    setSelectedWorkoutsForModal([]);
  }, [setIsModalOpen, setSelectedWorkoutsForModal]); // Added dependencies

  // Memoize props for child components
  const calendarWorkouts = useMemo(() => {
    return scheduledWorkouts.concat(
      history.map(entry => ({
        ...entry,
        date: new Date(entry.workout_date), // Ensure date is a Date object
      }))
    );
  }, [scheduledWorkouts, history]);

  const graphData = useMemo(() => {
    // Slice and reverse history for the small graph display
    return history.slice(0, 14).reverse();
  }, [history]);

  // Data for the expanded graph modal (all history)
  const expandedGraphData = useMemo(() => {
    return history; // Pass the full history, LoadRatiosGraph can handle if it needs reversing
  }, [history]);

  // Memoized onClick handlers for LoadRatioDisplay
  const handleToggleStrengthLine = useCallback(() => toggleLine('strength'), [toggleLine]);
  const handleToggleCardioLine = useCallback(() => toggleLine('cardio'), [toggleLine]);
  const handleToggleCombinedLine = useCallback(() => toggleLine('combined'), [toggleLine]);

  // Memoized callback for WorkoutHistoryItem onUpdate
  const handleWorkoutHistoryItemUpdate = useCallback((workout) => {
    if (workout) {
      handleEditWorkout(workout);
    } else {
      fetchHistory(); // fetchHistory is stable (defined once in component scope)
    }
  }, [handleEditWorkout, fetchHistory]); // Dependencies


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column */}
      <div className="lg:col-span-2 space-y-6">
        {/* Workout Form */}
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
              placeholder="Cardio Load" 
              value={cardioLoad} 
              onChange={(e) => handleNumberInput(e, setCardioLoad)} 
              className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
            />
            <textarea 
              placeholder="Workout Notes" 
              value={note} 
              onChange={(e) => setNote(e.target.value)} 
              rows="3"
              className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none" 
            />
            <button 
              type="submit" 
              className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:scale-95 transition-all font-medium"
            >
              Save Workout
            </button>
          </form>
        </div>

        {/* Calendar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Calendar</h2>
          <Calendar 
            workouts={calendarWorkouts} // Use memoized prop
            selectedDate={selectedDate}
            onSelectDate={handleDateSelect}
            onDoubleClickWorkout={handleDoubleClickWorkout}
          />
        </div>
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        {/* Load Ratios Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <LoadRatiosHeader />
          <div className="space-y-2 mb-4">
            <LoadRatioDisplay 
              label="Strength"
              value={metrics.strengthRatio}
              isVisible={visibleLines.strength}
              color="bg-blue-500"
              onClick={handleToggleStrengthLine} // Use memoized handler
            />
            <LoadRatioDisplay 
              label="Cardio"
              value={metrics.cardioRatio}
              isVisible={visibleLines.cardio}
              color="bg-orange-500"
              onClick={handleToggleCardioLine} // Use memoized handler
            />
            <LoadRatioDisplay 
              label="Combined"
              value={metrics.combinedRatio}
              isVisible={visibleLines.combined}
              color="bg-green-500"
              onClick={handleToggleCombinedLine} // Use memoized handler
            />
          </div>
          <div 
            onClick={() => setIsGraphExpanded(true)}
            className="cursor-pointer transition-all hover:opacity-80"
          >
            <LoadRatiosGraph 
              data={graphData} // Use memoized prop
              visibleLines={visibleLines} 
            />
          </div>
        </div>

        {/* Updated Schedule Card */}
        {workoutSettings && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Weekly Schedule
            </h2>
            <div className="grid grid-cols-7 gap-2 text-center mb-4">
              {DAYS.map((day, index) => {
                const isWorkoutDay = workoutSettings.schedule?.includes(index);
                const dayWorkouts = getWorkoutsForDay(index, workoutSettings);
                
                return (
                  <div key={day} className="space-y-1">
                    <div className={`p-2 rounded-lg text-sm ${
                      isWorkoutDay
                        ? 'bg-gray-50 dark:bg-gray-700/50'
                        : 'text-gray-400'
                    }`}>
                      {day.slice(0, 3)}
                    </div>
                    {dayWorkouts && dayWorkouts.length > 0 && (
                      <div className="space-y-1">
                        {dayWorkouts.map((workoutItem, i) => (
                          <div 
                            key={i}
                            className={`text-xs px-2 py-1 rounded ${
                              workoutItem.type === 'Strength'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                                : 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200'
                            }`}>
                            {workoutItem.type}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>{workoutSettings.workouts_per_week} workouts per week</p>
              <p>{workoutSettings.workout_duration} minutes per session</p>
            </div>
          </div>
        )}

        {/* History Card */}
        <div 
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm cursor-pointer"
          onDoubleClick={handleHistoryDoubleClick}
        >
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Recent History
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              (double-click for full history)
            </span>
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {history.map((entry) => (
              <WorkoutHistoryItem 
                key={entry.id}
                entry={entry}
                onUpdate={handleWorkoutHistoryItemUpdate} // Use memoized callback
              />
            ))}
          </div>
        </div>
      </div>

      <WorkoutConfirmation 
        isOpen={showWorkoutConfirm}
        onClose={() => setShowWorkoutConfirm(false)}
        existingWorkout={existingWorkout}
        newWorkout={pendingWorkout}
        onAdd={() => saveWorkout(pendingWorkout, 'add')}
        onReplace={() => saveWorkout(pendingWorkout, 'replace')}
        onEdit={handleEdit}
      />

      <HydrationGuide 
        isOpen={showHydrationGuide} 
        onClose={() => {
          setShowHydrationGuide(false);
          setSaveError(null);
        }}
        isSaving={isSaving}
        error={saveError}
      />

      <ExpandedGraphModal
        isOpen={isGraphExpanded}
        onClose={() => setIsGraphExpanded(false)}
      >
        <LoadRatiosGraph 
          data={expandedGraphData}  // Use memoized prop for expanded view
          visibleLines={visibleLines}
          expanded={true}
        />
      </ExpandedGraphModal>

      {/* Workout Details Modal */}
      {isModalOpen && (
        <WorkoutDetailsModal 
          workouts={selectedWorkoutsForModal}
          onClose={handleCloseModal} // Use memoized handler
        />
      )}
    </div>
  );
}