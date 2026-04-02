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
import GarageMap from '../components/garage/GarageMap';
import { 
  FaCar, FaExclamationTriangle, FaInfoCircle, FaCheckCircle, 
  FaWrench, FaClock, FaMapMarkerAlt, FaPhoneAlt, FaStar, 
  FaStarHalfAlt, FaRegStar, FaUser, FaCalendarAlt, FaComment,
  FaChartBar
} from 'react-icons/fa';
import { MdLocationOn, MdVerified, MdRateReview } from 'react-icons/md';
import { BiCurrentLocation } from 'react-icons/bi';
import { HiOutlineStatusOnline, HiOutlineStatusOffline } from 'react-icons/hi';

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
  const [navigationInfo, setNavigationInfo] = useState(null);
  const locationIntervalRef = useRef(null);
  const isLocationSharingRef = useRef(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [ratingDistribution, setRatingDistribution] = useState([]);
  const [reviewsPagination, setReviewsPagination] = useState({ total: 0, page: 1, pages: 1 });

  const { location: currentLocation, getCurrentPosition, retry: retryLocation } = useGeoLocation({ 
    watch: true,
    enableHighAccuracy: true,
    timeout: 10000
  });
  const { jobs: myJobs, loadJobs: loadMyJobs, activeJob } = useJobTracking('garage', socket, isConnected);

  useEffect(() => {
    const path = routerLocation.pathname;
    if (path === '/my-jobs') {
      setActiveSection('myjobs');
    } else if (path === '/my-reviews') {
      setActiveSection('reviews');
    } else {
      setActiveSection('available');
    }
  }, [routerLocation.pathname]);

  // Register garage online with location when toggled on
  useEffect(() => {
    if (isOnline && socket && isConnected && currentLocation) {
      console.log('Registering garage online with location:', currentLocation);
      socket.emit('garage_online', {
        garageId: garageProfile?._id,
        location: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude
        }
      });
    }
    
    if (!isOnline && socket && isConnected) {
      console.log('Registering garage offline');
      socket.emit('garage_offline');
    }
  }, [isOnline, socket, isConnected, currentLocation, garageProfile]);

  // Send periodic location updates when online and not on an active job
  useEffect(() => {
    if (!isOnline || !socket || !isConnected || !currentLocation) return;
    
    const interval = setInterval(() => {
      socket.emit('garage_location_update', {
        garageId: garageProfile?._id,
        location: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude
        }
      });
    }, 10000); // Update every 10 seconds
    
    return () => clearInterval(interval);
  }, [isOnline, socket, isConnected, currentLocation, garageProfile]);

  // Start location sharing for active job when en route
  useEffect(() => {
    // Clear existing interval
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
      isLocationSharingRef.current = false;
    }

    // Start sharing location if garage has an active job that is en route or in progress
    if (activeJob && socket && isConnected && ['en_route', 'in_progress'].includes(activeJob.status) && !isLocationSharingRef.current) {
      console.log('Starting location sharing for job:', activeJob._id);
      isLocationSharingRef.current = true;
      
      // Get initial location
      getCurrentPosition();
      
      // Share location every 5 seconds
      locationIntervalRef.current = setInterval(() => {
        if (currentLocation && socket && isConnected && activeJob) {
          socket.emit('garage_location_share', {
            jobId: activeJob._id,
            location: {
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              coordinates: currentLocation.coordinates
            }
          });
          console.log('Location shared for job:', activeJob._id);
        } else if (!currentLocation && activeJob) {
          console.log('No location available, retrying...');
          retryLocation();
        }
      }, 5000);
    }

    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
        isLocationSharingRef.current = false;
      }
    };
  }, [activeJob, socket, isConnected, currentLocation, getCurrentPosition, retryLocation]);

  // Load reviews when on reviews tab
  useEffect(() => {
    if (activeSection === 'reviews') {
      loadReviews();
    }
  }, [activeSection, reviewsPagination.page]);

  useEffect(() => {
    loadAvailableJobs();
    loadMyJobs();
    if (garageProfile) {
      setIsOnline(garageProfile.isOnline);
    }
    getCurrentPosition();
  }, []);

  // Socket listeners for real-time alerts
  useEffect(() => {
    if (!socket || !isConnected) return;

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

    socket.on('job_taken', ({ jobId, garageId }) => {
      console.log(`Job ${jobId} taken by another garage`);
      loadAvailableJobs();
      if (newJobAlert && newJobAlert._id === jobId) {
        setNewJobAlert(null);
      }
    });

    return () => {
      socket.off('new_job_alert');
      socket.off('job_status_update');
      socket.off('job_taken');
    };
  }, [socket, isConnected]);

  const loadAvailableJobs = async () => {
    try {
      const response = await garage.getAvailableJobs({ limit: 20 });
      setAvailableJobs(response.data.jobs);
    } catch (err) {
      console.error('Failed to load available jobs:', err);
    }
  };

  const loadReviews = async () => {
    setReviewsLoading(true);
    try {
      const response = await garage.getMyReviews({ 
        limit: 20, 
        page: reviewsPagination.page 
      });
      setReviews(response.data.reviews);
      setRatingDistribution(response.data.ratingDistribution || []);
      setReviewsPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      }));
    } catch (err) {
      console.error('Failed to load reviews:', err);
      setError('Failed to load customer reviews');
    } finally {
      setReviewsLoading(false);
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
      console.error('Accept job error:', err);
      setError(err.response?.data?.error || 'Failed to accept job. Please try again.');
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
      console.error('Status update error:', err);
      setError(err.response?.data?.error || 'Failed to update job status');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseAlert = () => {
    setNewJobAlert(null);
  };

  // Render star rating
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - Math.ceil(rating);
    
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <FaStar key={`full-${i}`} className="h-3 w-3 text-yellow-500" />
        ))}
        {hasHalfStar && <FaStarHalfAlt className="h-3 w-3 text-yellow-500" />}
        {[...Array(emptyStars)].map((_, i) => (
          <FaRegStar key={`empty-${i}`} className="h-3 w-3 text-gray-300" />
        ))}
      </div>
    );
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
                {activeSection === 'available' && ' Emergency Rescue Requests'}
                {activeSection === 'myjobs' && ' My Assigned Jobs'}
                {activeSection === 'reviews' && ' Customer Reviews'}
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
                  <BiCurrentLocation className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">
                  {activeJob.status === 'accepted' && '📍 Location sharing will start when you mark as En Route'}
                  {activeJob.status === 'en_route' && '📍 Location sharing active - Client can see your location'}
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

      {/* Navigation Map - Shows during active job with client location */}
      {activeJob && activeJob.status !== 'completed' && activeJob.clientLocation && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="mb-3 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-900">Navigation Guide</h3>
                <p className="text-xs text-gray-500">Follow the route to reach the client</p>
              </div>
              {activeJob.status === 'en_route' && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full animate-pulse">
                  <FaCar className="inline mr-1 h-3 w-3" /> En Route
                </span>
              )}
            </div>
            
            <GarageMap
              clientLocation={activeJob.clientLocation}
              garageLocation={currentLocation}
              onRouteCalculated={(info) => setNavigationInfo(info)}
            />
            
            {/* Quick Directions */}
            {navigationInfo && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <FaInfoCircle className="h-5 w-5" />
                  <span>
                    Drive approximately <strong>{navigationInfo.distance} km</strong> - 
                    Estimated <strong>{navigationInfo.duration} minutes</strong>
                  </span>
                </div>
                <p className="text-xs text-blue-600 mt-1 ml-7">
                  Use the map above for turn-by-turn directions
                </p>
              </div>
            )}
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
                  ? <><HiOutlineStatusOnline className="inline mr-1" /> You are online. Real-time job alerts are active.</>
                  : <><HiOutlineStatusOffline className="inline mr-1" /> You are offline. Go online to receive emergency requests.</>
                }
              </p>
            </div>
            <div className={`text-2xl ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
              {isOnline ? <HiOutlineStatusOnline /> : <HiOutlineStatusOffline />}
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

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveSection('available')}
            className={`px-6 py-3 font-medium rounded-t-lg transition-all whitespace-nowrap ${
              activeSection === 'available'
                ? 'text-red-600 border-b-2 border-red-600 bg-white'
                : 'text-gray-600 hover:text-red-600 hover:border-b-2 hover:border-red-300'
            }`}
          >
             Available Jobs ({availableJobs.length})
            {newJobAlert && <span className="ml-2 w-2 h-2 bg-red-500 rounded-full inline-block animate-pulse"></span>}
          </button>
          <button
            onClick={() => setActiveSection('myjobs')}
            className={`px-6 py-3 font-medium rounded-t-lg transition-all whitespace-nowrap ${
              activeSection === 'myjobs'
                ? 'text-red-600 border-b-2 border-red-600 bg-white'
                : 'text-gray-600 hover:text-red-600 hover:border-b-2 hover:border-red-300'
            }`}
          >
             My Jobs ({myJobs.length})
          </button>
          <button
            onClick={() => setActiveSection('reviews')}
            className={`px-6 py-3 font-medium rounded-t-lg transition-all whitespace-nowrap flex items-center gap-2 ${
              activeSection === 'reviews'
                ? 'text-red-600 border-b-2 border-red-600 bg-white'
                : 'text-gray-600 hover:text-red-600 hover:border-b-2 hover:border-red-300'
            }`}
          >
            <MdRateReview className="h-4 w-4" /> My Reviews ({reviewsPagination.total})
          </button>
        </div>

        {/* Available Jobs Section */}
        {activeSection === 'available' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Emergency Rescue Requests</h2>
            
            {!isOnline && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-700"><FaExclamationTriangle className="inline mr-1" /> You are offline. Go online to accept emergency requests and receive real-time alerts.</p>
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

        {/* My Reviews Section */}
        {activeSection === 'reviews' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FaStar className="h-5 w-5 text-yellow-500" /> Customer Reviews
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  See what customers are saying about your service
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-gray-900">{garageProfile?.rating || 0}</span>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-0.5">
                      {renderStars(garageProfile?.rating || 0)}
                    </div>
                    <span className="text-xs text-gray-500">{reviewsPagination.total} reviews</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rating Distribution */}
            {ratingDistribution.length > 0 && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <FaChartBar className="h-4 w-4" /> Rating Distribution
                </h3>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map(star => {
                    const dist = ratingDistribution.find(d => d._id === star);
                    const count = dist?.count || 0;
                    const percentage = reviewsPagination.total > 0 
                      ? (count / reviewsPagination.total) * 100 
                      : 0;
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <div className="flex items-center gap-1 w-12">
                          <span className="text-xs font-medium text-gray-600">{star}</span>
                          <FaStar className="h-3 w-3 text-yellow-500" />
                        </div>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-yellow-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="w-12 text-xs text-gray-500">{count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Reviews List */}
            {reviewsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading reviews...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MdRateReview className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p>No reviews yet</p>
                <p className="text-sm mt-1">Reviews will appear here once customers rate your service</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review._id} className="border rounded-lg p-4 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <FaUser className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{review.clientId?.fullName || 'Anonymous'}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <FaCalendarAlt className="h-3 w-3" />
                            <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    {review.comment && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start gap-2">
                          <FaComment className="h-4 w-4 text-gray-400 mt-0.5" />
                          <p className="text-sm text-gray-600 italic">"{review.comment}"</p>
                        </div>
                      </div>
                    )}
                    {review.jobId && (
                      <div className="mt-2 text-xs text-gray-400">
                        Service: {review.jobId.serviceType?.replace('_', ' ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {reviewsPagination.pages > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                <button
                  onClick={() => setReviewsPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={reviewsPagination.page === 1}
                  className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-600">
                  Page {reviewsPagination.page} of {reviewsPagination.pages}
                </span>
                <button
                  onClick={() => setReviewsPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                  disabled={reviewsPagination.page === reviewsPagination.pages}
                  className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GarageDashboard;