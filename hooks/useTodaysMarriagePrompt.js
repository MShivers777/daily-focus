'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export function useTodaysMarriagePrompt() {
  const supabase = createClientComponentClient();
  const [promptData, setPromptData] = useState({
    topic: '',
    content: '',
    promptNumber: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPrompt = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw sessionError || new Error('User not authenticated.');
      }

      const today = new Date();
      const dayOfWeek = today.getDay();
      // Ensure weekOfMonth is 0-indexed for modulo, then add 1 for 1-based weekNumberForTemplate
      const weekOfMonth = Math.floor((today.getDate() - 1) / 7); 
      const weekNumberForTemplate = (weekOfMonth % 2) + 1;

      const { data: scheduleData, error: scheduleError } = await supabase
        .from('marriage_schedule_template')
        .select('topic_id, marriage_topics(identifier, name)')
        .eq('day_of_week', dayOfWeek)
        .eq('week_number', weekNumberForTemplate)
        .single();

      if (scheduleError || !scheduleData) {
        const errMsg = scheduleError?.message || 'No marriage focus scheduled for today.';
        console.warn('useTodaysMarriagePrompt: Error fetching schedule or no schedule for today:', errMsg);
        setError(errMsg);
        setPromptData(prev => ({ ...prev, topic: "Marriage Focus", content: errMsg }));
        setIsLoading(false);
        return;
      }

      const topicId = scheduleData.topic_id;
      const topicName = scheduleData.marriage_topics.name;

      const { data: progress, error: progressError } = await supabase
        .from('user_prompt_progress')
        .select('last_prompt_number')
        .eq('user_id', session.user.id)
        .eq('topic_id', topicId)
        .single();

      // PGRST116 means no row was found, which is fine for initial progress.
      if (progressError && progressError.code !== 'PGRST116') {
        throw progressError;
      }
      
      let lastPromptNum = progress?.last_prompt_number || 0;
      let sequenceToFetch = lastPromptNum + 1;

      let { data: currentPrompt, error: fetchError } = await supabase
        .from('marriage_prompts')
        .select('content, sequence_number')
        .eq('topic_id', topicId)
        .eq('sequence_number', sequenceToFetch)
        .single();

      if (!currentPrompt || (fetchError && fetchError.code === 'PGRST116')) {
        sequenceToFetch = 1; // Reset to fetch the first prompt
        const { data: firstPrompt, error: firstFetchError } = await supabase
          .from('marriage_prompts')
          .select('content, sequence_number')
          .eq('topic_id', topicId)
          .eq('sequence_number', sequenceToFetch)
          .single();
        
        if (firstFetchError && firstFetchError.code !== 'PGRST116') {
          console.error('useTodaysMarriagePrompt: Error fetching first prompt for topic:', topicId, firstFetchError);
        }
        currentPrompt = firstPrompt;
      } else if (fetchError) {
        console.error('useTodaysMarriagePrompt: Error fetching prompt:', topicId, sequenceToFetch, fetchError);
        throw fetchError;
      }

      if (currentPrompt) {
        const { error: upsertError } = await supabase
          .from('user_prompt_progress')
          .upsert({
            user_id: session.user.id,
            topic_id: topicId,
            last_prompt_number: currentPrompt.sequence_number
          }, {
            onConflict: 'user_id,topic_id'
          });

        if (upsertError) {
          console.error('useTodaysMarriagePrompt: Error upserting progress:', upsertError);
          // Decide if this should throw or just be logged
        }
        setPromptData({
          topic: topicName,
          content: currentPrompt.content,
          promptNumber: currentPrompt.sequence_number,
        });
      } else {
        setPromptData({
          topic: topicName,
          content: "No prompts available for this topic at the moment.",
          promptNumber: 0,
        });
      }
    } catch (err) {
      console.error('useTodaysMarriagePrompt: General error:', err);
      setError(err.message || 'Failed to load today\'s marriage prompt.');
      setPromptData(prev => ({ ...prev, topic: "Marriage Focus", content: err.message || "Error loading prompt."}));
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchPrompt();
  }, [fetchPrompt]);

  return { promptData, isLoading, error, refetch: fetchPrompt };
}
