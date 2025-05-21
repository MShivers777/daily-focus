'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const MarriageSchedule = ({ userId }) => {
  const supabase = createClientComponentClient();
  const [schedule, setSchedule] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      setIsLoading(true);
      const startDate = new Date();
      const scheduleData = [];

      // Get user's session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // First, fetch all available prompts for each topic
      const { data: allPrompts } = await supabase
        .from('marriage_prompts')
        .select('topic_id, content, sequence_number')
        .order('sequence_number');

      // Group prompts by topic
      const promptsByTopic = allPrompts.reduce((acc, prompt) => {
        if (!acc[prompt.topic_id]) {
          acc[prompt.topic_id] = [];
        }
        acc[prompt.topic_id].push(prompt);
        return acc;
      }, {});

      // Get user's progress for each topic
      const { data: progressData } = await supabase
        .from('user_prompt_progress')
        .select('topic_id, last_prompt_number');

      const progressMap = new Map(
        progressData?.map(p => [p.topic_id, p.last_prompt_number]) || []
      );

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
        const weekNumber = Math.floor((date.getDate() - 1) / 7) % 2 + 1;

        const scheduleItem = templateData.find(
          item => item.day_of_week === dayOfWeek && 
                 item.week_number === weekNumber
        );

        if (scheduleItem) {
          const topicId = scheduleItem.marriage_topics.id;
          const topicPrompts = promptsByTopic[topicId] || [];
          
          if (topicPrompts.length > 0) {
            // Get current progress for this topic
            let lastPromptNumber = progressMap.get(topicId) || 0;
            
            // Calculate next prompt number (with wrapping)
            const nextPromptNumber = lastPromptNumber >= topicPrompts.length ? 
              1 : lastPromptNumber + 1;

            // Find the prompt
            const prompt = topicPrompts.find(p => p.sequence_number === nextPromptNumber);

            if (prompt) {
              // Update progress map for future days
              progressMap.set(topicId, nextPromptNumber);

              // If this is today, update the progress in the database
              if (i === 0) {
                await supabase
                  .from('user_prompt_progress')
                  .upsert({
                    user_id: session.user.id,
                    topic_id: topicId,
                    last_prompt_number: nextPromptNumber
                  });
              }

              scheduleData.push({
                date: date.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                }),
                day: date.toLocaleDateString('en-US', { weekday: 'long' }),
                topic: scheduleItem.marriage_topics.name,
                prompt: prompt.content
              });
            }
          }
        }
      }

      setSchedule(scheduleData);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse h-40 bg-gray-200 dark:bg-gray-700 rounded-lg" />;
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
