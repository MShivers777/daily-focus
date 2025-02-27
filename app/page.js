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

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Only fetch data if we have a session
  useEffect(() => {
    if (session) {
      fetchHistory();
      fetchDailyMarriagePrompt();
    }
  }, [session]);

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setHistory(data);
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

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Daily Focus Tracker</h1>
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
