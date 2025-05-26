'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import AuthComponent from '../components/Auth';
import ErrorMessage from '../components/ErrorMessage';
import { getRandomVerse } from '../utils/bibleVerses';
import { useTodaysMarriagePrompt } from '../hooks/useTodaysMarriagePrompt'; // Import the new hook

export default function Home() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true); // Renamed for clarity
  // const [marriagePrompt, setMarriagePrompt] = useState(''); // Handled by hook
  const [dailyQuote, setDailyQuote] = useState({ text: '', author: '' });
  const [errors, setErrors] = useState({}); // Keep for other potential errors
  const supabase = createClientComponentClient();
  const router = useRouter();

  // Use the new hook for marriage prompt
  const { 
    promptData: marriagePromptData, 
    isLoading: marriagePromptLoading, 
    error: marriagePromptError,
    // refetch: refetchMarriagePrompt // if manual refetch is needed
  } = useTodaysMarriagePrompt();

  useEffect(() => {
    const fetchSession = async () => {
      setLoadingSession(true); // Start loading
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error fetching session:', error);
        setErrors(prev => ({...prev, session: 'Failed to load session.'}));
        setLoadingSession(false);
        return;
      }
      setSession(session);
      setLoadingSession(false); // Finish loading
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      if (!currentSession) { // User signed out
        setUser(null);
        // Reset other states if necessary
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  useEffect(() => {
    if (session) {
      fetchUserName(); // fetchUserName can stay as is
      // fetchMarriagePrompt(session); // This is now handled by the hook
      fetchDailyQuote(); // fetchDailyQuote can stay as is
    } else {
      // Clear user-specific data if session is lost
      setUser(null);
      // setMarriagePrompt(''); // Handled by hook's state
      setDailyQuote({ text: '', author: '' });
    }
  }, [session]); // Removed supabase.auth from dependencies as it's stable

  const fetchUserName = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('custom_name')
        .eq('id', session.user.id)
        .single();

      const name = profile?.custom_name || 
                   session.user.user_metadata?.full_name || 
                   session.user.email?.split('@')[0] ||
                   'Friend';
      
      setUser(name);
    } catch (error) {
      console.error('Error fetching user name:', error);
    }
  };

  // Remove fetchMarriagePrompt function entirely, it's replaced by the hook.
  // const fetchMarriagePrompt = async (currentSession) => { ... }

  const fetchDailyQuote = async () => {
    try {
      const verse = getRandomVerse();
      setDailyQuote({
        text: verse.text,
        author: verse.reference
      });
    } catch (error) {
      console.error('Error getting Bible verse:', error);
      setDailyQuote({
        text: 'Love is patient, love is kind.',
        author: '1 Corinthians 13:4'
      });
    }
  };

  if (loadingSession) { // Check session loading state
    return <div>Loading...</div>;
  }

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
              <p className="text-gray-600 dark:text-gray-400 mb-1">
                Welcome, {user}
              </p>
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

          {/* Navigation */}
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => router.push('/workouts')}
              className="px-4 py-2 rounded-lg transition-all bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Workout Focus
            </button>
            <button
              onClick={() => router.push('/marriage')}
              className="px-4 py-2 rounded-lg transition-all bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Marriage Focus
            </button>
          </div>

          {/* Marriage Focus Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-blue-100 dark:border-blue-900/30">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Daily Marriage Focus</h2>
            {marriagePromptError ? (
              <ErrorMessage message={marriagePromptError} />
            ) : marriagePromptLoading ? (
              <p className="text-gray-700 dark:text-gray-300 italic">Loading marriage focus...</p>
            ) : (
              <div className="space-y-6">
                <p className="text-gray-700 dark:text-gray-300 italic bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
                  {marriagePromptData.topic ? `${marriagePromptData.topic}: ` : ''}{marriagePromptData.content || 'No prompt available.'}
                </p>
                
                <div className="border-t dark:border-gray-700 pt-4">
                  <blockquote className="italic text-gray-600 dark:text-gray-400">
                    "{dailyQuote.text}"
                    <footer className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-500">
                      — {dailyQuote.author}
                    </footer>
                  </blockquote>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
