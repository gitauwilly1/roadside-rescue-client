import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { client } from '../services/api';
import ReviewModal from '../components/common/ReviewModal';

const ClientDashboard = () => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('request');
  const [jobs, setJobs] = useState([]);
  const [nearbyGarages, setNearbyGarages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeJob, setActiveJob] = useState(null);
  const [garageLocation, setGarageLocation] = useState(null);
  const [selectedJobForReview, setSelectedJobForReview] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  
  const [jobForm, setJobForm] = useState({
    serviceType: 'tire_change',
    clientAddress: '',
    notes: '',
    clientLocation: {
      coordinates: [36.8219, -1.2921]
    }
  });

  // Set active section based on URL path
  useEffect(() => {
    if (location.pathname === '/history') {
      setActiveSection('history');
    } else if (location.pathname === '/garages') {
      setActiveSection('garages');
    } else {
      setActiveSection('request');
    }
  }, [location.pathname]);

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
        () => loadNearbyGarages(-1.2921, 36.8219)
      );
    } else {
      loadNearbyGarages(-1.2921, 36.8219);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on('job_status_update', (updatedJob) => {
      console.log('Job status update received:', updatedJob);
      
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job._id === updatedJob._id ? { ...job, ...updatedJob } : job
        )
      );
      
      if (activeJob && activeJob._id === updatedJob._id) {
        setActiveJob(updatedJob);
        
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
      
      const active = response.data.jobs.find(job => 
        ['pending', 'accepted', 'en_route', 'in_progress'].includes(job.status)
      );
      if (active) {
        setActiveJob(active);
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

  const handleReviewSubmitted = () => {
    setSuccess('Thank you for your review!');
    setTimeout(() => setSuccess(''), 3000);
    loadJobs();
  };

  const openReviewModal = (job) => {
    setSelectedJobForReview(job);
    setShowReviewModal(true);
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setSelectedJobForReview(null);
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
    <div className="min-h-screen bg-gray-50">
      {selectedJobForReview && (
        <ReviewModal
          job={selectedJobForReview}
          isOpen={showReviewModal}
          onClose={closeReviewModal}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}

      {/* Active Job Emergency Banner */}
      {activeJob && activeJob.status !== 'completed' && (
        <div className="bg-gradient-primary text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="animate-pulse">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium">Emergency Rescue in Progress</p>
                  <p className="text-xs opacity-90">Status: {getStatusText(activeJob.status)}</p>
                </div>
              </div>
              {activeJob.garageId && (
                <div className="text-right text-sm">
                  <p className="font-medium">Assigned Garage</p>
                  <p className="text-xs opacity-90">
                    {typeof activeJob.garageId === 'object' ? activeJob.garageId.businessName : 'Garage Assigned'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status and Connection */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {activeSection === 'request' && ' Emergency Rescue Request'}
              {activeSection === 'history' && ' My Rescue History'}
              {activeSection === 'garages' && ' Nearby Verified Garages'}
            </h1>
            <p className="text-sm text-gray-500">
              {activeSection === 'request' && 'Get immediate roadside assistance'}
              {activeSection === 'history' && 'View all your past rescue requests'}
              {activeSection === 'garages' && 'Find trusted garages near your location'}
            </p>
          </div>
          {isConnected && (
            <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Real-time connected</span>
            </div>
          )}
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg shadow-sm animate-fade-in">
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg shadow-sm animate-fade-in">
            <p className="text-sm">{success}</p>
          </div>
        )}

        {/* Request Rescue Section */}
        {activeSection === 'request' && (
          <div className="bg-white rounded-xl shadow-lg p-6 card-hover">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Emergency Rescue Request</h2>
            
            {activeJob && activeJob.status !== 'completed' ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4 animate-pulse">{getStatusIcon(activeJob.status)}</div>
                <h3 className="text-lg font-semibold text-gray-900">Active Rescue Request</h3>
                <p className="text-gray-600 mt-2">
                  Status: <span className={`font-medium ${activeJob.status === 'pending' ? 'text-yellow-600' : 'text-red-600'}`}>
                    {getStatusText(activeJob.status)}
                  </span>
                </p>
                <p className="text-gray-500 text-sm mt-4">
                  Your request is being processed. Please wait for assistance.
                </p>
                <button
                  onClick={() => window.location.href = '/history'}
                  className="mt-4 btn-outline"
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
                    className="input-primary"
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
                    className="input-primary"
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
                    className="input-primary resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Requesting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Request Rescue Now</span>
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-100">
              <h3 className="font-medium text-red-800 mb-2">🚨 Emergency Tips</h3>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Stay in a safe location away from traffic</li>
                <li>• Turn on your hazard lights</li>
                <li>• Keep your phone location enabled for faster response</li>
                <li>• A nearby garage will accept your request within minutes</li>
              </ul>
            </div>
          </div>
        )}

        {/* History Section */}
        {activeSection === 'history' && (
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
                         Garage: {typeof job.garageId === 'object' ? job.garageId.businessName : 'Assigned'}
                      </p>
                    )}
                    {job.notes && (
                      <p className="text-sm text-gray-500 mt-2 italic">"{job.notes}"</p>
                    )}
                    
                    {job.status === 'completed' && !job.hasReview && (
                      <button
                        onClick={() => openReviewModal(job)}
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
                ))}
              </div>
            )}
          </div>
        )}

        {/* Nearby Garages Section */}
        {activeSection === 'garages' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Nearby Verified Garages</h2>
            
            {nearbyGarages.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No garages found nearby</p>
                <p className="text-sm mt-1">Try expanding your search radius</p>
              </div>
            ) : (
              <div className="space-y-3">
                {nearbyGarages.map((garage) => (
                  <div key={garage._id} className="border rounded-lg p-4 hover:shadow-md transition-all hover:border-red-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{garage.businessName}</h3>
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                            {garage.distance} km
                          </span>
                          {garage.isOnline && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              Online
                            </span>
                          )}
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
                        <button className="mt-2 text-xs text-red-600 hover:text-red-700 font-medium">
                          Contact
                        </button>
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