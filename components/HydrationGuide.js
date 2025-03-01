'use client';

export default function HydrationGuide({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl max-w-md w-full m-4 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Post-Workout Hydration Guide</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="p-2 text-left text-gray-600 dark:text-gray-300">Weight Loss</th>
                <th className="p-2 text-left text-gray-600 dark:text-gray-300">Fluid (oz)</th>
                <th className="p-2 text-left text-gray-600 dark:text-gray-300">Electrolytes (g)</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              <tr>
                <td className="p-2 text-gray-800 dark:text-gray-200">1 lb</td>
                <td className="p-2 text-gray-800 dark:text-gray-200">24</td>
                <td className="p-2 text-gray-800 dark:text-gray-200">1.5</td>
              </tr>
              <tr>
                <td className="p-2 text-gray-800 dark:text-gray-200">2 lbs</td>
                <td className="p-2 text-gray-800 dark:text-gray-200">48</td>
                <td className="p-2 text-gray-800 dark:text-gray-200">3.0</td>
              </tr>
              <tr>
                <td className="p-2 text-gray-800 dark:text-gray-200">3 lbs</td>
                <td className="p-2 text-gray-800 dark:text-gray-200">72</td>
                <td className="p-2 text-gray-800 dark:text-gray-200">4.5</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Note: Consume fluids and electrolytes gradually over 2-4 hours post-workout.
        </p>
      </div>
    </div>
  );
}
