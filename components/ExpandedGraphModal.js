'use client';

export default function ExpandedGraphModal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  // Log to check if children are being passed
  console.log('[ExpandedGraphModal] Rendering with children:', children);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-6xl p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
          >
            ✕
          </button>
          
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 text-center">
            Load Ratios
          </h2>
          
          {/* Add a border to the children container for visual debugging */}
          <div className="h-[70vh]" style={{ border: '2px dashed limegreen' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
