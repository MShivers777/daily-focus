'use client';

import { useState, useEffect } from 'react';
import supabase from '../api/supabase';
import LoadRatiosGraph from './LoadRatiosGraph';
import LoadRatioDisplay from './LoadRatioDisplay';
import LoadRatiosHeader from './LoadRatiosHeader';
import ErrorMessage from './ErrorMessage';
import WorkoutConfirmation from './WorkoutConfirmation';
import HydrationGuide from './HydrationGuide';

export default function WorkoutTracker() {
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

  useEffect(() => {
    fetchHistory();
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const formattedData = {
        workout_date: workoutDate,
        strength_volume: parseInt(strengthVolume) || 0,
        cardio_load: parseInt(cardioLoad) || 0,
        note: note,
        user_id: session.user.id,
        created_at: new Date().toISOString()
      };

      // Check for existing workout
      const { data: existingData, error: checkError } = await supabase
        .from('workouts')
        .select('*')
        .eq('workout_date', workoutDate)
        .eq('user_id', session.user.id);

      if (checkError) {
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

    } catch (error) {
      console.error('Error submitting workout:', error);
      toast.error('Failed to save workout');
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
    setShowHydrationGuide(true);
    
    const startTime = Date.now();
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      let result;
      const baseData = {
        workout_date: data.workout_date,
        strength_volume: parseInt(data.strength_volume) || 0,
        cardio_load: parseInt(data.cardio_load) || 0,
        note: data.note || '',
        user_id: session.user.id,
      };

      if (mode === 'add') {
        const combinedData = {
          ...baseData,
          strength_volume: (existingWorkout.strength_volume || 0) + (baseData.strength_volume || 0),
          cardio_load: (existingWorkout.cardio_load || 0) + (baseData.cardio_load || 0),
          note: baseData.note ? `${existingWorkout.note || ''}\n${baseData.note}` : existingWorkout.note,
          updated_at: new Date().toISOString()
        };
        
        result = await supabase
          .from('workouts')
          .update(combinedData)
          .eq('id', existingWorkout.id)
          .select('*')
          .single();
      } else if (mode === 'replace') {
        result = await supabase
          .from('workouts')
          .update(baseData)
          .eq('id', existingWorkout.id)
          .select('*')
          .single();
      } else {
        result = await supabase
          .from('workouts')
          .insert([baseData])
          .select('*')
          .single();
      }

      if (result.error) throw result.error;

      // Wait for minimum loading time
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(2000 - elapsedTime, 0);
      await new Promise(resolve => setTimeout(resolve, remainingTime));

      await fetchHistory();
      
      // Reset form
      setWorkoutDate(new Date().toISOString().split('T')[0]);
      setStrengthVolume('');
      setCardioLoad('');
      setNote('');

    } catch (error) {
      console.error('Failed to save workout:', error);
      setSaveError(error);
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column */}
      <div className="lg:col-span-2 space-y-6">
        {/* Workout Form Card */}
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
          <LoadRatiosGraph 
            data={history.slice(0, 14).reverse()} 
            visibleLines={visibleLines} 
          />
        </div>

        {/* History Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Recent History</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {history.map((entry) => (
              <div key={entry.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm font-medium text-gray-800 dark:text-white">
                  {entry.workout_date} - Week {entry.training_cycle_week}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Goal: {entry.training_cycle_goal}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Strength: {entry.strength_volume} lbs
                  <span className="mx-2">•</span>
                  Cardio: {entry.cardio_load}
                </p>
                {entry.note && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
                    {entry.note}
                  </p>
                )}
              </div>
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
    </div>
  );
}
