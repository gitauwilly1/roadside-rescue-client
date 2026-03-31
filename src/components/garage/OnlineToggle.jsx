import React from 'react';

const OnlineToggle = ({ isOnline, onToggle, isLoading = false }) => {
  return (
    <button
      onClick={onToggle}
      disabled={isLoading}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        isOnline
          ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
          : 'bg-gray-700 hover:bg-gray-800 text-white'
      } ${isLoading && 'opacity-50 cursor-not-allowed'}`}
    >
      <div className="flex items-center gap-2">
        <span className={`inline-block w-2 h-2 rounded-full ${isOnline ? 'bg-green-300 animate-pulse' : 'bg-gray-400'}`}></span>
        {isOnline ? '🟢 Online' : '⚫ Offline'}
      </div>
    </button>
  );
};

export default OnlineToggle;