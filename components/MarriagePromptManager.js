'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const MarriagePromptManager = ({ userId }) => {
  const supabase = createClientComponentClient();
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTodaysPrompt();
  }, []);

  const fetchTodaysPrompt = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsLoading(false);
        return;
      }

      const today = new Date();
      const dayOfWeek = today.getDay();
      const weekOfMonth = Math.floor((today.getDate() - 1) / 7);
      const weekNumberForTemplate = (weekOfMonth % 2) + 1;

      const { data: scheduleData, error: scheduleError } = await supabase
        .from('marriage_schedule_template')
        .select(`
          topic_id, 
          marriage_topics (
            identifier,
            name
          )
        `)
        .eq('day_of_week', dayOfWeek)
        .eq('week_number', weekNumberForTemplate)
        .single();

      if (scheduleError || !scheduleData) {
        console.error('Error fetching schedule or no schedule for today:', scheduleError);
        setCurrentPrompt(null);
        setIsLoading(false);
        return;
      }

      const topicId = scheduleData.topic_id;

      const { data: progress } = await supabase
        .from('user_prompt_progress')
        .select('last_prompt_number')
        .eq('user_id', session.user.id)
        .eq('topic_id', topicId)
        .single(); // This will error if no row, caught by outer try/catch if not PGRST116

      let lastPromptNum = progress?.last_prompt_number || 0;
      let sequenceToFetch = lastPromptNum + 1;

      let { data: promptData, error: fetchError } = await supabase
        .from('marriage_prompts')
        .select('content, sequence_number')
        .eq('topic_id', topicId)
        .eq('sequence_number', sequenceToFetch)
        .single();

      // If no prompt was found with sequenceToFetch (likely end of sequence)
      // or if there was an error that indicates no row was found (PGRST116 for .single())
      if (!promptData || (fetchError && fetchError.code === 'PGRST116')) {
        sequenceToFetch = 1; // Reset to fetch the first prompt
        const { data: firstPromptData, error: firstFetchError } = await supabase
          .from('marriage_prompts')
          .select('content, sequence_number')
          .eq('topic_id', topicId)
          .eq('sequence_number', sequenceToFetch)
          .single();
        
        if (firstFetchError && firstFetchError.code !== 'PGRST116') {
          console.error('Error fetching first prompt for topic:', topicId, firstFetchError);
        }
        promptData = firstPromptData; // Use the first prompt, or null if it also fails
      } else if (fetchError) {
        // Another error occurred fetching the initial next prompt
        console.error('Error fetching prompt:', topicId, sequenceToFetch, fetchError);
      }

      if (promptData) {
        await supabase
          .from('user_prompt_progress')
          .upsert({
            user_id: session.user.id,
            topic_id: topicId,
            last_prompt_number: promptData.sequence_number
          }, {
            onConflict: 'user_id,topic_id' // Specify conflict columns
          });

        setCurrentPrompt({
          topic: scheduleData.marriage_topics.name,
          content: promptData.content,
          promptNumber: promptData.sequence_number
        });
      } else {
        // No prompt found for this topic, even after trying to wrap
        setCurrentPrompt({
          topic: scheduleData.marriage_topics.name,
          content: "No prompts available for this topic at the moment.",
          promptNumber: 0
        });
      }

    } catch (error) {
      // Catch errors from .single() if no record, or other general errors
      if (error.code === 'PGRST116') {
        // This can happen if the initial progress fetch fails and scheduleData is also null.
        // Or if a specific prompt fetch fails for a reason other than sequence number.
        // The logic above tries to handle missing prompts gracefully.
        console.warn('A fetch operation returned no data (PGRST116), prompt may be unavailable:', error.message);
         setCurrentPrompt({
            topic: "Marriage Focus",
            content: "Could not load today's prompt. Please check back later.",
            promptNumber: 0
          });
      } else {
        console.error('Error in fetchTodaysPrompt:', error);
      }
       setCurrentPrompt({ // Fallback generic message
        topic: "Marriage Focus",
        content: "Error loading today's prompt.",
        promptNumber: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />;
  }

  if (!currentPrompt) {
    return (
      <div className="text-gray-600 dark:text-gray-400">
        No prompt available for today.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
        {currentPrompt.topic}  {/* Remove the replace() formatting since we're using the full name */}
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        {currentPrompt.content}
      </p>
    </div>
  );
}

export default MarriagePromptManager;
