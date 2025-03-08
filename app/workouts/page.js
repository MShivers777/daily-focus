'use client';

import { useRouter } from 'next/navigation';
import BackIcon from '../../components/icons/BackIcon';

export default function WorkoutsPage() {
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
          Workout Focus
        </h1>
      </div>
    </div>
  );
}
