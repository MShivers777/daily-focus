'use client';

export default function HydrationGuide({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl max-w-4xl w-full m-4 shadow-xl">
        <div className="text-center mb-8">
          <div className="flex justify-end">
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
          <div className="text-green-600 dark:text-green-400 mb-6">
            <span className="text-4xl">✓</span>
            <h2 className="text-2xl font-bold mt-2">Workout Saved Successfully!</h2>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
            Recommended Post-Workout Hydration
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="p-2 text-left text-gray-600 dark:text-gray-300">Exercise Duration</th>
                <th className="p-2 text-left text-gray-600 dark:text-gray-300">Condition</th>
                <th className="p-2 text-left text-gray-600 dark:text-gray-300">Fluids (fl. oz)</th>
                <th className="p-2 text-left text-gray-600 dark:text-gray-300">Table Salt (tsp)</th>
                <th className="p-2 text-left text-gray-600 dark:text-gray-300">K (bananas)</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              <tr>
                <td className="p-2 text-gray-800 dark:text-gray-200">90 min zone 2</td>
                <td className="p-2 text-gray-800 dark:text-gray-200">Outdoors, sunny, 93°F</td>
                <td className="p-2 text-gray-800 dark:text-gray-200">51</td>
                <td className="p-2 text-gray-800 dark:text-gray-200">0.75</td>
                <td className="p-2 text-gray-800 dark:text-gray-200">0.8</td>
              </tr>
              <tr>
                <td className="p-2 text-gray-800 dark:text-gray-200">90 min zone 2</td>
                <td className="p-2 text-gray-800 dark:text-gray-200">Indoors, 72°F</td>
                <td className="p-2 text-gray-800 dark:text-gray-200">38</td>
                <td className="p-2 text-gray-800 dark:text-gray-200">0.56</td>
                <td className="p-2 text-gray-800 dark:text-gray-200">0.6</td>
              </tr>
              <tr>
                <td className="p-2 text-gray-800 dark:text-gray-200">45 min zone 2</td>
                <td className="p-2 text-gray-800 dark:text-gray-200">Indoors, 72°F</td>
                <td className="p-2 text-gray-800 dark:text-gray-200">19</td>
                <td className="p-2 text-gray-800 dark:text-gray-200">0.28</td>
                <td className="p-2 text-gray-800 dark:text-gray-200">0.3</td>
              </tr>
              <tr>
                <td className="p-2 text-gray-800 dark:text-gray-200">45 min HIIT</td>
                <td className="p-2 text-gray-800 dark:text-gray-200">Indoors, 72°F</td>
                <td className="p-2 text-gray-800 dark:text-gray-200">29</td>
                <td className="p-2 text-gray-800 dark:text-gray-200">0.43</td>
                <td className="p-2 text-gray-800 dark:text-gray-200">0.5</td>
              </tr>
              <tr>
                <td className="p-2 text-gray-800 dark:text-gray-200">45 min tempo</td>
                <td className="p-2 text-gray-800 dark:text-gray-200">Indoors, 72°F</td>
                <td className="p-2 text-gray-800 dark:text-gray-200">24</td>
                <td className="p-2 text-gray-800 dark:text-gray-200">0.35</td>
                <td className="p-2 text-gray-800 dark:text-gray-200">0.4</td>
              </tr>
              <tr>
                <td className="p-2 text-gray-800 dark:text-gray-200">45 min Norwegian 4x4</td>
                <td className="p-2 text-gray-800 dark:text-gray-200">Indoors, 72°F</td>
                <td className="p-2 text-gray-800 dark:text-gray-200">34</td>
                <td className="p-2 text-gray-800 dark:text-gray-200">0.50</td>
                <td className="p-2 text-gray-800 dark:text-gray-200">0.5</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Note: Consume fluids and electrolytes gradually over 2-4 hours post-workout. 
          Bananas are listed as a reference for potassium content.
        </p>
      </div>
    </div>
  );
}
