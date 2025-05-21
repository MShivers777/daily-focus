'use client';

import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import ErrorMessage from './ErrorMessage';
import toast from 'react-hot-toast';

const BodyMetrics = ({ userId }) => {
  const supabase = createClientComponentClient();
  const [weight, setWeight] = useState('');
  const [weightHistory, setWeightHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWeightHistory();
  }, []);

  const fetchWeightHistory = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('body_metrics')
        .select('*')
        .eq('user_id', session.user.id)
        .order('date', { ascending: true });

      if (error) throw error;
      setWeightHistory(data || []);
    } catch (error) {
      console.error('Error fetching weight history:', error);
      toast.error('Failed to load weight history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!weight) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('body_metrics')
        .upsert({
          user_id: session.user.id,
          date: today,
          weight: parseFloat(weight)
        });

      if (error) throw error;

      toast.success('Weight saved successfully');
      setWeight('');
      fetchWeightHistory();
    } catch (error) {
      console.error('Error saving weight:', error);
      toast.error('Failed to save weight');
    }
  };

  const chartData = {
    labels: weightHistory.map(entry => new Date(entry.date).toLocaleDateString()),
    datasets: [{
      label: 'Weight (lbs)',
      data: weightHistory.map(entry => entry.weight),
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.3,
      fill: true
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: false,
        grid: { color: 'rgba(156, 163, 175, 0.1)' }
      },
      x: {
        grid: { display: false }
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  };

  if (isLoading) {
    return <div className="animate-pulse h-96 bg-gray-200 dark:bg-gray-700 rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Weight Entry Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Track Weight
        </h2>
        <form onSubmit={handleSubmit} className="flex gap-4">
          <input
            type="number"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Enter today's weight"
            className="flex-1 p-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
          >
            Save
          </button>
        </form>
      </div>

      {/* Weight Graph */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Weight History
        </h2>
        <div className="h-[400px]">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}

export default BodyMetrics;
