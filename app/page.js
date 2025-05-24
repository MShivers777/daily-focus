'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import AuthComponent from '../components/Auth';
import ErrorMessage from '../components/ErrorMessage';
import { getRandomVerse } from '../utils/bibleVerses';

export default function Home() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marriagePrompt, setMarriagePrompt] = useState('');
  const [dailyQuote, setDailyQuote] = useState({ text: '', author: '' });
  const [errors, setErrors] = useState({});
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error fetching session:', error);
        setLoading(false);
        return;
      }
      setSession(session);
      setLoading(false);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  useEffect(() => {
    if (session) {
      fetchUserName();
      fetchMarriagePrompt(session);
      fetchDailyQuote();
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
      
      setUser(name);
    } catch (error) {
      console.error('Error fetching user name:', error);
    }
  };

  const fetchMarriagePrompt = async (currentSession) => {
    if (!currentSession) return;

    try {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const weekOfMonth = Math.floor((today.getDate() - 1) / 7);
      const weekNumberForTemplate = (weekOfMonth % 2) + 1;

      const { data: scheduleData, error: scheduleError } = await supabase
        .from('marriage_schedule_template')
        .select('topic_id, marriage_topics(identifier, name)')
        .eq('day_of_week', dayOfWeek)
        .eq('week_number', weekNumberForTemplate)
        .single();

      if (scheduleError || !scheduleData) {
        console.error('Home Page: Error fetching schedule or no schedule for today:', scheduleError);
        setMarriagePrompt('No marriage focus scheduled for today.');
        return;
      }

      const topicId = scheduleData.topic_id;

      const { data: progress } = await supabase
        .from('user_prompt_progress')
        .select('last_prompt_number')
        .eq('user_id', currentSession.user.id)
        .eq('topic_id', topicId)
        .single(); // Errors if no row, caught by outer try/catch

      let lastPromptNum = progress?.last_prompt_number || 0;
      let sequenceToFetch = lastPromptNum + 1;

      let { data: promptData, error: fetchError } = await supabase
        .from('marriage_prompts')
        .select('content, sequence_number') // Ensure sequence_number is selected
        .eq('topic_id', topicId)
        .eq('sequence_number', sequenceToFetch)
        .single();

      if (!promptData || (fetchError && fetchError.code === 'PGRST116')) {
        sequenceToFetch = 1; // Reset to fetch the first prompt
        const { data: firstPromptData, error: firstFetchError } = await supabase
          .from('marriage_prompts')
          .select('content, sequence_number') // Ensure sequence_number is selected
          .eq('topic_id', topicId)
          .eq('sequence_number', sequenceToFetch)
          .single();
        
        if (firstFetchError && firstFetchError.code !== 'PGRST116') {
          console.error('Home Page: Error fetching first prompt for topic:', topicId, firstFetchError);
        }
        promptData = firstPromptData;
      } else if (fetchError) {
        console.error('Home Page: Error fetching prompt:', topicId, sequenceToFetch, fetchError);
      }

      if (promptData) {
        await supabase
          .from('user_prompt_progress')
          .upsert({
            user_id: currentSession.user.id,
            topic_id: topicId,
            last_prompt_number: promptData.sequence_number // Update with the displayed prompt's number
          }, {
            onConflict: 'user_id,topic_id' // Specify conflict columns
          });
        setMarriagePrompt(`${scheduleData.marriage_topics.name}: ${promptData.content}`);
      } else {
        setMarriagePrompt(`${scheduleData.marriage_topics.name}: No prompts available for this topic.`);
      }
    } catch (error) {
      // Catch errors from .single() if no record, or other general errors
      if (error.code === 'PGRST116') {
         console.warn('Home Page: A fetch operation returned no data (PGRST116), prompt may be unavailable:', error.message);
      } else {
        console.error('Home Page: Error fetching marriage prompt:', error);
      }
      setMarriagePrompt('Unable to load today\'s marriage focus.');
      setErrors(prev => ({...prev, marriagePrompt: 'Could not load marriage prompt.'}));
    }
  };

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

  if (loading) {
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
            {errors.marriagePrompt ? (
              <ErrorMessage message={errors.marriagePrompt} />
            ) : (
              <div className="space-y-6">
                <p className="text-gray-700 dark:text-gray-300 italic bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
                  {marriagePrompt || 'Loading...'}
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
