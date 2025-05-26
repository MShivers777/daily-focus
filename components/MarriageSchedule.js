'use client';

import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const MarriageSchedule = ({ userId }) => {
  const supabase = createClientComponentClient();
  const [schedule, setSchedule] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null); // Added error state

  const fetchSchedule = useCallback(async () => {
    // Added useCallback and dependency array for useEffect
    try {
      setIsLoading(true);
      setError(null); // Reset error
      const startDate = new Date();
      const scheduleData = [];

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // If userId prop is not reliable or not always passed, this check is important.
        // Or, ensure userId is always valid if this component is rendered.
        // For now, assuming session.user.id is the source of truth if userId prop is problematic.
        // If userId prop is guaranteed, use it directly.
        // This component doesn't strictly need the user_id for fetching the schedule template
        // or prompts, but it does for progress.
        // Since we removed the upsert, user_id is only for progressMap.
        // If userId is not passed, we might not be able to show personalized progress accurately.
        // Let's assume userId is passed if progress is to be personalized.
        // If not, the progressMap might not be accurate.
        // For this refactor, we'll keep the logic that uses session if available for progress.
      }
      const currentUserId = userId || session?.user?.id;


      // First, fetch all available prompts for each topic
      const { data: allPrompts, error: promptsError } = await supabase
        .from('marriage_prompts')
        .select('topic_id, content, sequence_number')
        .order('sequence_number');

      if (promptsError) throw promptsError;

      // Group prompts by topic
      const promptsByTopic = allPrompts.reduce((acc, prompt) => {
        if (!acc[prompt.topic_id]) {
          acc[prompt.topic_id] = [];
        }
        acc[prompt.topic_id].push(prompt);
        return acc;
      }, {});

      let progressMap = new Map();
      if (currentUserId) { // Only fetch progress if we have a user ID
        const { data: progressData, error: progressError } = await supabase
          .from('user_prompt_progress')
          .select('topic_id, last_prompt_number')
          .eq('user_id', currentUserId); // Use currentUserId

        if (progressError) {
            console.warn('Error fetching user progress for schedule, schedule may not reflect exact progress:', progressError);
            // Continue without progress, or handle error more gracefully
        } else {
            progressMap = new Map(
                progressData?.map(p => [p.topic_id, p.last_prompt_number]) || []
            );
        }
      }


      // Fetch schedule template with topic info
      const { data: templateData, error: templateError } = await supabase
        .from('marriage_schedule_template')
        .select(`
          day_of_week,
          week_number,
          marriage_topics (
            id,
            name,
            identifier
          )
        `)
        .order('week_number, day_of_week');

      if (templateError) throw templateError;

      // Generate next 14 days
      for (let i = 0; i < 14; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        
        const dayOfWeek = date.getDay();
        // Ensure weekOfMonth is 0-indexed for modulo, then add 1 for 1-based weekNumberForTemplate
        const weekOfMonth = Math.floor((date.getDate() - 1) / 7); 
        const weekNumber = (weekOfMonth % 2) + 1;


        const scheduleItem = templateData.find(
          item => item.day_of_week === dayOfWeek && 
                 item.week_number === weekNumber
        );

        if (scheduleItem && scheduleItem.marriage_topics) { // Ensure marriage_topics is not null
          const topicId = scheduleItem.marriage_topics.id;
          const topicPrompts = promptsByTopic[topicId] || [];
          
          if (topicPrompts.length > 0) {
            let lastPromptNumber = progressMap.get(topicId) || 0;
            
            const nextPromptNumber = (lastPromptNumber % topicPrompts.length) + 1;

            const prompt = topicPrompts.find(p => p.sequence_number === nextPromptNumber);

            if (prompt) {
              progressMap.set(topicId, nextPromptNumber); // Update progress map for subsequent days in this loop

              // REMOVED: Upsert logic for i === 0
              // if (i === 0 && currentUserId) {
              //   await supabase
              //     .from('user_prompt_progress')
              //     .upsert({
              //       user_id: currentUserId,
              //       topic_id: topicId,
              //       last_prompt_number: nextPromptNumber
              //     }, {
              //       onConflict: 'user_id,topic_id'
              //     });
              // }

              scheduleData.push({
                date: date.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                }),
                day: date.toLocaleDateString('en-US', { weekday: 'long' }),
                topic: scheduleItem.marriage_topics.name,
                prompt: prompt.content
              });
            } else {
              // Handle case where prompt for nextPromptNumber isn't found (data inconsistency?)
               scheduleData.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                day: date.toLocaleDateString('en-US', { weekday: 'long' }),
                topic: scheduleItem.marriage_topics.name,
                prompt: "Prompt not available."
              });
            }
          } else {
            // Handle case where topic has no prompts
            scheduleData.push({
              date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              day: date.toLocaleDateString('en-US', { weekday: 'long' }),
              topic: scheduleItem.marriage_topics.name,
              prompt: "No prompts for this topic."
            });
          }
        } else if (scheduleItem) {
            // Handle case where scheduleItem exists but marriage_topics is null (data issue)
             scheduleData.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                day: date.toLocaleDateString('en-US', { weekday: 'long' }),
                topic: "Topic data missing",
                prompt: "Details unavailable."
            });
        }
        // If no scheduleItem for the day, it's an "off" day, so nothing is pushed.
      }

      setSchedule(scheduleData);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setError(error.message || 'Failed to load schedule.'); // Set error state
    } finally {
      setIsLoading(false);
    }
  }, [supabase, userId]); // Added supabase and userId to dependency array

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]); // useEffect now depends on the memoized fetchSchedule

  if (isLoading) {
    return <div className="animate-pulse h-40 bg-gray-200 dark:bg-gray-700 rounded-lg" />;
  }

  if (error) { // Display error message
    return <div className="text-red-500 p-4">Error: {error}</div>;
  }

  if (schedule.length === 0) { // Handle empty schedule case
    return <div className="text-gray-500 p-4">No schedule items to display for the next two weeks.</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        Two-Week Schedule
      </h2>
      <div className="grid gap-2">
        {schedule.map((item, index) => (
          <div 
            key={index}
            className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg gap-4"
          >
            <div className="w-24 text-sm font-medium text-gray-500 dark:text-gray-400">
              {item.date}
            </div>
            <div className="w-32 text-sm font-medium text-gray-600 dark:text-gray-300">
              {item.day}
            </div>
            <div className="w-48 font-medium text-gray-700 dark:text-gray-200">
              {item.topic}
            </div>
            <div className="flex-1 text-sm text-gray-600 dark:text-gray-400">
              {item.prompt}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MarriageSchedule;
