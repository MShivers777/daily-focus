'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const FOCUS_AREAS = [
  {
    id: 'effective_communication',
    title: 'Effective Communication',
    description: 'Open, honest, and clear exchange of thoughts and feelings'
  },
  {
    id: 'emotional_connection',
    title: 'Emotional Connection',
    description: 'Deep understanding and sharing of feelings and experiences'
  },
  {
    id: 'financial_unity',
    title: 'Financial Unity',
    description: 'Aligned financial goals and shared resource management'
  },
  {
    id: 'quality_time',
    title: 'Quality Time and Activities Together',
    description: 'Meaningful shared experiences and dedicated couple time'
  },
  {
    id: 'physical_intimacy',
    title: 'Physical Intimacy',
    description: 'Physical closeness, affection, and intimate connection'
  },
  {
    id: 'shared_values',
    title: 'Shared Values and Goals',
    description: 'Alignment on life direction and core beliefs'
  },
  {
    id: 'mutual_respect',
    title: 'Mutual Respect and Support',
    description: 'Honoring each other\'s individuality and offering encouragement'
  },
  {
    id: 'shared_responsibilities',
    title: 'Shared Responsibilities',
    description: 'Balanced partnership in managing home and life together'
  },
  {
    id: 'community_connection',
    title: 'Connection to Community',
    description: 'Shared social relationships and community involvement'
  },
  {
    id: 'adaptability',
    title: 'Adaptability and Flexibility',
    description: 'Growing and adapting together through life\'s changes'
  },
  {
    id: 'forgiveness',
    title: 'Forgiveness and Grace',
    description: 'Ability to work through conflicts and extend grace'
  },
  {
    id: 'spiritual_connection',
    title: 'Spiritual Connection',
    description: 'Shared faith practices and spiritual growth together'
  }
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
      toast.error('Please select exactly 3 priority areas', {
        duration: 3000,
      });
      return;
    }

    try {
      await toast.promise(
        fetch('/api/marriage-focus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            priorities: selectedPriorities,
          }),
        }),
        {
          loading: 'Saving your preferences...',
          success: 'Preferences saved successfully!',
          error: 'Failed to save preferences.',
        },
        {
          duration: 3000,
        }
      );
      router.push('/');
    } catch (error) {
      console.error('Error saving focus areas:', error);
      toast.error('Failed to save preferences. Please try again.');
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {FOCUS_AREAS.map((area) => (
            <button
              key={area.id}
              onClick={() => handleAreaClick(area.id)}
              className={`p-4 rounded-lg text-left transition-all ${
                selectedPriorities.includes(area.id)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <h3 className="font-semibold mb-1">{area.title}</h3>
              <p className={`text-sm ${
                selectedPriorities.includes(area.id)
                  ? 'text-blue-100'
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {area.description}
              </p>
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
