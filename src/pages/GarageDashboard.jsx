import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { garage } from '../services/api';
import { playNotificationAudio } from '../utils/playNotification';

const GarageDashboard = () => {
  const { user, garage: garageProfile } = useAuth();
  const { socket, isConnected } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('available');
  const [availableJobs, setAvailableJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newJobAlert, setNewJobAlert] = useState(null);

  // Set active section based on URL path
  useEffect(() => {
    if (location.pathname === '/my-jobs') {
      setActiveSection('myjobs');
    } else {
      setActiveSection('available');
    }
  }, [location.pathname]);

  useEffect(() => {
    loadAvailableJobs();
    loadMyJobs();
    if (garageProfile) {
      setIsOnline(garageProfile.isOnline);
    }
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !isConnected || !isOnline) return;

    const onNewJobAlert = (job) => {
      console.log('New job alert received:', job);
      setNewJobAlert(job);
      playNotificationAudio();
      loadAvailableJobs();
      setTimeout(() => setNewJobAlert(null), 10000);
    };

    const onJobStatusUpdate = () => {
      loadMyJobs();
      loadAvailableJobs();
    };

    socket.on('new_job_alert', onNewJobAlert);
    socket.on('job_status_update', onJobStatusUpdate);

    return () => {
      socket.off('new_job_alert', onNewJobAlert);
      socket.off('job_status_update', onJobStatusUpdate);
    };
  }, [socket, isConnected, isOnline]);

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
      
      if (socket && isConnected) {
        socket.emit('garage_status_change', { 
          garageId: garageProfile?._id, 
          isOnline: !isOnline 
        });
      }
      
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
      await garage.updateJobStatus(jobId, 'accepted');
      setSuccess('Job accepted! You can now navigate to the client.');
      
      if (socket && isConnected) {
        socket.emit('job_accepted', { 
          jobId, 
          garageId: garageProfile?._id,
          garageName: garageProfile?.businessName
        });
      }
      
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
      await garage.updateJobStatus(jobId, status);
      const statusMessages = {
        en_route: 'You are now en route to the client!',
        in_progress: 'You have arrived and are working on the vehicle.',
        completed: 'Job marked as completed. Thank you for your service!',
        cancelled: 'Job cancelled.'
      };
      setSuccess(statusMessages[status] || `Job status updated to ${status}`);
      
      if (socket && isConnected) {
        socket.emit('job_status_update', { 
          jobId, 
          status,
          garageId: garageProfile?._id
        });
      }
      
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

  const getNextAction = (job) => {
    if (job.status === 'accepted') {
      return { label: 'Mark as En Route', action: () => updateJobStatus(job._id, 'en_route'), color: 'bg-orange-600 hover:bg-orange-700' };
    }
    if (job.status === 'en_route') {
      return { label: 'Start Service', action: () => updateJobStatus(job._id, 'in_progress'), color: 'bg-blue-600 hover:bg-blue-700' };
    }
    if (job.status === 'in_progress') {
      return { label: 'Complete Job', action: () => updateJobStatus(job._id, 'completed'), color: 'bg-green-600 hover:bg-green-700' };
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div className="bg-gradient-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold">
                {activeSection === 'available' ? '🚨 Emergency Rescue Requests' : '📋 My Assigned Jobs'}
              </h1>
              <p className="text-sm text-red-100">Welcome, {garageProfile?.businessName || user?.fullName}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {isConnected && (
                  <div className="flex items-center gap-1 text-xs bg-white/20 px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Live</span>
                  </div>
                )}
                <button
                  onClick={toggleOnlineStatus}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isOnline
                      ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
                      : 'bg-gray-700 hover:bg-gray-800 text-white'
                  }`}
                >
                  {isOnline ? '🟢 Online' : '⚫ Offline'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Job Alert Modal */}
      {newJobAlert && (
        <div className="fixed top-24 right-4 z-50 animate-slide-in-right">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-xl max-w-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-bold text-red-800">🚨 New Emergency Request!</p>
                <p className="text-sm text-red-700 mt-1">
                  {getServiceName(newJobAlert.serviceType)} at {newJobAlert.clientAddress}
                </p>
                <button
                  onClick={() => {
                    setNewJobAlert(null);
                    navigate('/');
                  }}
                  className="mt-2 text-xs font-medium text-red-700 hover:text-red-900 underline"
                >
                  View Now →
                </button>
              </div>
              <button
                onClick={() => setNewJobAlert(null)}
                className="ml-4 text-red-400 hover:text-red-600"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Card */}
        <div className={`mb-6 p-4 rounded-lg shadow-sm ${isOnline ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Service Status</p>
              <p className={`text-sm ${isOnline ? 'text-green-700' : 'text-gray-600'}`}>
                {isOnline 
                  ? ' You are online. Real-time job alerts are active.' 
                  : ' You are offline. Go online to receive emergency requests.'}
              </p>
            </div>
            <div className={`text-2xl ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
              {isOnline ? '🟢' : '⚫'}
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Available Jobs Section */}
        {activeSection === 'available' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Emergency Rescue Requests</h2>
            
            {!isOnline && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-700">⚠️ You are offline. Go online to accept emergency requests and receive real-time alerts.</p>
              </div>
            )}
            
            {availableJobs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-2">No pending rescue requests</p>
                <p className="text-sm">Check back later or go online to receive real-time alerts</p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableJobs.map((job) => (
                  <div key={job._id} className={`border rounded-lg p-4 hover:shadow-md transition-all ${newJobAlert?._id === job._id ? 'border-red-400 bg-red-50' : 'hover:border-red-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-bold text-gray-900">{getServiceName(job.serviceType)}</span>
                        <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(job.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1"> {job.clientAddress}</p>
                    <p className="text-sm text-gray-600">{job.clientId?.fullName || 'Client'}</p>
                    <p className="text-sm text-gray-600"> {job.clientId?.phone || 'Not available'}</p>
                    {job.notes && (
                      <p className="text-sm text-gray-500 mt-2 italic">"{job.notes}"</p>
                    )}
                    <div className="mt-3">
                      <button
                        onClick={() => acceptJob(job._id)}
                        disabled={isLoading || !isOnline}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                      >
                         Accept Emergency
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Jobs Section */}
        {activeSection === 'myjobs' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">My Assigned Jobs</h2>
            
            {myJobs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No jobs assigned yet</p>
                <p className="text-sm mt-1">Accept available emergency requests to start helping</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myJobs.map((job) => {
                  const nextAction = getNextAction(job);
                  return (
                    <div key={job._id} className="border rounded-lg p-4 hover:shadow-md transition-all hover:border-red-200">
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
                      <p className="text-sm text-gray-600 mb-1">📍 {job.clientAddress}</p>
                      <p className="text-sm text-gray-600">👤 {job.clientId?.fullName || 'Client'}</p>
                      <p className="text-sm text-gray-600">📞 {job.clientId?.phone || 'Not available'}</p>
                      {job.notes && (
                        <p className="text-sm text-gray-500 mt-2 italic">"{job.notes}"</p>
                      )}
                      
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
                            className={`px-4 py-2 ${nextAction.color} text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50`}
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