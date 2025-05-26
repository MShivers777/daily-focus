'use client';

import React from 'react'; // Removed useState, useEffect as they are in the hook
// import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'; // No longer needed here
import { useTodaysMarriagePrompt } from '../hooks/useTodaysMarriagePrompt'; // Import the hook

const MarriagePromptManager = () => { // Removed userId prop
  // const supabase = createClientComponentClient(); // Handled by hook
  // const [currentPrompt, setCurrentPrompt] = useState(null); // Handled by hook
  // const [isLoading, setIsLoading] = useState(true); // Handled by hook

  const { 
    promptData: currentPrompt, 
    isLoading, 
    error 
  } = useTodaysMarriagePrompt();

  // useEffect(() => { // Logic moved to hook
  //   fetchTodaysPrompt();
  // }, []);

  // const fetchTodaysPrompt = async () => { ... }; // This entire function is replaced by the hook

  if (isLoading) {
    return <div className="animate-pulse h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />;
  }

  if (error) {
    return (
      <div className="text-red-500 dark:text-red-400 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        Error loading prompt: {error}
      </div>
    );
  }

  if (!currentPrompt || !currentPrompt.content || currentPrompt.content.includes("No prompts available") || currentPrompt.content.includes("No marriage focus scheduled")) {
    return (
      <div className="text-gray-600 dark:text-gray-400 p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
        {currentPrompt?.content || "No prompt available for today."}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
        {currentPrompt.topic}
      </h3>
      <p className="text-gray-700 dark:text-gray-300">
        {currentPrompt.content}
      </p>
    </div>
  );
}

export default MarriagePromptManager;
