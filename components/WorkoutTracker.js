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

  useEffect(() => {
    fetchHistory();
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
      const preview = previewWorkoutLoads(history, previewWorkout);
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
        user_id: session.user.id
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

        {/* Add preview section */}
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
