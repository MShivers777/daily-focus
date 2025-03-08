'use client';

import { useRouter } from 'next/navigation';
import BackIcon from '../../components/icons/BackIcon';

export default function MarriagePromptsPage() {
  const router = useRouter();

  return (
    <div className="relative">
      <button
        onClick={() => router.push('/')}
        className="absolute top-0 left-0 p-2 rounded-lg transition-all bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
        aria-label="Back to dashboard"
      >
        <BackIcon />
      </button>
      
      <div className="max-w-4xl mx-auto pt-16">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          Marriage Prompts
        </h1>
        
        <div className="grid gap-6">
          {Object.entries(getPromptCategories()).map(([category, prompts]) => (
            <div key={category} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 capitalize">
                {category.replace(/_/g, ' ')}
              </h2>
              <div className="space-y-4">
                {prompts.map((prompt, index) => (
                  <p key={index} className="text-gray-600 dark:text-gray-400">
                    {prompt}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getPromptCategories() {
  return {
    effective_communication: [
      "What's one thing you'd like to discuss with your partner today?",
      "Share something that's been on your mind lately.",
      "Practice active listening for 10 minutes today."
    ],
    emotional_connection: [
      "Share a moment that made you feel close to your partner recently.",
      "Express gratitude for something specific about your partner.",
      "Share a fear or concern you've been holding onto."
    ],
    // Add more categories and prompts...
  };
}
