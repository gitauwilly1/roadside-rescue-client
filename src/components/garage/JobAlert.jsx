import React, { useEffect } from 'react';
import { playNotificationAudio } from '../../utils/playNotification';

const JobAlert = ({ job, onAccept, onDecline, onClose, autoAcceptTimeout = 30000 }) => {
  useEffect(() => {
    if (job) {
      playNotificationAudio();
    }
  }, [job]);

  if (!job) return null;

  const getServiceName = (serviceType) => {
    const services = {
      tire_change: '🔧 Tire Change',
      jump_start: '🔋 Jump Start',
      fuel_delivery: '⛽ Fuel Delivery',
      towing_5km: '🚚 Towing (up to 5km)',
      custom: '🔧 Custom Service'
    };
    return services[serviceType] || serviceType;
  };

  return (
    <div className="fixed top-20 right-4 z-50 animate-slide-in-right">
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-xl max-w-sm w-80">
        <div className="flex">
          <div className="flex-shrink-0">
            <div className="animate-ring">
              <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-bold text-red-800"> New Emergency Request!</p>
            <p className="text-sm font-medium text-gray-900 mt-1">
              {getServiceName(job.serviceType)}
            </p>
            <p className="text-xs text-gray-600 mt-1">
               {job.clientAddress}
            </p>
            <p className="text-xs text-gray-500 mt-1">
               {job.clientId?.fullName || 'Client'}
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => onAccept(job._id)}
                className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Accept
              </button>
              <button
                onClick={() => onDecline(job._id)}
                className="flex-1 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Decline
              </button>
            </div>
          </div>
          <button
            onClick={() => onClose()}
            className="ml-2 text-red-400 hover:text-red-600"
          >
            ×
          </button>
        </div>
        <div className="mt-2 pt-2 border-t border-red-200">
          <p className="text-xs text-red-600 text-center animate-pulse">
            Accept within {Math.ceil(autoAcceptTimeout / 1000)} seconds
          </p>
        </div>
      </div>
    </div>
  );
};

export default JobAlert;