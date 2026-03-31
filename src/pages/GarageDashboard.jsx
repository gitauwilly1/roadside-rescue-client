import React, { useState, useEffect, useRef } from 'react';
import { useLocation as useRouterLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { garage } from '../services/api';
import useGeoLocation from '../hooks/useLocation';
import useJobTracking from '../hooks/useJobTracking';
import JobAlert from '../components/garage/JobAlert';
import GarageJobCard from '../components/garage/GarageJobCard';
import OnlineToggle from '../components/garage/OnlineToggle';

const GarageDashboard = () => {
  const { user, garage: garageProfile } = useAuth();
  const { socket, isConnected } = useSocket();
  const routerLocation = useRouterLocation();
  const [activeSection, setActiveSection] = useState('available');
  const [availableJobs, setAvailableJobs] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newJobAlert, setNewJobAlert] = useState(null);
  const [activeJobId, setActiveJobId] = useState(null);
  const locationIntervalRef = useRef(null);

  const { location: currentLocation, getCurrentPosition } = useGeoLocation({ watch: true });
  const { jobs: myJobs, loadJobs: loadMyJobs, activeJob } = useJobTracking('garage', socket, isConnected);

  useEffect(() => {
    const path = routerLocation.pathname;
    if (path === '/my-jobs') {
      setActiveSection('myjobs');
    } else {
      setActiveSection('available');
    }
  }, [routerLocation.pathname]);

  useEffect(() => {
    if (activeJob && ['accepted', 'en_route', 'in_progress'].includes(activeJob.status)) {
      setActiveJobId(activeJob._id);
    } else {
      setActiveJobId(null);
    }
  }, [activeJob]);

  useEffect(() => {
    // Clear existing interval
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }

    // Start sharing location if garage has an active job that is en route or in progress
    if (activeJob && socket && isConnected && ['en_route', 'in_progress'].includes(activeJob.status)) {
      console.log('Starting location sharing for job:', activeJob._id);
      
      // Get initial location
      getCurrentPosition();
      
      // Share location every 5 seconds
      locationIntervalRef.current = setInterval(() => {
        if (currentLocation && socket && isConnected) {
          socket.emit('garage_location_update', {
            jobId: activeJob._id,
            location: {
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              coordinates: currentLocation.coordinates
            }
          });
          console.log('Location shared:', currentLocation);
        }
      }, 5000);
    }

    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
    };
  }, [activeJob, socket, isConnected, currentLocation]);

  // Load initial data
  useEffect(() => {
    loadAvailableJobs();
    loadMyJobs();
    if (garageProfile) {
      setIsOnline(garageProfile.isOnline);
    }
  }, []);

  useEffect(() => {
    if (!socket || !isConnected || !isOnline) return;

    socket.on('new_job_alert', (job) => {
      console.log('New job alert received:', job);
      setNewJobAlert(job);
      loadAvailableJobs();
      setTimeout(() => setNewJobAlert(null), 10000);
    });

    socket.on('job_status_update', (updatedJob) => {
      console.log('Job status update:', updatedJob);
      loadMyJobs();
      loadAvailableJobs();
    });

    return () => {
      socket.off('new_job_alert');
      socket.off('job_status_update');
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

  const handleToggleOnline = async () => {
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

  const handleAcceptJob = async (jobId) => {
    setIsLoading(true);
    try {
      await garage.updateJobStatus(jobId, 'accepted');
      setSuccess(`Job accepted! You can now navigate to the client.`);
      setNewJobAlert(null);
      
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

  const handleDeclineJob = async (jobId) => {
    setNewJobAlert(null);
    loadAvailableJobs();
  };

  const handleStatusUpdate = async (jobId, status) => {
    setIsLoading(true);
    try {
      await garage.updateJobStatus(jobId, status);
      const statusMessages = {
        en_route: 'You are now en route to the client! Location sharing has started.',
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

  const handleCloseAlert = () => {
    setNewJobAlert(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* New Job Alert */}
      {newJobAlert && (
        <JobAlert
          job={newJobAlert}
          onAccept={handleAcceptJob}
          onDecline={handleDeclineJob}
          onClose={handleCloseAlert}
          autoAcceptTimeout={30000}
        />
      )}

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
                <OnlineToggle
                  isOnline={isOnline}
                  onToggle={handleToggleOnline}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Job Tracking Banner */}
      {activeJob && ['accepted', 'en_route', 'in_progress'].includes(activeJob.status) && (
        <div className="bg-blue-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="animate-pulse">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="text-sm font-medium">
                  {activeJob.status === 'accepted' && ' Location sharing will start when you mark as En Route'}
                  {activeJob.status === 'en_route' && ' Location sharing active - Client can see your location'}
                  {activeJob.status === 'in_progress' && '🔧 Service in progress - Location sharing active'}
                </span>
              </div>
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                Job #{activeJob._id.slice(-6)}
              </span>
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
                <p className="text-yellow-700"> You are offline. Go online to accept emergency requests and receive real-time alerts.</p>
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
                  <GarageJobCard
                    key={job._id}
                    job={job}
                    onStatusUpdate={handleStatusUpdate}
                    isOnline={isOnline}
                    isLoading={isLoading}
                  />
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
                {myJobs.map((job) => (
                  <GarageJobCard
                    key={job._id}
                    job={job}
                    onStatusUpdate={handleStatusUpdate}
                    isOnline={isOnline}
                    isLoading={isLoading}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GarageDashboard;