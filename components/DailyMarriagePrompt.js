'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function DailyMarriagePrompt() {
  const [prompt, setPrompt] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchTodaysPrompt = async () => {
      try {
        setIsLoading(true);
        
        // Wait for session to be available
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          return;
        }

        if (!session) {
          // Wait a bit and try again
          setTimeout(fetchTodaysPrompt, 1000);
          return;
        }

        // Get user's focus areas
        const { data: focusAreas, error: focusError } = await supabase
          .from('marriage_focus')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (focusError) {
          console.error('Error fetching focus areas:', focusError);
          return;
        }

        if (focusAreas) {
          const activeAreas = Object.entries(focusAreas)
            .filter(([key, value]) => 
              value === true && 
              !['user_id', 'id', 'created_at', 'updated_at'].includes(key)
            )
            .map(([key]) => key);

          if (activeAreas.length > 0) {
            const randomArea = activeAreas[Math.floor(Math.random() * activeAreas.length)];
            setPrompt({
              area: randomArea.replace(/_/g, ' '),
              text: getPromptForArea(randomArea)
            });
          }
        }
      } catch (error) {
        console.error('Error in fetchTodaysPrompt:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodaysPrompt();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchTodaysPrompt();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return <div className="animate-pulse h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />;
  }

  if (!prompt) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
        <p className="text-yellow-800 dark:text-yellow-200">
          No focus areas selected. Please visit settings to configure your marriage focus areas.
        </p>
      </div>
    );
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
