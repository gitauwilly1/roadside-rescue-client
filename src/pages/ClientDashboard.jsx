import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { client } from '../services/api';

const ClientDashboard = () => {
  const { user, logout } = useAuth();
  const { socket, isConnected } = useSocket();
  const [activeTab, setActiveTab] = useState('request');
  const [jobs, setJobs] = useState([]);
  const [nearbyGarages, setNearbyGarages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeJob, setActiveJob] = useState(null);
  const [garageLocation, setGarageLocation] = useState(null);
  
  // Job request form state
  const [jobForm, setJobForm] = useState({
    serviceType: 'tire_change',
    clientAddress: '',
    notes: '',
    clientLocation: {
      coordinates: [36.8219, -1.2921]
    }
  });

  // Load user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setJobForm(prev => ({
            ...prev,
            clientLocation: { coordinates: [longitude, latitude] }
          }));
          loadNearbyGarages(latitude, longitude);
        },
        (error) => {
          console.error('Geolocation error:', error);
          loadNearbyGarages(-1.2921, 36.8219);
        }
      );
    } else {
      loadNearbyGarages(-1.2921, 36.8219);
    }
  }, []);

  // Load job history
  useEffect(() => {
    loadJobs();
  }, []);

  // Socket event listeners for real-time job updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for job status updates
    socket.on('job_status_update', (updatedJob) => {
      console.log('Job status update received:', updatedJob);
      
      // Update jobs list
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job._id === updatedJob._id ? { ...job, ...updatedJob } : job
        )
      );
      
      // Update active job if it's the one being tracked
      if (activeJob && activeJob._id === updatedJob._id) {
        setActiveJob(updatedJob);
        
        // Show status change notification
        const statusMessages = {
          accepted: '✅ Your rescue request has been accepted! A garage is on their way.',
          en_route: '🚗 The garage is en route to your location!',
          in_progress: '🔧 The mechanic has arrived and is working on your vehicle.',
          completed: '🎉 Your rescue is complete! Please rate your experience.'
        };
        
        if (statusMessages[updatedJob.status]) {
          setSuccess(statusMessages[updatedJob.status]);
          setTimeout(() => setSuccess(''), 5000);
        }
      }
      
      loadJobs();
    });

    // Listen for garage location updates (for live tracking)
    socket.on('garage_location_update', ({ jobId, location }) => {
      if (activeJob && activeJob._id === jobId) {
        setGarageLocation(location);
      }
    });

    return () => {
      socket.off('job_status_update');
      socket.off('garage_location_update');
    };
  }, [socket, isConnected, activeJob]);

  const loadJobs = async () => {
    try {
      const response = await client.getJobs({ limit: 10 });
      setJobs(response.data.jobs);
      
      // Check for active job (pending, accepted, en_route, in_progress)
      const active = response.data.jobs.find(job => 
        ['pending', 'accepted', 'en_route', 'in_progress'].includes(job.status)
      );
      if (active) {
        setActiveJob(active);
        // Join room for this job to receive real-time updates
        if (socket && isConnected) {
          socket.emit('join_job_room', active._id);
        }
      } else {
        setActiveJob(null);
        setGarageLocation(null);
      }
    } catch (err) {
      console.error('Failed to load jobs:', err);
    }
  };

  const loadNearbyGarages = async (lat, lng) => {
    try {
      const response = await client.getNearbyGarages(lat, lng, 10);
      setNearbyGarages(response.data.garages);
    } catch (err) {
      console.error('Failed to load nearby garages:', err);
    }
  };

  const handleJobFormChange = (e) => {
    const { name, value } = e.target;
    setJobForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitJob = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (!jobForm.clientAddress) {
      setError('Please enter your location address');
      setIsLoading(false);
      return;
    }

    try {
      const response = await client.createJob(jobForm);
      setSuccess('Job request created successfully! A nearby garage will respond shortly.');
      setJobForm(prev => ({ ...prev, notes: '' }));
      loadJobs();
      
      // Emit new job event for real-time alerts
      if (socket && isConnected) {
        socket.emit('new_job', response.data.job);
      }
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create job request');
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

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      accepted: '✅',
      en_route: '🚗',
      in_progress: '🔧',
      completed: '🎉',
      cancelled: '❌'
    };
    return icons[status] || '📋';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-blue-600 text-white sticky top-0 z-10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Roadside Rescue</h1>
              <p className="text-sm text-blue-100">Welcome, {user?.fullName}</p>
              {isConnected && <p className="text-xs text-blue-200">🔌 Real-time connected</p>}
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 rounded-lg text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Active Job Tracking Card */}
      {activeJob && activeJob.status !== 'completed' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getStatusIcon(activeJob.status)}</span>
                <div>
                  <p className="text-sm opacity-90">Current Rescue Status</p>
                  <p className="font-bold text-lg">{getStatusText(activeJob.status)}</p>
                </div>
              </div>
              {activeJob.garageId && (
                <div className="text-right">
                  <p className="text-sm opacity-90">Assigned Garage</p>
                  <p className="font-medium">{typeof activeJob.garageId === 'object' ? activeJob.garageId.businessName : 'Garage Assigned'}</p>
                </div>
              )}
            </div>
            {activeJob.status === 'en_route' && garageLocation && (
              <div className="mt-3 pt-3 border-t border-blue-400">
                <p className="text-sm">🚗 Garage is en route to your location</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('request')}
            className={`px-6 py-3 font-medium rounded-t-lg transition-colors ${
              activeTab === 'request'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Request Rescue
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 font-medium rounded-t-lg transition-colors ${
              activeTab === 'history'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My History
          </button>
          <button
            onClick={() => setActiveTab('garages')}
            className={`px-6 py-3 font-medium rounded-t-lg transition-colors ${
              activeTab === 'garages'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Nearby Garages
          </button>
        </div>

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

        {/* Request Rescue Tab */}
        {activeTab === 'request' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Request Rescue</h2>
            
            {activeJob && activeJob.status !== 'completed' ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">{getStatusIcon(activeJob.status)}</div>
                <h3 className="text-lg font-semibold text-gray-900">You have an active rescue request</h3>
                <p className="text-gray-600 mt-2">
                  Status: <span className={`font-medium ${activeJob.status === 'pending' ? 'text-yellow-600' : 'text-blue-600'}`}>
                    {getStatusText(activeJob.status)}
                  </span>
                </p>
                <p className="text-gray-500 text-sm mt-4">
                  You can only request a new rescue after your current request is completed or cancelled.
                </p>
                <button
                  onClick={() => setActiveTab('history')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  View Active Request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitJob} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Needed *
                  </label>
                  <select
                    name="serviceType"
                    value={jobForm.serviceType}
                    onChange={handleJobFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="tire_change">🔧 Tire Change - KES 1,500 - 2,500</option>
                    <option value="jump_start">🔋 Jump Start - KES 1,000 - 1,800</option>
                    <option value="fuel_delivery">⛽ Fuel Delivery - KES 1,200 - 2,000</option>
                    <option value="towing_5km">🚚 Towing (up to 5km) - KES 2,500 - 4,000</option>
                    <option value="custom">🔧 Custom Service - Will be quoted</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Location Address *
                  </label>
                  <input
                    type="text"
                    name="clientAddress"
                    value={jobForm.clientAddress}
                    onChange={handleJobFormChange}
                    placeholder="e.g., Mombasa Road, Near Gate A, Nairobi"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    We'll use your device location to find nearby garages
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    value={jobForm.notes}
                    onChange={handleJobFormChange}
                    rows="3"
                    placeholder="e.g., Car is a white Toyota Fielder, near the Total petrol station"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Requesting...' : 'Request Rescue Now'}
                </button>
              </form>
            )}

            {/* Quick Tips */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">💡 Quick Tips</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Make sure your phone's location is enabled for faster response</li>
                <li>• A nearby garage will accept your request within minutes</li>
                <li>• You'll receive real-time updates on the driver's location</li>
                <li>• Payment is made directly to the garage after service</li>
              </ul>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">My Rescue History</h2>
            
            {jobs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-2">No rescue requests yet</p>
                <p className="text-sm">Click "Request Rescue" to get help when stranded</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
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
                    {job.garageId && (
                      <p className="text-sm text-gray-600">
                        🏪 Garage: {typeof job.garageId === 'object' ? job.garageId.businessName : 'Assigned'}
                      </p>
                    )}
                    {job.notes && (
                      <p className="text-sm text-gray-500 mt-2 italic">"{job.notes}"</p>
                    )}
                    
                    {/* Show review button for completed jobs without review */}
                    {job.status === 'completed' && !job.hasReview && (
                      <button
                        className="mt-3 px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm hover:bg-yellow-200"
                        onClick={() => alert('Review feature coming soon!')}
                      >
                        ⭐ Leave a Review
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Nearby Garages Tab */}
        {activeTab === 'garages' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Nearby Garages</h2>
            
            {nearbyGarages.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No garages found nearby</p>
                <p className="text-sm mt-1">Try expanding your search radius</p>
              </div>
            ) : (
              <div className="space-y-3">
                {nearbyGarages.map((garage) => (
                  <div key={garage._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{garage.businessName}</h3>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            {garage.distance} km
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{garage.address}</p>
                        <p className="text-sm text-gray-600">📞 {garage.businessPhone}</p>
                        <div className="flex gap-2 mt-2">
                          {garage.services?.slice(0, 3).map((service, idx) => (
                            <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {service.serviceType.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span className="font-medium">{garage.rating || 'New'}</span>
                        </div>
                        <p className="text-xs text-gray-500">{garage.totalReviews || 0} reviews</p>
                        {garage.isOnline && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full mt-2 inline-block">
                            Online
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;