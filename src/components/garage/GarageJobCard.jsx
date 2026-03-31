import React from 'react';

const GarageJobCard = ({ job, onStatusUpdate, isOnline = true, isLoading = false }) => {
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

  const getNextAction = () => {
    switch (job.status) {
      case 'accepted':
        return { label: 'Mark as En Route', action: () => onStatusUpdate(job._id, 'en_route'), color: 'bg-orange-600 hover:bg-orange-700' };
      case 'en_route':
        return { label: 'Start Service', action: () => onStatusUpdate(job._id, 'in_progress'), color: 'bg-blue-600 hover:bg-blue-700' };
      case 'in_progress':
        return { label: 'Complete Job', action: () => onStatusUpdate(job._id, 'completed'), color: 'bg-green-600 hover:bg-green-700' };
      default:
        return null;
    }
  };

  const nextAction = getNextAction();

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-all hover:border-red-200">
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="font-bold text-gray-900">{getServiceName(job.serviceType)}</span>
          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(job.status)}`}>
            {getStatusText(job.status)}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {new Date(job.createdAt).toLocaleDateString()}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-1"> {job.clientAddress}</p>
      <p className="text-sm text-gray-600"> {job.clientId?.fullName || 'Client'}</p>
      <p className="text-sm text-gray-600"> {job.clientId?.phone || 'Not available'}</p>
      {job.notes && (
        <p className="text-sm text-gray-500 mt-2 italic">"{job.notes}"</p>
      )}
      
      {/* Status Timeline */}
      <div className="mt-3 pt-3 border-t">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {job.acceptedAt && <span>✓ Accepted: {new Date(job.acceptedAt).toLocaleTimeString()}</span>}
          {job.completedAt && <span>✓ Completed: {new Date(job.completedAt).toLocaleTimeString()}</span>}
        </div>
      </div>
      
      {nextAction && (
        <div className="mt-3">
          <button
            onClick={nextAction.action}
            disabled={isLoading || !isOnline}
            className={`px-4 py-2 ${nextAction.color} text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50`}
          >
            {nextAction.label}
          </button>
        </div>
      )}
      
      {job.status === 'pending' && (
        <div className="mt-3">
          <button
            onClick={() => onStatusUpdate(job._id, 'accepted')}
            disabled={isLoading || !isOnline}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
          >
            🚨 Accept Emergency
          </button>
        </div>
      )}
    </div>
  );
};

export default GarageJobCard;