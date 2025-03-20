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
import { BASE_WORKOUT_SCHEDULE, fetchUserWorkoutSettings } from '../utils/workoutSchedules';
import Calendar from './Calendar';

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

      // Get days that have workouts assigned
      const schedule = Object.entries(tempWorkoutTypes)
        .filter(([_, type]) => type !== null)
        .map(([index]) => parseInt(index));

      // Create workout_types object with the custom pattern
      const workout_types = {};
      schedule.forEach((dayIndex, i) => {
        workout_types[dayIndex] = tempWorkoutTypes[dayIndex];
      });

      const updatedSettings = {
        ...workoutSettings,
        schedule,
        workout_types,
        workouts_per_week: schedule.length,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('user_workout_settings')
        .upsert(updatedSettings);

      if (error) throw error;
      
      // Update local state
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

  const getLatestLoads = (history) => {
    const latestWorkout = history[0];
    return {
      strengthChronic: latestWorkout?.strength_chronic_load || 100, // default starting value
      cardioChronic: latestWorkout?.cardio_chronic_load || 50,     // default starting value
      strengthVolume: latestWorkout?.strength_volume || 100,        // last actual volume
      cardioLoad: latestWorkout?.cardio_load || 50                 // last actual load
    };
  };

  const calculateProgressiveLoads = (baseLoads, totalWeeks = 4) => {
    const progressionRate = 1.1; // 10% increase per week
    const deloadFactor = 0.5;   // 50% reduction for deload
    const loads = [];

    let currentStrength = baseLoads.strengthVolume;
    let currentCardio = baseLoads.cardioLoad;
    let lastNonDeloadStrength = currentStrength;
    let lastNonDeloadCardio = currentCardio;

    for (let week = 0; week < totalWeeks; week++) {
      // On week 4 (index 3), do deload. After deload, repeat last non-deload values
      if ((week + 1) % 4 === 0) {
        // Deload week
        currentStrength = Math.round(lastNonDeloadStrength * deloadFactor);
        currentCardio = Math.round(lastNonDeloadCardio * deloadFactor);
      } else if (week % 4 === 0 && week > 0) {
        // First week after deload - reset to last non-deload values
        currentStrength = lastNonDeloadStrength;
        currentCardio = lastNonDeloadCardio;
      } else {
        // Progressive overload
        if (week > 0) {
          currentStrength = Math.round(currentStrength * progressionRate);
          currentCardio = Math.round(currentCardio * progressionRate);
        }
        // Store non-deload values
        lastNonDeloadStrength = currentStrength;
        lastNonDeloadCardio = currentCardio;
      }

      loads.push({
        strength: currentStrength,
        cardio: currentCardio
      });
    }

    return loads;
  };

  const getScheduledWorkouts = () => {
    const workouts = [];
    if (!workoutSettings || !planStartDate) return [];

    const startDate = new Date(planStartDate);
    const schedule = workoutSettings.schedule;
    const pattern = getWorkoutPattern(workoutSettings);
    
    // Get latest loads and calculate progressive loads for 4 weeks
    const baseLoads = getLatestLoads(history);
    const weeklyLoads = calculateProgressiveLoads(baseLoads, 4);

    // Generate 4 weeks of workouts
    for (let week = 0; week < 4; week++) {
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + (week * 7) + i);
        
        if (schedule.includes(i)) {
          const workoutIndex = schedule.indexOf(i);
          const workoutType = pattern[workoutIndex % pattern.length];
          const isDeload = week === 3; // Fourth week is always deload
          const weeklyLoad = weeklyLoads[week];

          workouts.push({
            date: currentDate,
            type: workoutType,
            duration: workoutSettings.workout_duration,
            isDeload,
            deloadType: 'Recovery/Deload Week',
            planned: true,
            strength_volume: workoutType === 'Strength' ? weeklyLoad.strength : 0,
            cardio_load: workoutType === 'Cardio' ? weeklyLoad.cardio : 0
          });
        }
      }
    }

    return workouts;
  };

  const cycleWorkoutType = (current) => {
    if (!current) return 'Strength';
    if (current === 'Strength') return 'Cardio';
    return null; // back to rest
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setWorkoutDate(date.toISOString().split('T')[0]);
    
    // If we're on the tracking tab, scroll to the form
    if (activeTab === 'track') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
        </div>

        {activeTab === 'track' ? (
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
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Calendar</h2>
              <Calendar 
                workouts={(getScheduledWorkouts() || []).concat(
                  (history || []).filter(entry => !entry.planned).map(entry => ({
                    ...entry,
                    date: entry.workout_date
                  }))
                )}
                selectedDate={selectedDate}
                onSelectDate={handleDateSelect}
              />
            </div>
          </>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                Weekly Workout Plan
              </h2>
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
                {/* Date Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Plan Start Date
                  </label>
                  <input
                    type="date"
                    value={planStartDate}
                    onChange={(e) => setPlanStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700"
                  />
                </div>

                {/* Schedule Editor */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
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
                          }}
                          className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          // Initialize workout types from current settings
                          const schedule = workoutSettings.schedule || [];
                          const types = workoutSettings.workout_types || {};
                          
                          setTempSchedule(
                            DAYS.map((_, i) => schedule.includes(i))
                          );
                          setTempWorkoutTypes(types);
                          setEditingSchedule(true);
                        }}
                        className="text-sm text-blue-500 hover:text-blue-600"
                      >
                        Edit Schedule
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {DAYS.map((day, index) => {
                      const isWorkoutDay = editingSchedule
                        ? tempSchedule[index]
                        : workoutSettings.schedule?.includes(index);
                      const pattern = getWorkoutPattern(workoutSettings);
                      const workoutType = editingSchedule
                        ? tempWorkoutTypes[index]
                        : (isWorkoutDay && pattern 
                            ? pattern[workoutSettings.schedule.indexOf(index) % pattern.length]
                            : null);

                      return (
                        <div
                          key={day}
                          className={`space-y-2 text-center ${
                            editingSchedule ? 'cursor-pointer' : ''
                          }`}
                          onClick={() => {
                            if (editingSchedule) {
                              // Cycle through workout types
                              const nextType = cycleWorkoutType(tempWorkoutTypes[index]);
                              setTempWorkoutTypes(prev => ({
                                ...prev,
                                [index]: nextType
                              }));
                              // Update schedule to match (active if has workout type)
                              const newSchedule = [...tempSchedule];
                              newSchedule[index] = nextType !== null;
                              setTempSchedule(newSchedule);
                            }
                          }}
                        >
                          <div className="text-sm font-medium">{day.slice(0, 3)}</div>
                          <div className={`text-xs px-2 py-1 rounded ${
                            workoutType === 'Strength'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                              : workoutType === 'Cardio'
                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200'
                                : 'text-gray-400'
                          }`}>
                            {workoutType || 'Rest'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Scheduled Workouts */}
                <div className="space-y-4">
                  <h3 className="font-medium">Upcoming Workouts</h3>
                  <div className="divide-y dark:divide-gray-700">
                    {getScheduledWorkouts()
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
                            <div className="text-xs text-gray-500">
                              {workout.type === 'Strength' 
                                ? `Volume: ${workout.strength_volume}`
                                : `Load: ${workout.cardio_load}`
                              }
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-lg text-sm ${
                            workout.type === 'Strength'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                              : 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200'
                          }`}>
                            {workout.type}
                            <span className="ml-2 text-xs opacity-75">
                              {workout.duration}min
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                  {getScheduledWorkouts().length > 5 && (
                    <button
                      onClick={() => setShowAllWorkouts(!showAllWorkouts)}
                      className="w-full text-sm text-blue-500 hover:text-blue-600 pt-2"
                    >
                      {showAllWorkouts ? 'Show Less' : `Show ${getScheduledWorkouts().length - 5} More`}
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
    </div>
  );
}