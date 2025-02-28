'use client';
import { useState, useEffect } from 'react';
import supabase from '../api/supabase';
import AuthComponent from '../components/Auth';

export default function Home() {
  const [session, setSession] = useState(null);
  const [date, setDate] = useState('');
  const [strengthVolume, setStrengthVolume] = useState('');
  const [cardioLoad, setCardioLoad] = useState('');
  const [history, setHistory] = useState([]);
  const [marriagePrompt, setMarriagePrompt] = useState('');
  const [metrics, setMetrics] = useState({
    sevenDayStrength: 0,
    sevenDayCardio: 0,
    thirtyOneDayStrength: 0,
    thirtyOneDayCardio: 0,
  });

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
        if (mounted) {
          setSession(session);
        }
        if (error) throw error;
      } catch (error) {
        console.error('Error getting session:', error);
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

  const calculateMetrics = (historyData) => {
    const today = new Date();
    const sevenDaysAgo = new Date(today.setDate(today.getDate() - 7));
    const thirtyOneDaysAgo = new Date(today.setDate(today.getDate() - 31));

    const sevenDayData = historyData.filter(entry => new Date(entry.date) >= sevenDaysAgo);
    const thirtyOneDayData = historyData.filter(entry => new Date(entry.date) >= thirtyOneDaysAgo);

    const sevenDayStrength = sevenDayData.reduce((sum, entry) => sum + entry.strength_volume, 0);
    const sevenDayCardio = sevenDayData.reduce((sum, entry) => sum + entry.cardio_load, 0);
    const thirtyOneDayStrength = thirtyOneDayData.reduce((sum, entry) => sum + entry.strength_volume, 0);
    const thirtyOneDayCardio = thirtyOneDayData.reduce((sum, entry) => sum + entry.cardio_load, 0);

    setMetrics({
      sevenDayStrength,
      sevenDayCardio,
      thirtyOneDayStrength,
      thirtyOneDayCardio,
    });
  };

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setHistory(data);
      calculateMetrics(data);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!date) {
      alert('Please select a date');
      return;
    }

    // Format the data before submission
    const formattedData = {
      date,
      strength_volume: parseInt(strengthVolume) || 0,
      cardio_load: parseInt(cardioLoad) || 0,
      created_at: new Date().toISOString()
    };

    console.log('Submitting data:', formattedData);

    const { data, error } = await supabase
      .from('workouts')
      .insert([formattedData])
      .select();

    if (error) {
      console.error('Submission error:', error.message);
      console.error('Error details:', error);
      alert(`Failed to submit: ${error.message}`);
    } else {
      console.log('Submission successful:', data);
      setDate('');
      setStrengthVolume('');
      setCardioLoad('');
      fetchHistory();
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

  const strengthRatio = metrics.thirtyOneDayStrength ? 
    (metrics.sevenDayStrength / metrics.thirtyOneDayStrength * 31).toFixed(2) : 0;
  const cardioRatio = metrics.thirtyOneDayCardio ? 
    (metrics.sevenDayCardio / metrics.thirtyOneDayCardio * 31).toFixed(2) : 0;
  const combinedRatio = ((Number(strengthRatio) + Number(cardioRatio)) / 2).toFixed(2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Marriage Focus Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-blue-100 dark:border-blue-900/30">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Daily Marriage Focus</h2>
              <p className="text-gray-700 dark:text-gray-300 italic bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
                {marriagePrompt || 'Loading...'}
              </p>
            </div>

            {/* Workout Form Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Add Workout</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                />
                <input 
                  type="number" 
                  placeholder="Strength Volume (lbs)" 
                  value={strengthVolume} 
                  onChange={(e) => setStrengthVolume(e.target.value)} 
                  className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                />
                <input 
                  type="number" 
                  placeholder="Cardio Load" 
                  value={cardioLoad} 
                  onChange={(e) => setCardioLoad(e.target.value)} 
                  className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
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
            {/* Metrics Cards */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">7 Day Overview</h2>
              <div className="space-y-2">
                <p className="text-gray-600 dark:text-gray-400">Strength: <span className="font-semibold text-gray-800 dark:text-white">{metrics.sevenDayStrength} lbs</span></p>
                <p className="text-gray-600 dark:text-gray-400">Cardio: <span className="font-semibold text-gray-800 dark:text-white">{metrics.sevenDayCardio}</span></p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">31 Day Overview</h2>
              <div className="space-y-2">
                <p className="text-gray-600 dark:text-gray-400">Strength: <span className="font-semibold text-gray-800 dark:text-white">{metrics.thirtyOneDayStrength} lbs</span></p>
                <p className="text-gray-600 dark:text-gray-400">Cardio: <span className="font-semibold text-gray-800 dark:text-white">{metrics.thirtyOneDayCardio}</span></p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Load Ratios</h2>
              <div className="space-y-2">
                <p className="text-gray-600 dark:text-gray-400">Strength: <span className="font-semibold text-gray-800 dark:text-white">{strengthRatio}</span></p>
                <p className="text-gray-600 dark:text-gray-400">Cardio: <span className="font-semibold text-gray-800 dark:text-white">{cardioRatio}</span></p>
                <p className="text-gray-600 dark:text-gray-400">Combined: <span className="font-semibold text-gray-800 dark:text-white">{combinedRatio}</span></p>
              </div>
            </div>

            {/* History Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Recent History</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {history.map((entry) => (
                  <div key={entry.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm font-medium text-gray-800 dark:text-white">{entry.date}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Strength: {entry.strength_volume} lbs
                      <span className="mx-2">•</span>
                      Cardio: {entry.cardio_load}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
