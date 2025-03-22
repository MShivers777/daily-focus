'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast'; // Add this import
import supabase from '../api/supabase';
import LoadRatiosGraph from './LoadRatiosGraph';
import LoadRatioDisplay from './LoadRatioDisplay';
import LoadRatiosHeader from './LoadRatiosHeader';
import ErrorMessage from './ErrorMessage';
import WorkoutConfirmation from './WorkoutConfirmation';
import HydrationGuide from './HydrationGuide';
import WorkoutHistoryItem from './WorkoutHistoryItem';
import { useRouter } from 'next/navigation';
import { calculateLoads, previewWorkoutLoads, validateLoads } from '../utils/loadCalculations';
import ExpandedGraphModal from './ExpandedGraphModal';
import { BASE_WORKOUT_SCHEDULE, fetchUserWorkoutSettings, getWorkoutTypeLabel } from '../utils/workoutSchedules';
import Calendar from './Calendar';
import WorkoutTypeSelector from './WorkoutTypeSelector';
import WorkoutDetailsModal from './WorkoutDetailsModal'; // Import the modal component

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function WorkoutTracker() {
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
    if (strengthVolume || cardioLoad) {
      const previewWorkout = {
        workout_date: workoutDate,
        strength_volume: parseInt(strengthVolume) || 0,
        cardio_load: parseInt(cardioLoad) || 0,
        note: note
      };
      // Get actual deload frequency from settings or use default
      const preview = previewWorkoutLoads(
        history,
        previewWorkout
      );
      setPreviewLoads(preview);
    } else {
      setPreviewLoads(null);
    }
  }, [workoutDate, strengthVolume, cardioLoad, history]);

  // Add this effect to update the scheduled workouts when plan start date changes
  useEffect(() => {
    setScheduledWorkouts(getScheduledWorkouts());
  }, [planStartDate, workoutSettings, history]);

  // Copy all the workout-related functions from the dashboard
  const fetchHistory = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', session.user.id)
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
        workout_type: getWorkoutTypeForDate(workoutDate),
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
        workout_type: data.workout_type || getWorkoutTypeForDate(data.workout_date)
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
    const workout_types = [];
    DAYS.forEach((_, dayIndex) => {
      const workouts = tempWorkoutTypes[dayIndex];
      if (workouts && Array.isArray(workouts) && workouts.length > 0) {
        // Debug log
        console.log(`Processing day ${dayIndex}:`, workouts);
        workout_types[dayIndex] = workouts.map(w => ({
          type: w.type,
          subtype: w.subtype
        }));
      }
    });

    // Debug log
    console.log('Processed workout_types:', workout_types);

    const schedule = Object.keys(tempWorkoutTypes)
      .filter(dayIndex => tempWorkoutTypes[dayIndex]?.length > 0)
      .map(dayIndex => parseInt(dayIndex));

    const updatedSettings = {
      ...workoutSettings,
      schedule,
      workout_types,
      workouts_per_week: schedule.length,
      updated_at: new Date().toISOString()
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

// Update getScheduledWorkouts to use the new load calculation
const getScheduledWorkouts = () => {
  const workouts = [];
  if (!workoutSettings || !planStartDate) return [];

  const startDate = new Date(planStartDate);
  const previousWeekDate = new Date(startDate);
  previousWeekDate.setDate(previousWeekDate.getDate() - 7);
  
  const schedule = workoutSettings.schedule || [];
  const workoutTypes = workoutSettings.workout_types || {};
  
  // Get latest loads and calculate progressive loads for 16 weeks
  const baseLoads = getLatestLoads(history, previousWeekDate);
  const weeklyLoads = calculateProgressiveLoads(baseLoads, 16);

  // Generate 16 weeks of workouts
  for (let week = 0; week < 16; week++) {
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + (week * 7) + i);
      
      if (schedule.includes(i)) {
        const isDeload = (week + 1) % 4 === 0; // Every 4th week is deload
        const weeklyLoad = weeklyLoads[week];
        
        // Get the workout type(s) for this day
        let dayWorkouts = workoutTypes[i];
        
        // Normalize dayWorkouts to always be an array
        if (!dayWorkouts) {
          // No workouts defined, use default
          dayWorkouts = [{
            type: 'Strength',
            subtype: null
          }];
        } else if (!Array.isArray(dayWorkouts)) {
          // Single workout object - convert to array
          dayWorkouts = [{
            type: dayWorkouts.type || 'Strength',
            subtype: dayWorkouts.subtype || null
          }];
        }

        // Now dayWorkouts is guaranteed to be an array
        dayWorkouts.forEach(workout => {
          if (workout && workout.type) { // Add extra validation
            workouts.push({
              date: currentDate,
              type: workout.type,
              subtype: workout.subtype || null,
              duration: workoutSettings.workout_duration || 60,
              isDeload,
              deloadType: 'Recovery/Deload Week',
              planned: true,
              strength_volume: workout.type === 'Strength' ? weeklyLoad.strength : 0,
              cardio_load: workout.type === 'Cardio' ? weeklyLoad.cardio : 0
            });
          }
        });
      }
    }
  }

  return workouts;
};

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

  // Helper function to get workouts for a specific day
  const getWorkoutsForDay = (dayIndex, settings) => {
    try {
      if (!settings?.workout_types) return [];
      
      // Debug log
      console.log(`Getting workouts for day ${dayIndex}:`, settings.workout_types[dayIndex]);
      
      const dayWorkouts = settings.workout_types[dayIndex];
      if (!dayWorkouts) return [];
      
      // Ensure we're returning an array
      return Array.isArray(dayWorkouts) ? dayWorkouts : [];
      
    } catch (error) {
      console.error(`Error getting workouts for day ${dayIndex}:`, error);
      return [];
    }
  };

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
            onClick={() => setActiveTab('plan')}
            className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'plan'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Make Workout Plan
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

            {/* Existing Preview Section */}
            {previewLoads && (
              <div className="lg:col-span-2">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Preview Loads
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p>Strength Acute: {previewLoads.strength_acute_load?.toFixed(2)}</p>
                      <p>Strength Chronic: {previewLoads.strength_chronic_load?.toFixed(2)}</p>
                      <p>Strength Ratio: {previewLoads.strength_ratio?.toFixed(2)}</p>
                    </div>
                    <div>
                      <p>Cardio Acute: {previewLoads.cardio_acute_load?.toFixed(2)}</p>
                      <p>Cardio Chronic: {previewLoads.cardio_chronic_load?.toFixed(2)}</p>
                      <p>Cardio Ratio: {previewLoads.cardio_ratio?.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Calendar View */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Calendar</h2>
              <Calendar 
                workouts={(getScheduledWorkouts() || []).concat(
                  (history || []).filter(entry => !entry.planned).map(entry => ({
                    ...entry,
                    date: entry.workout_date
                  }))
                )}
                selectedDate={selectedDate}
                onSelectDate={handleDateSelect}
                onDoubleClickWorkout={handleDoubleClickWorkout} // Pass the handler
              />
            </div>
          </>
        )}
        {activeTab === 'plan' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Weekly Workout Plan</h2>
              {!editingSchedule && (
                <button
                  onClick={() => router.push('/workouts/onboarding')}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
                >
                  Full Reconfigure
                </button>
              )}
            </div>

            {workoutSettings ? (
              <div className="space-y-6">
                {/* Plan Start Date Selection */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Plan Start Date
                  </label>
                  <input
                    type="date"
                    value={planStartDate}
                    onChange={(e) => setPlanStartDate(e.target.value)}
                    className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {/* Schedule Editor */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Weekly Schedule</h3>
                    {editingSchedule ? (
                      <div className="space-x-2">
                        <button
                          onClick={handleScheduleUpdate}
                          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingSchedule(false);
                            setTempSchedule([]);
                            setEditingWorkoutDay(null);
                          }}
                          className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleEditScheduleClick}
                        className="text-sm text-blue-500 hover:text-blue-600"
                      >
                        Edit Schedule
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {DAYS.map((day, index) => {
                      const workouts = editingSchedule
                        ? (tempWorkoutTypes[index] || [])
                        : getWorkoutsForDay(index, workoutSettings);

                      const isWorkoutDay = editingSchedule
                        ? tempWorkoutTypes[index]?.length > 0
                        : workoutSettings?.schedule?.includes(index);

                      return (
                        <div
                          key={day}
                          className={`space-y-2 text-center ${
                            editingSchedule ? 'cursor-pointer' : ''
                          }`}
                          onClick={() => {
                            if (editingSchedule) {
                              setEditingWorkoutDay(index);
                            }
                          }}
                        >
                          <div className="text-sm font-medium">{day.slice(0, 3)}</div>
                          <div className={`space-y-1 ${
                            isWorkoutDay ? '' : 'text-gray-400'
                          }`}>
                            {workouts.length === 0 ? (
                              <div className="text-xs">Rest</div>
                            ) : (
                              workouts.map((workout, i) => (
                                <div
                                  key={i}
                                  className={`text-xs px-2 py-1 rounded break-words ${
                                    workout.type === 'Strength'
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                                      : 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200'
                                  }`}
                                >
                                  {getWorkoutTypeLabel(workout.type, workout.subtype || '')}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Workout Type Selector Modal */}
                  {editingWorkoutDay !== null && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="max-w-md w-full">
                        <WorkoutTypeSelector
                          workoutType={tempWorkoutTypes[editingWorkoutDay] || []}
                          onSelect={(workouts) => handleWorkoutTypeSelect(editingWorkoutDay, workouts)}
                          onCancel={() => setEditingWorkoutDay(null)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Scheduled Workouts */}
                <div className="space-y-4">
                  <h3 className="font-medium">Upcoming Workouts</h3>
                  <div className="divide-y dark:divide-gray-700">
                    {scheduledWorkouts
                      .slice(0, showAllWorkouts ? undefined : 5)
                      .map((workout, index) => (
                        <div key={index} className={`py-3 flex items-center justify-between ${
                          workout.isDeload ? 'opacity-75' : ''
                        }`}>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {workout.date.toLocaleDateString('en-US', { 
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric' 
                              })}
                            </div>
                            {workout.isDeload && (
                              <span className="text-xs text-yellow-600 dark:text-yellow-400">
                                {workout.deloadType}
                              </span>
                            )}
                            {/* Show load metrics */}
                            <div className="text-xs text-gray-500">
                              {workout.type === 'Strength' 
                                ? `Volume: ${workout.strength_volume}`
                                : `Load: ${workout.cardio_load}`
                              }
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-lg ${
                            workout.type === 'Strength'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                              : 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200'
                          }`}>
                            <div className="flex flex-col items-end">
                              <span className="font-medium">
                                {workout.subtype 
                                  ? getWorkoutTypeLabel(workout.type, workout.subtype)
                                  : workout.type
                                }
                              </span>
                              <span className="text-xs opacity-75">
                                {workout.duration}min
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                  {scheduledWorkouts.length > 5 && (
                    <button
                      onClick={() => setShowAllWorkouts(!showAllWorkouts)}
                      className="w-full text-sm text-blue-500 hover:text-blue-600 pt-2"
                    >
                      {showAllWorkouts ? 'Show Less' : `Show ${scheduledWorkouts.length - 5} More`}
                    </button>
                  )}
                </div>

                {/* Add Calendar View */}
                <div className="space-y-4">
                  <h3 className="font-medium">Calendar View</h3>
                  <Calendar 
                    workouts={getScheduledWorkouts() || []}
                    selectedDate={selectedDate}
                    onSelectDate={handleDateSelect}
                  />
                </div>

                {/* Schedule Details */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h3 className="font-medium mb-2">Schedule Details</h3>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <p>• {workoutSettings.workouts_per_week} workouts per week</p>
                    <p>• {workoutSettings.workout_duration} minutes per session</p>
                    <p>• Deload every {workoutSettings.deload_frequency} weeks</p>
                    <p>• Experience Level: {
                      workoutSettings.training_experience >= 3
                        ? 'Advanced'
                        : workoutSettings.training_experience >= 1
                          ? 'Intermediate'
                          : 'Beginner'
                    }</p>
                  </div>
                </div>

                {/* Goals Section */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h3 className="font-medium mb-2">Current Goals</h3>
                  <div className="flex flex-wrap gap-2">
                    {workoutSettings.goals?.map(goal => (
                      <span key={goal} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded text-sm">
                        {goal.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No workout plan set up yet
                </p>
                <button
                  onClick={() => router.push('/workouts/onboarding')}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Create Workout Plan
                </button>
              </div>
            )}
          </div>
        )}
        {activeTab === 'zones' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Training Zones
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: 'Intervals', description: 'High-intensity intervals with recovery periods' },
                { title: 'Tempo', description: 'Sustained effort at threshold pace' },
                { title: 'Steady State', description: 'Moderate intensity continuous effort' },
                { title: 'Zone 2', description: 'Easy aerobic training' },
                { title: 'Sprints', description: 'Maximum effort short intervals' },
                { title: 'Hill Sprints', description: 'High-intensity uphill efforts' }
              ].map((zone, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-900 text-white rounded-lg shadow-md"
                >
                  <h3 className="text-lg font-semibold mb-2">{zone.title}</h3>
                  <p className="text-sm text-gray-400">{zone.description}</p>
                  <div className="mt-4 space-y-2">
                    <input
                      type="text"
                      placeholder="Pace Range"
                      className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-300"
                    />
                    <input
                      type="text"
                      placeholder="Heart Rate Zone"
                      className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-300"
                    />
                    <input
                      type="text"
                      placeholder="Typical Duration"
                      className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-300"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                Edit Zones
              </button>
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
            <LoadRatioDisplay 
              label="Strength"
              value={metrics.strengthRatio}
              isVisible={visibleLines.strength}
              color="bg-blue-500"
              onClick={() => toggleLine('strength')}
            />
            <LoadRatioDisplay 
              label="Cardio"
              value={metrics.cardioRatio}
              isVisible={visibleLines.cardio}
              color="bg-orange-500"
              onClick={() => toggleLine('cardio')}
            />
            <LoadRatioDisplay 
              label="Combined"
              value={metrics.combinedRatio}
              isVisible={visibleLines.combined}
              color="bg-green-500"
              onClick={() => toggleLine('combined')}
            />
          </div>
          <div 
            onClick={() => setIsGraphExpanded(true)}
            className="cursor-pointer transition-all hover:opacity-80"
          >
            <LoadRatiosGraph 
              data={history.slice(0, 14).reverse()} 
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
                const pattern = getWorkoutPattern(workoutSettings);
                const workoutType = isWorkoutDay && pattern 
                  ? pattern[workoutSettings.schedule.indexOf(index) % pattern.length]
                  : null;

                return (
                  <div key={day} className="space-y-1">
                    <div className={`p-2 rounded-lg text-sm ${
                      isWorkoutDay
                        ? 'bg-gray-50 dark:bg-gray-700/50'
                        : 'text-gray-400'
                    }`}>
                      {day.slice(0, 3)}
                    </div>
                    {workoutType && (
                      <div className={`text-xs px-2 py-1 rounded ${
                        workoutType === 'Strength'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                          : 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200'
                      }`}>
                        {workoutType}
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
                onUpdate={(workout) => {
                  if (workout) {
                    handleEditWorkout(workout);
                  } else {
                    fetchHistory();
                  }
                }}
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
          data={history}  // Show all history in expanded view
          visibleLines={visibleLines}
          expanded={true}
        />
      </ExpandedGraphModal>

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