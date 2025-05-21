'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import ErrorMessage from './ErrorMessage';
import { calculateLoads } from '../utils/loadCalculations';

const COLUMNS = [
  { key: 'workout_date', label: 'Date' },
  { key: 'strength_volume', label: 'Strength Volume' },
  { key: 'strength_acute_load', label: 'Strength Acute Load' },
  { key: 'strength_chronic_load', label: 'Strength Chronic Load' },
  { key: 'strength_ratio', label: 'Strength Ratio' },
  { key: 'cardio_load', label: 'Cardio Load' },
  { key: 'cardio_acute_load', label: 'Cardio Acute Load' },
  { key: 'cardio_chronic_load', label: 'Cardio Chronic Load' },
  { key: 'cardio_ratio', label: 'Cardio Ratio' },
  { key: 'combined_ratio', label: 'Combined Ratio' },
  { key: 'note', label: 'Notes' }
];

const WorkoutHistoryTable = ({ userId }) => {
  const supabase = createClientComponentClient();
  const [workouts, setWorkouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'workout_date', direction: 'desc' });

  useEffect(() => {
    loadWorkoutHistory();
  }, []);

  const loadWorkoutHistory = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', session.user.id)
        .order('workout_date', { ascending: false });

      if (error) throw error;
      
      // Calculate loads for all workouts
      const workoutsWithLoads = calculateLoads(data || []);
      setWorkouts(workoutsWithLoads);
    } catch (error) {
      console.error('Error loading workout history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: 
        sortConfig.key === key && sortConfig.direction === 'asc' 
          ? 'desc' 
          : 'asc'
    });
  };

  const sortedHistory = [...workouts].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  if (isLoading) {
    return <div className="animate-pulse h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      <div className="relative">
        {/* Scroll Indicators */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 animate-bounce-x">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 animate-bounce">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto relative max-h-[70vh] rounded-xl">
          <table className="min-w-full">
            <thead className="sticky top-0 z-10 bg-white dark:bg-gray-800">
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="sticky left-0 z-20 bg-white dark:bg-gray-800 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200">
                  <div className="flex items-center space-x-1" onClick={() => handleSort('workout_date')}>
                    <span>Date</span>
                    {sortConfig.key === 'workout_date' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                {COLUMNS.slice(1).map(({ key, label }) => (
                  <th 
                    key={key}
                    onClick={() => handleSort(key)}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    <div className="flex items-center space-x-1">
                      <span>{label}</span>
                      {sortConfig.key === key && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sortedHistory.map((workout) => (
                <tr 
                  key={workout.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="sticky left-0 z-10 bg-white dark:bg-gray-800 px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                    {new Date(workout.workout_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {workout.strength_volume ? `${workout.strength_volume} lbs` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {workout.strength_acute_load?.toFixed(2) || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {workout.strength_chronic_load?.toFixed(2) || '-'}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                    getRatioColor(workout.strength_ratio)
                  }`}>
                    {workout.strength_ratio?.toFixed(2) || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {workout.cardio_load || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {workout.cardio_acute_load?.toFixed(2) || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {workout.cardio_chronic_load?.toFixed(2) || '-'}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                    getRatioColor(workout.cardio_ratio)
                  }`}>
                    {workout.cardio_ratio?.toFixed(2) || '-'}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                    getRatioColor(workout.combined_ratio)
                  }`}>
                    {workout.combined_ratio?.toFixed(2) || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {workout.note || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Scroll Shadows */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-white dark:from-gray-800"></div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-white dark:from-gray-800"></div>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-white dark:from-gray-800"></div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-white dark:from-gray-800"></div>
      </div>
    </div>
  );
}

function getRatioColor(ratio) {
  if (ratio === null || typeof ratio === 'undefined') return 'text-gray-600 dark:text-gray-300';
  if (ratio < 0.5) {
    return 'text-red-500 dark:text-red-400'; // Color for low ratios (e.g., < 50%)
  } else if (ratio < 0.75) {
    return 'text-yellow-500 dark:text-yellow-400'; // Color for medium ratios (e.g., < 75%)
  } else {
    return 'text-green-500 dark:text-green-400'; // Color for high ratios (e.g., >= 75%)
  }
}

export default WorkoutHistoryTable;
