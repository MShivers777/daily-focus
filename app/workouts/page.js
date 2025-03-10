'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BackIcon from '../../components/icons/BackIcon';
import WorkoutTracker from '../../components/WorkoutTracker';
import WorkoutPlanner from '../../components/WorkoutPlanner';

export default function WorkoutsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('tracker');

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
          Workout Focus
        </h1>

        {/* Tab Navigation */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setActiveTab('tracker')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'tracker'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Workout Tracker
          </button>
          <button
            onClick={() => setActiveTab('planner')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'planner'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Workout Planner
          </button>
        </div>

        {activeTab === 'tracker' ? (
          <WorkoutTracker />
        ) : (
          <WorkoutPlanner />
        )}
      </div>
    </div>
  );
}
