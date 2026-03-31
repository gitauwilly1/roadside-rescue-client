import React from 'react';

const JobCard = ({ job, onReview }) => {
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

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-red-100 text-red-800',
      en_route: 'bg-orange-100 text-orange-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Pending',
      accepted: 'Accepted',
      en_route: 'En Route',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };
    return texts[status] || status;
  };

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-all hover:border-red-200">
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="font-medium text-gray-900">{getServiceName(job.serviceType)}</span>
          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(job.status)}`}>
            {getStatusText(job.status)}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {new Date(job.createdAt).toLocaleDateString()}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-1">📍 {job.clientAddress}</p>
      {job.garageId && (
        <p className="text-sm text-gray-600">
           Garage: {typeof job.garageId === 'object' ? job.garageId.businessName : 'Assigned'}
        </p>
      )}
      {job.notes && (
        <p className="text-sm text-gray-500 mt-2 italic">"{job.notes}"</p>
      )}
      
      {job.status === 'completed' && !job.hasReview && (
        <button
          onClick={() => onReview(job)}
          className="mt-3 px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors flex items-center gap-1"
        >
           Rate Your Experience
        </button>
      )}
      
      {job.status === 'completed' && job.hasReview && (
        <div className="mt-3 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm inline-flex items-center gap-1">
           Review Submitted
        </div>
      )}
    </div>
  );
};

export default JobCard;