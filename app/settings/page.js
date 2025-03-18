'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '../../api/supabase';
import BackIcon from '../../components/icons/BackIcon';
import AccountNameSettings from '../../components/AccountNameSettings';
import KidsSettings from '../../components/KidsSettings';

export default function SettingsPage() {
  const router = useRouter();
  const [isResetting, setIsResetting] = useState(false);

  const handleRedoOnboarding = async () => {
    try {
      setIsResetting(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      // Clear existing planned workouts
      const { error: deleteError } = await supabase
        .from('planned_workouts')
        .delete()
        .eq('user_id', session.user.id);

      if (deleteError) throw deleteError;

      router.push('/workouts/onboarding');
    } catch (error) {
      console.error('Error resetting workout preferences:', error);
      toast.error('Failed to reset workout preferences');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => router.push('/')}
        className="absolute top-0 left-0 p-2 rounded-lg transition-all bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
        aria-label="Back to main menu"
      >
        <BackIcon />
      </button>
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Settings</h1>
          
          <div className="space-y-6">
            {/* Account Name Section */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                Account Name
              </h2>
              <AccountNameSettings />
            </div>

            {/* Kids Setting Section */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                Do you have children?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                This helps us customize relationship prompts for your family situation
              </p>
              <KidsSettings />
            </div>

            {/* Marriage Focus Section */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                Marriage Focus Areas
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Update your marriage focus areas and priorities
              </p>
              <button
                onClick={() => router.push('/onboarding')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
              >
                Reconfigure Focus Areas
              </button>
            </div>

            {/* Workout Preferences Section */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                Workout Preferences
              </h2>
              <div className="space-y-4">
                <button
                  onClick={handleRedoOnboarding}
                  disabled={isResetting}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResetting ? 'Resetting...' : 'Redo Workout Onboarding'}
                </button>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This will clear your existing workout plan and let you set up new workout preferences.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
