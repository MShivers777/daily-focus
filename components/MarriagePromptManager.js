'use client';

import { useState, useEffect } from 'react';
import supabase from '../api/supabase';

export default function MarriagePromptManager() {
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTodaysPrompt();
  }, []);

  const fetchTodaysPrompt = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get today's schedule
      const today = new Date();
      const dayOfWeek = today.getDay();
      const weekNumber = Math.floor(today.getDate() / 7) % 2 + 1;

      // Get scheduled topic - update select to include name
      const { data: scheduleData } = await supabase
        .from('marriage_schedule_template')
        .select(`
          topic_id, 
          marriage_topics (
            identifier,
            name
          )
        `)
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
        .select('content, sequence_number')
        .eq('topic_id', scheduleData.topic_id)
        .eq('sequence_number', currentPromptNumber)
        .single();

      if (promptData) {
        // Update user progress
        await supabase
          .from('user_prompt_progress')
          .upsert({
            user_id: session.user.id,
            topic_id: scheduleData.topic_id,
            last_prompt_number: promptData.sequence_number
          });

        // Update to use the full name from marriage_topics
        setCurrentPrompt({
          topic: scheduleData.marriage_topics.name, // Use name instead of identifier
          content: promptData.content,
          promptNumber: promptData.sequence_number
        });
      }

    } catch (error) {
      console.error('Error fetching prompt:', error);
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
