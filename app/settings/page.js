'use client';
import { useRouter } from 'next/navigation';
import MarriageOnboarding from '../../components/MarriageOnboarding';

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Settings</h1>
        <div className="space-y-6">
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
        </div>
      </div>
    </div>
  );
}
