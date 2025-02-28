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
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold">Daily Focus Tracker</h1>
          <p className="text-gray-600">{dateString}</p>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Sign Out
        </button>
      </div>
      
      {/* Marriage Focus Section */}
      <div className="mb-8 p-4 bg-pink-50 rounded-lg border border-pink-200">
        <h2 className="text-lg font-bold mb-2 text-pink-700">Daily Marriage Focus</h2>
        <p className="text-pink-900 italic">
          {marriagePrompt || 'Loading...'}
        </p>
      </div>

      {/* Workout Section */}
      <div className="mt-8">
        <h2 className="text-lg font-bold mb-4">Workout Metrics</h2>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-sm text-blue-700">7 Day Totals</h3>
            <p>Strength: {metrics.sevenDayStrength} lbs</p>
            <p>Cardio: {metrics.sevenDayCardio}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-sm text-green-700">31 Day Totals</h3>
            <p>Strength: {metrics.thirtyOneDayStrength} lbs</p>
            <p>Cardio: {metrics.thirtyOneDayCardio}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <h3 className="font-semibold text-sm text-purple-700">Load Ratios</h3>
            <p>Strength: {strengthRatio}</p>
            <p>Cardio: {cardioRatio}</p>
            <p>Combined: {combinedRatio}</p>
          </div>
        </div>
      </div>

      {/* Existing Workout Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input 
          type="date" 
          value={date} 
          onChange={(e) => setDate(e.target.value)} 
          className="p-2 border" 
        />
        <input 
          type="number" 
          placeholder="Strength Volume (lbs)" 
          value={strengthVolume} 
          onChange={(e) => setStrengthVolume(e.target.value)} 
          className="p-2 border" 
        />
        <input 
          type="number" 
          placeholder="Cardio Load" 
          value={cardioLoad} 
          onChange={(e) => setCardioLoad(e.target.value)} 
          className="p-2 border" 
        />
        <button type="submit" className="p-2 bg-blue-500 text-white">Submit</button>
      </form>

      {/* Existing History Section */}
      <div className="mt-6">
        <h2 className="text-lg font-bold">History</h2>
        <ul className="mt-2">
          {history.map((entry) => (
            <li key={entry.id} className="p-2 border-b">
              {entry.date}: {entry.strength_volume} lbs, Cardio: {entry.cardio_load}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
