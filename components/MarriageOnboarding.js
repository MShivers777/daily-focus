'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const FOCUS_AREAS = [
  'Communication',
  'Quality Time',
  'Physical Intimacy',
  'Emotional Support',
  'Shared Goals',
  'Financial Harmony',
  'Spiritual Connection',
  'Personal Growth',
  'Family Planning',
  'Conflict Resolution'
];

export default function MarriageOnboarding() {
  const [selectedPriorities, setSelectedPriorities] = useState([]);
  const router = useRouter();

  const handleAreaClick = (area) => {
    setSelectedPriorities(prev => {
      if (prev.includes(area)) {
        return prev.filter(a => a !== area);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, area];
    });
  };

  const handleSubmit = async () => {
    if (selectedPriorities.length !== 3) {
      alert('Please select exactly 3 priority areas');
      return;
    }

    try {
      await fetch('/api/marriage-focus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priorities: selectedPriorities,
        }),
      });
      router.push('/');
    } catch (error) {
      console.error('Error saving focus areas:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          Select Your Top 3 Marriage Focus Areas
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Choose the three areas that you want to prioritize in your marriage.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {FOCUS_AREAS.map((area) => (
            <button
              key={area}
              onClick={() => handleAreaClick(area)}
              className={`p-4 rounded-lg text-left transition-all ${
                selectedPriorities.includes(area)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {area}
            </button>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={selectedPriorities.length !== 3}
            className={`px-6 py-2 rounded-lg transition-all ${
              selectedPriorities.length === 3
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
