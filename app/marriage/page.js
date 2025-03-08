'use client';

import { useRouter } from 'next/navigation';
import BackIcon from '../../components/icons/BackIcon';
import DailyMarriagePrompt from '../../components/DailyMarriagePrompt';
import MarriageSchedule from '../../components/MarriageSchedule';

export default function MarriagePage() {
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
          Marriage Focus
        </h1>
        
        <div className="space-y-6">
          {/* Today's Focus Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Today's Focus
            </h2>
            <DailyMarriagePrompt />
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
