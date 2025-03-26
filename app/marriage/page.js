'use client';

import { useRouter } from 'next/navigation';
import BackIcon from '../../components/icons/BackIcon';
import MarriagePromptManager from '../../components/MarriagePromptManager';
import MarriageSchedule from '../../components/MarriageSchedule';
import LinkedAccount from '../../components/LinkedAccount';

export default function MarriagePage() {
  const router = useRouter();

  const handleReconfigure = () => {
    console.log('Attempting to navigate to marriage onboarding...');
    console.log('Current route:', window.location.pathname);
    console.log('Target route:', '/focus/marriage/onboarding');
    
    // Try navigation and catch any errors
    try {
      router.push('/focus/marriage/onboarding');
    } catch (error) {
      console.error('Navigation error:', error);
      
      // Log available routes in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Available pages directory structure:', router);
      }
    }
  };

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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Marriage Focus
          </h1>
          <button
            onClick={handleReconfigure}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all"
          >
            Reconfigure
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Today's Focus Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Today's Focus
            </h2>
            <MarriagePromptManager />
          </div>

          {/* Linked Account Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Linked Account
            </h2>
            <LinkedAccount />
          </div>

          {/* Schedule Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <MarriageSchedule />
          </div>
        </div>
      </div>
    </div>
  );
}
