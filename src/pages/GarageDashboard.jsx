import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { garage } from '../services/api';

const GarageDashboard = () => {
  const { user, garage: garageProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('available');
  const [availableJobs, setAvailableJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  useEffect(() => {
    loadAvailableJobs();
    loadMyJobs();
    if (garageProfile) {
      setIsOnline(garageProfile.isOnline);
    }
  }, []);

  const loadAvailableJobs = async () => {
    try {
      const response = await garage.getAvailableJobs({ limit: 20 });
      setAvailableJobs(response.data.jobs);
    } catch (err) {
      console.error('Failed to load available jobs:', err);
    }
  };

  const loadMyJobs = async () => {
    try {
      const response = await garage.getJobs({ limit: 20 });
      setMyJobs(response.data.jobs);
    } catch (err) {
      console.error('Failed to load my jobs:', err);
    }
  };

  const toggleOnlineStatus = async () => {
    setIsLoading(true);
    try {
      const response = await garage.toggleOnlineStatus(!isOnline);
      setIsOnline(response.data.isOnline);
      setSuccess(response.data.message);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const acceptJob = async (jobId) => {
    setIsLoading(true);
    try {
      const response = await garage.updateJobStatus(jobId, 'accepted');
      setSuccess(`Job accepted! You can now navigate to the client.`);
      loadAvailableJobs();
      loadMyJobs();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to accept job');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const updateJobStatus = async (jobId, status) => {
    setIsLoading(true);
    try {
      const response = await garage.updateJobStatus(jobId, status);
      const statusMessages = {
        en_route: 'You are now en route to the client!',
        in_progress: 'You have arrived and are working on the vehicle.',
        completed: 'Job marked as completed. Thank you for your service!',
        cancelled: 'Job cancelled.'
      };
      setSuccess(statusMessages[status] || `Job status updated to ${status}`);
      loadMyJobs();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update job status');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

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
      accepted: 'bg-blue-100 text-blue-800',
      en_route: 'bg-purple-100 text-purple-800',
      in_progress: 'bg-indigo-100 text-indigo-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
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

  const getNextAction = (job) => {
    switch (job.status) {
      case 'accepted':
        return { label: 'Mark as En Route', action: () => updateJobStatus(job._id, 'en_route'), color: 'bg-purple-600 hover:bg-purple-700' };
      case 'en_route':
        return { label: 'Start Service', action: () => updateJobStatus(job._id, 'in_progress'), color: 'bg-indigo-600 hover:bg-indigo-700' };
      case 'in_progress':
        return { label: 'Complete Job', action: () => updateJobStatus(job._id, 'completed'), color: 'bg-green-600 hover:bg-green-700' };
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-green-600 text-white sticky top-0 z-10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Roadside Rescue - Garage</h1>
              <p className="text-sm text-green-100">Welcome, {garageProfile?.businessName || user?.fullName}</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleOnlineStatus}
                disabled={isLoading}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isOnline
                    ? 'bg-green-700 hover:bg-green-800 text-white'
                    : 'bg-gray-700 hover:bg-gray-800 text-white'
                }`}
              >
                {isOnline ? '🟢 Online' : '⚫ Offline'}
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 bg-green-700 hover:bg-green-800 rounded-lg text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Status Card */}
        <div className={`mb-6 p-4 rounded-lg ${isOnline ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Current Status</p>
              <p className={`text-sm ${isOnline ? 'text-green-700' : 'text-gray-600'}`}>
                {isOnline 
                  ? 'You are online and will receive job alerts from nearby clients' 
                  : 'You are offline. Go online to start receiving job requests'}
              </p>
            </div>
            <div className={`text-2xl ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
              {isOnline ? '🟢' : '⚫'}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-6 py-3 font-medium rounded-t-lg transition-colors ${
              activeTab === 'available'
                ? 'bg-white text-green-600 border-b-2 border-green-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Available Jobs ({availableJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('myjobs')}
            className={`px-6 py-3 font-medium rounded-t-lg transition-colors ${
              activeTab === 'myjobs'
                ? 'bg-white text-green-600 border-b-2 border-green-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My Jobs ({myJobs.length})
          </button>
        </div>

        {/* Available Jobs Tab */}
        {activeTab === 'available' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Available Rescue Requests</h2>
            
            {!isOnline && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-700">⚠️ You are currently offline. Go online to accept jobs.</p>
              </div>
            )}
            
            {availableJobs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-2">No pending rescue requests</p>
                <p className="text-sm">Check back later or go online to receive alerts</p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableJobs.map((job) => (
                  <div key={job._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-medium text-gray-900">{getServiceName(job.serviceType)}</span>
                        <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(job.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">📍 {job.clientAddress}</p>
                    <p className="text-sm text-gray-600">👤 {job.clientId?.fullName || 'Client'}</p>
                    <p className="text-sm text-gray-600">📞 {job.clientId?.phone || 'Not available'}</p>
                    {job.notes && (
                      <p className="text-sm text-gray-500 mt-2 italic">"{job.notes}"</p>
                    )}
                    <div className="mt-3">
                      <button
                        onClick={() => acceptJob(job._id)}
                        disabled={isLoading || !isOnline}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Accept Job
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Jobs Tab */}
        {activeTab === 'myjobs' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">My Assigned Jobs</h2>
            
            {myJobs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No jobs assigned yet</p>
                <p className="text-sm mt-1">Accept available jobs to start earning</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myJobs.map((job) => {
                  const nextAction = getNextAction(job);
                  return (
                    <div key={job._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
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
                      <p className="text-sm text-gray-600">👤 {job.clientId?.fullName || 'Client'}</p>
                      <p className="text-sm text-gray-600">📞 {job.clientId?.phone || 'Not available'}</p>
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
                            disabled={isLoading}
                            className={`px-4 py-2 ${nextAction.color} text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50`}
                          >
                            {nextAction.label}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GarageDashboard;