'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '../api/supabase';
import AuthComponent from '../components/Auth';
import LoadRatiosGraph from '../components/LoadRatiosGraph';
import LoadRatioDisplay from '../components/LoadRatioDisplay';
import LoadRatiosHeader from '../components/LoadRatiosHeader';
import HydrationGuide from '../components/HydrationGuide';
import ErrorMessage from '../components/ErrorMessage';
import WorkoutConfirmation from '../components/WorkoutConfirmation';
import WorkoutPlanner from '../components/WorkoutPlanner';

export default function Home() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().split('T')[0]);  // default to today
  const [strengthVolume, setStrengthVolume] = useState('');
  const [cardioLoad, setCardioLoad] = useState('');
  const [note, setNote] = useState('');
  const [history, setHistory] = useState([]);
  const [marriagePrompt, setMarriagePrompt] = useState('');
  const [workoutFocus, setWorkoutFocus] = useState('');
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
  const [errors, setErrors] = useState({
    history: null,
    marriagePrompt: null,
    session: null,
    general: null
  });
  const [showWorkoutConfirm, setShowWorkoutConfirm] = useState(false);
  const [existingWorkout, setExistingWorkout] = useState(null);
  const [pendingWorkout, setPendingWorkout] = useState(null);
  const [activeTab, setActiveTab] = useState('tracker'); // Add this state

  const handleSignInWithGoogle = async (response) => {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: response.credential,
    });

    if (error) {
      console.error('Sign in error:', error);
    } else {
      console.log('Signed in user:', data);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (mounted) {
          setSession(session);
        }
      } catch (error) {
        console.error('Session error:', error);
        setErrors(prev => ({ ...prev, session: 'Failed to load session. Please sign out and try again.' }));
      }
    }

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Only fetch data if we have a session
  useEffect(() => {
    if (session) {
      fetchHistory();
      fetchDailyMarriagePrompt();
    }
  }, [session]);

  const fetchHistory = async () => {
    try {
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
      setErrors(prev => ({ ...prev, history: null }));
    } catch (error) {
      console.error('History fetch error:', error);
      setErrors(prev => ({ ...prev, history: 'Failed to load workout history' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
  };

  const saveWorkout = async (data, mode = 'new') => {
    setIsSaving(true);
    setSaveError(null);
    setShowHydrationGuide(true);
    
    const startTime = Date.now();
    
    try {
      let result;

      // Ensure we have the required fields
      const baseData = {
        workout_date: data.workout_date,
        strength_volume: parseInt(data.strength_volume) || 0,
        cardio_load: parseInt(data.cardio_load) || 0,
        note: data.note || '',
        user_id: session.user.id,
      };

      if (mode === 'add') {
        // Add to existing totals
        const combinedData = {
          ...baseData,
          strength_volume: (existingWorkout.strength_volume || 0) + (baseData.strength_volume || 0),
          cardio_load: (existingWorkout.cardio_load || 0) + (baseData.cardio_load || 0),
          note: baseData.note ? `${existingWorkout.note || ''}\n${baseData.note}` : existingWorkout.note,
          updated_at: new Date().toISOString()
        };
        
        console.log('Adding to existing workout:', { combinedData, existingId: existingWorkout.id });
        
        result = await supabase
          .from('workouts')
          .update(combinedData)
          .eq('id', existingWorkout.id)
          .select('*')
          .single();

      } else if (mode === 'replace') {
        console.log('Replacing workout:', { baseData, existingId: existingWorkout.id });
        
        result = await supabase
          .from('workouts')
          .update(baseData)
          .eq('id', existingWorkout.id)
          .select('*')
          .single();

      } else {
        console.log('Creating new workout:', baseData);
        
        result = await supabase
          .from('workouts')
          .insert([baseData])
          .select('*')
          .single();
      }

      if (result.error) {
        console.error('Database operation failed:', {
          mode,
          error: result.error,
          data: baseData,
          result
        });
        throw new Error(`Failed to ${mode} workout: ${result.error.message}`);
      }

      console.log('Operation successful:', {
        mode,
        result: result.data
      });

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
      console.error('Failed to save workout:', {
        error,
        mode,
        workoutDate,
        strength: strengthVolume,
        cardio: cardioLoad
      });
      setSaveError(error);
    } finally {
      setIsSaving(false);
      setShowWorkoutConfirm(false);
      setExistingWorkout(null);
      setPendingWorkout(null);
    }
  };

  const fetchDailyMarriagePrompt = async () => {
    console.log('Debugging marriage prompts table...');
    
    try {
      // Test connection and table access
      const { data: debugData, error: debugError } = await supabase
        .from('marriage_prompts')
        .select('*');

      console.log('Query response:', {
        hasError: !!debugError,
        errorDetails: debugError,
        dataLength: debugData?.length,
        rawData: debugData
      });
      
      if (debugError) {
        throw debugError;
      }

      // If we have data, get today's or most recent prompt
      if (debugData && debugData.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        console.log('Looking for date:', today);

        // Find today's prompt or the most recent one
        const todayPrompt = debugData.find(d => d.date === today);
        const sortedPrompts = debugData.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const selectedPrompt = todayPrompt || sortedPrompts[0];
        
        if (selectedPrompt) {
          console.log('Selected prompt:', selectedPrompt);
          setMarriagePrompt(selectedPrompt.prompt);
        } else {
          setMarriagePrompt('No prompt available');
        }
      } else {
        console.log('No prompts found in database');
        setMarriagePrompt('No prompts available');
      }
    } catch (error) {
      console.error('Error details:', {
        message: error.message,
        hint: error.hint,
        details: error.details,
        code: error.code
      });
      setMarriagePrompt('Unable to load prompt');
    }
  };

  const toggleLine = (line) => {
    setVisibleLines(prev => ({
      ...prev,
      [line]: !prev[line]
    }));
  };

  // Add input validation function
  const handleNumberInput = (e, setter) => {
    const value = e.target.value;
    // Only allow digits, no 'e' or 'E'
    if (/^\d*$/.test(value)) {
      setter(value);
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

  if (!session) {
    return <AuthComponent />;
  }

  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {errors.session && (
          <div className="max-w-6xl mx-auto p-6">
            <ErrorMessage message={errors.session} />
          </div>
        )}
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Daily Focus Tracker</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{dateString}</p>
            </div>
            <button
              onClick={() => supabase.auth.signOut()}
              className="px-4 py-2 bg-red-500 text-white rounded-lg transition-all hover:bg-red-600 active:scale-95"
            >
              Sign Out
            </button>
          </div>

          {/* Update Tab Navigation */}
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setActiveTab('tracker')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'tracker'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Workout Tracker
            </button>
            <button
              onClick={() => setActiveTab('planner')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'planner'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Workout Planner
            </button>
            <button
              onClick={() => router.push('/marriage')}
              className="px-4 py-2 rounded-lg transition-all bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Marriage Focus
            </button>
          </div>

          {activeTab === 'tracker' ? (
            // Existing tracker content
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Marriage Focus Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-blue-100 dark:border-blue-900/30">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Daily Marriage Focus</h2>
                  {errors.marriagePrompt ? (
                    <ErrorMessage message={errors.marriagePrompt} />
                  ) : (
                    <p className="text-gray-700 dark:text-gray-300 italic bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
                      {marriagePrompt || 'Loading...'}
                    </p>
                  )}
                </div>

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
                {errors.history && <ErrorMessage message={errors.history} />}
                {/* Only keep the Load Ratios card */}
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
            </div>
          ) : (
            <WorkoutPlanner history={history} />
          )}
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
    </>
  );
}
