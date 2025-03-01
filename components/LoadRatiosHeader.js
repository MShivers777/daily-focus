'use client';
import { Tooltip } from 'react-tooltip';

export default function LoadRatiosHeader() {
  const tooltipContent = `
    <div class="text-sm">
      <div class="font-semibold mb-2">Training Load Zones:</div>
      <div class="space-y-2">
        <div class="flex items-center">
          <div class="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
          <span>Below 0.8: Recovery/Undertraining Zone</span>
        </div>
        <div class="flex items-center">
          <div class="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></div>
          <span>0.8 - 1.4: Ideal Training Zone</span>
        </div>
        <div class="flex items-center">
          <div class="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></div>
          <span>Above 1.4: Overtraining Risk Zone</span>
        </div>
      </div>
    </div>
  `;

  return (
    <div>
      <h2 
        className="text-xl font-semibold text-gray-800 dark:text-white mb-4 cursor-help inline-flex items-center"
        data-tooltip-id="load-ratios-tooltip"
        data-tooltip-html={tooltipContent}
      >
        Load Ratios
        <span className="ml-1 text-gray-400 text-sm">ⓘ</span>
      </h2>
      <Tooltip 
        id="load-ratios-tooltip" 
        place="top" 
        className="max-w-xs !bg-white !text-gray-800 !opacity-100"
        classNameArrow="!border-white"
      />
    </div>
  );
}
