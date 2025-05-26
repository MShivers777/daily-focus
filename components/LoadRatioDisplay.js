'use client';
import React from 'react'; // Import React

function LoadRatioDisplay({ label, value, isVisible, color, onClick }) {
  const getValueColor = (val) => {
    if (!isVisible) return 'text-gray-400 dark:text-gray-500';
    if (val < 0.8) return 'text-yellow-500 dark:text-yellow-400';
    if (val <= 1.4) return 'text-green-500 dark:text-green-400';
    return 'text-red-500 dark:text-red-400';
  };
  
  return (
    <button 
      onClick={onClick} 
      className={`flex items-center justify-between w-full p-2 rounded-lg transition-all ${
        isVisible ? 'bg-opacity-10 ' + color : 'bg-gray-100 dark:bg-gray-700'
      }`}
    >
      <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <span className={`font-bold ${getValueColor(value)}`}>
        {value.toFixed(2)}
      </span>
    </button>
  );
}

export default React.memo(LoadRatioDisplay); // Wrap with React.memo
