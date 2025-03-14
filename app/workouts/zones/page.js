'use client';

import { useRouter } from 'next/navigation';
import BackIcon from '../../../components/icons/BackIcon';
import CardioZones from '../../../components/CardioZones';

export default function ZonesPage() {
  const router = useRouter();

  return (
    <div className="relative">
      <button
        onClick={() => router.push('/workouts')}
        className="absolute top-0 left-0 p-2 rounded-lg transition-all bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
        aria-label="Back to workouts"
      >
        <BackIcon />
      </button>
      
      <div className="max-w-4xl mx-auto pt-16">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          Training Zones
        </h1>
        <CardioZones />
      </div>
    </div>
  );
}
