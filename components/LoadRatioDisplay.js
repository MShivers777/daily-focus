'use client';
import { Tooltip } from 'react-tooltip';

export default function LoadRatioDisplay({ label, value, isVisible, color, onClick }) {
  const getRatioColor = (value) => {
    if (value <= 0.8) return 'text-yellow-500';
    if (value <= 1.4) return 'text-green-500';
    return 'text-red-500';
  };

  const getTooltipContent = (value) => {
    if (value <= 0.8) {
      return "Recovery/Undertraining Zone: Current training load is low relative to recent history";
    }
    if (value <= 1.4) {
      return "Ideal Training Zone: Current training load is well-balanced with recent history";
    }
    return "Overtraining Risk Zone: Current training load is high relative to recent history";
  };

  return (
    <div className="flex items-center justify-between">
      <div className="text-gray-600 dark:text-gray-400">
        {label}: 
        <span 
          className={`font-semibold ml-2 ${getRatioColor(value)}`}
          data-tooltip-id={`ratio-tooltip-${label}`}
          data-tooltip-content={getTooltipContent(value)}
          data-tooltip-delay-show={500}
        >
          {value}
        </span>
        <Tooltip id={`ratio-tooltip-${label}`} />
      </div>
      <button 
        onClick={onClick}
        className={`w-4 h-4 rounded transition-opacity duration-200 ${color} ${
          !isVisible && 'opacity-25'
        }`}
      />
    </div>
  );
}
