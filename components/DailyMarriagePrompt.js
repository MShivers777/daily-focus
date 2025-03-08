'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function DailyMarriagePrompt() {
  const [prompt, setPrompt] = useState(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchTodaysPrompt = async () => {
      const { data: focusAreas } = await supabase
        .from('marriage_focus')
        .select('*')
        .single();

      if (focusAreas) {
        // Get active focus areas
        const activeAreas = Object.entries(focusAreas)
          .filter(([key, value]) => value === true && key !== 'user_id' && key !== 'id')
          .map(([key]) => key);

        // Get a random prompt for one of the active areas
        if (activeAreas.length > 0) {
          const randomArea = activeAreas[Math.floor(Math.random() * activeAreas.length)];
          setPrompt({
            area: randomArea.replace(/_/g, ' '),
            text: getPromptForArea(randomArea)
          });
        }
      }
    };

    fetchTodaysPrompt();
  }, []);

  if (!prompt) {
    return <div className="animate-pulse h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 capitalize">
        {prompt.area}
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        {prompt.text}
      </p>
    </div>
  );
}

function getPromptForArea(area) {
  const prompts = {
    effective_communication: "What's one thing you'd like to discuss with your partner today?",
    emotional_connection: "Share a moment that made you feel close to your partner recently.",
    financial_unity: "What financial goal would you like to work on together?",
    quality_time: "Plan a meaningful activity to do together this week.",
    physical_intimacy: "How can you show physical affection to your partner today?",
    shared_values: "Discuss a value that's important to both of you.",
    mutual_respect: "How can you show appreciation for your partner's uniqueness today?",
    shared_responsibilities: "What household task can you tackle together?",
    community_connection: "Plan a social activity with friends or family.",
    adaptability: "What change would you like to navigate together?",
    forgiveness: "Practice extending grace in a challenging situation.",
    spiritual_connection: "Share a spiritual insight or practice together."
  };
  
  return prompts[area] || "Connect with your partner in a meaningful way today.";
}
