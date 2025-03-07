'use client';
import { useState } from 'react';
import { MARRIAGE_CATEGORIES } from '../constants/marriageCategories';

export default function MarriageOnboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [priorities, setPriorities] = useState([]);
  const [additional, setAdditional] = useState([]);

  const handlePrioritySelect = (categoryId) => {
    if (priorities.includes(categoryId)) {
      setPriorities(priorities.filter(id => id !== categoryId));
    } else if (priorities.length < 3) {
      setPriorities([...priorities, categoryId]);
    }
  };

  const handleAdditionalSelect = (categoryId) => {
    if (additional.includes(categoryId)) {
      setAdditional(additional.filter(id => id !== categoryId));
    } else {
      setAdditional([...additional, categoryId]);
    }
  };

  const handleComplete = async () => {
    // Save to Supabase here
    const selections = {
      priorities,
      additional,
      timestamp: new Date().toISOString()
    };
    
    // Call parent completion handler
    onComplete(selections);
  };

  if (step === 1) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Select Your Top 3 Priority Areas
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Choose three areas that you feel need the most focus in your marriage.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {MARRIAGE_CATEGORIES.map(category => (
            <button
              key={category.id}
              onClick={() => handlePrioritySelect(category.id)}
              className={`p-4 rounded-lg border transition-all ${
                priorities.includes(category.id)
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <h3 className="font-medium text-gray-900 dark:text-white">
                {category.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {category.description}
              </p>
            </button>
          ))}
        </div>
        <button
          onClick={() => setStep(2)}
          disabled={priorities.length !== 3}
          className="w-full p-3 bg-blue-500 text-white rounded-lg disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
        Select Additional Focus Areas
      </h2>
      <p className="text-gray-600 dark:text-gray-400">
        Choose any other areas you'd like to include in your marriage focus rotation.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {MARRIAGE_CATEGORIES
          .filter(category => !priorities.includes(category.id))
          .map(category => (
            <button
              key={category.id}
              onClick={() => handleAdditionalSelect(category.id)}
              className={`p-4 rounded-lg border transition-all ${
                additional.includes(category.id)
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <h3 className="font-medium text-gray-900 dark:text-white">
                {category.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {category.description}
              </p>
            </button>
          ))}
      </div>
      <button
        onClick={handleComplete}
        className="w-full p-3 bg-blue-500 text-white rounded-lg"
      >
        Complete Setup
      </button>
    </div>
  );
}
