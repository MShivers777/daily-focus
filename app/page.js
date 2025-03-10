'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '../api/supabase';
import AuthComponent from '../components/Auth';
import ErrorMessage from '../components/ErrorMessage';

export default function Home() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [userName, setUserName] = useState('');
  const [marriagePrompt, setMarriagePrompt] = useState('');
  const [errors, setErrors] = useState({
    marriagePrompt: null,
    session: null
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
      fetchUserName();
      fetchDailyMarriagePrompt();
    }
  }, [session]);

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
      
      setUserName(name);
    } catch (error) {
      console.error('Error fetching user name:', error);
    }
  };

  const fetchDailyMarriagePrompt = async () => {
    try {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const weekNumber = Math.floor((today.getDate() - 1) / 7) % 2 + 1;

      // Get scheduled topic
      const { data: scheduleData } = await supabase
        .from('marriage_schedule_template')
        .select('topic_id, marriage_topics(identifier, name)')
        .eq('day_of_week', dayOfWeek)
        .eq('week_number', weekNumber)
        .single();

      if (!scheduleData) return;

      // Get or create user progress
      const { data: progress } = await supabase
        .from('user_prompt_progress')
        .select('last_prompt_number')
        .eq('user_id', session.user.id)
        .eq('topic_id', scheduleData.topic_id)
        .single();

      const currentPromptNumber = (progress?.last_prompt_number || 0) + 1;

      // Get prompt
      const { data: promptData } = await supabase
        .from('marriage_prompts')
        .select('content')
        .eq('topic_id', scheduleData.topic_id)
        .eq('sequence_number', currentPromptNumber)
        .single();

      if (promptData) {
        setMarriagePrompt(`${scheduleData.marriage_topics.name}: ${promptData.content}`);
      } else {
        setMarriagePrompt('No prompt available for today');
      }
    } catch (error) {
      console.error('Error fetching marriage prompt:', error);
      setMarriagePrompt('Unable to load today\'s marriage focus');
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
                Welcome, {userName}
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
            {errors.marriagePrompt ? (
              <ErrorMessage message={errors.marriagePrompt} />
            ) : (
              <p className="text-gray-700 dark:text-gray-300 italic bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
                {marriagePrompt || 'Loading...'}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
