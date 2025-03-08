'use client';

import { useState, useEffect } from 'react';
import supabase from '../api/supabase';

export default function MarriageSchedule() {
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

      // Get user's progress for each topic
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: progressData } = await supabase
        .from('user_prompt_progress')
        .select('topic_id, last_prompt_number')
        .eq('user_id', session.user.id);

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
          const topicProgress = progressData?.find(
            p => p.topic_id === scheduleItem.marriage_topics.id
          );

          const nextPromptNumber = (topicProgress?.last_prompt_number || 0) + 1;

          // Fetch next prompt for this topic
          const { data: promptData } = await supabase
            .from('marriage_prompts')
            .select('content, sequence_number')
            .eq('topic_id', scheduleItem.marriage_topics.id)
            .eq('sequence_number', nextPromptNumber)
            .single();

          scheduleData.push({
            date: date.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            }),
            day: date.toLocaleDateString('en-US', { weekday: 'long' }),
            topic: scheduleItem.marriage_topics.name,
            prompt: promptData?.content || 'No prompt available'
          });
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
