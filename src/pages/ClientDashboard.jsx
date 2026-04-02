import React, { useState, useEffect } from 'react';
import { useLocation as useRouterLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { client } from '../services/api';
import useGeoLocation from '../hooks/useLocation';
import useJobTracking from '../hooks/useJobTracking';
import useForm from '../hooks/useForm';
import ServiceSelector from '../components/client/ServiceSelector';
import LocationPicker from '../components/client/LocationPicker';
import JobCard from '../components/client/JobCard';
import ReviewModal from '../components/common/ReviewModal';
import LiveMap from '../components/common/LiveMap';
import { 
  FaHourglassHalf, FaCheckCircle, FaCar, FaWrench, FaPartyPopper, FaTimesCircle, 
  FaClipboardList, FaMapMarkerAlt, FaPhoneAlt, FaStar, FaInfoCircle, FaExclamationTriangle 
} from 'react-icons/fa';

const ClientDashboard = () => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const routerLocation = useRouterLocation();
  const [activeSection, setActiveSection] = useState('request');
  const [nearbyGarages, setNearbyGarages] = useState([]);
  const [selectedJobForReview, setSelectedJobForReview] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [garageLocation, setGarageLocation] = useState(null);
  const [etaInfo, setEtaInfo] = useState(null);
  const [hasLoadedLocation, setHasLoadedLocation] = useState(false);

  const { location: userLocation, getCurrentPosition } = useGeoLocation({ watch: true });
  const { jobs, activeJob, loadJobs, setActiveJob } = useJobTracking('client', socket, isConnected);

  const { values, handleChange, handleSubmit, isSubmitting, setFieldValue } = useForm({
    serviceType: 'tire_change',
    clientAddress: '',
    notes: '',
    clientLocation: { coordinates: [36.8219, -1.2921] }
  });

  useEffect(() => {
    const path = routerLocation.pathname;
    if (path === '/history') {
      setActiveSection('history');
    } else if (path === '/garages') {
      setActiveSection('garages');
    } else {
      setActiveSection('request');
    }
  }, [routerLocation.pathname]);

  useEffect(() => {
    if (userLocation && !hasLoadedLocation) {
      setFieldValue('clientLocation', { coordinates: userLocation.coordinates });
      loadNearbyGarages(userLocation.latitude, userLocation.longitude);
      setHasLoadedLocation(true);
    }
  }, [userLocation, hasLoadedLocation]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleGarageLocation = ({ jobId, location }) => {
      if (activeJob && activeJob._id === jobId) {
        setGarageLocation(location);
        console.log('Garage location update received:', location);
      }
    };

    const handleJobStatusUpdate = (updatedJob) => {
      console.log('Job status update received:', updatedJob);
      if (activeJob && activeJob._id === updatedJob._id) {
        setActiveJob(updatedJob);
        
        const statusMessages = {
          accepted: ' Your rescue request has been accepted! A garage is on their way.',
          en_route: ' The garage is en route to your location!',
          in_progress: ' The mechanic has arrived and is working on your vehicle.',
          completed: ' Your rescue is complete! Please rate your experience.'
        };
        
        if (statusMessages[updatedJob.status]) {
          setSuccess(statusMessages[updatedJob.status]);
          setTimeout(() => setSuccess(''), 5000);
        }
      }
      loadJobs();
    };

    socket.on('garage_location_update', handleGarageLocation);
    socket.on('job_status_update', handleJobStatusUpdate);

    return () => {
      socket.off('garage_location_update', handleGarageLocation);
      socket.off('job_status_update', handleJobStatusUpdate);
    };
  }, [socket, isConnected, activeJob, loadJobs, setActiveJob]);

  useEffect(() => {
    getCurrentPosition();
  }, []);

  const loadNearbyGarages = async (lat, lng) => {
    try {
      const response = await client.getNearbyGarages(lat, lng, 10);
      setNearbyGarages(response.data.garages);
    } catch (err) {
      console.error('Failed to load nearby garages:', err);
    }
  };

  const onSubmitJob = async () => {
    if (!values.clientAddress) {
      setError('Please enter your location address');
      return false;
    }

    try {
      const response = await client.createJob(values);
      setSuccess('Job request created successfully! A nearby garage will respond shortly.');
      setFieldValue('notes', '');
      loadJobs();
      
      if (socket && isConnected) {
        socket.emit('new_job', response.data.job);
        console.log('New job emitted to server:', response.data.job._id);
      }
      
      setTimeout(() => setSuccess(''), 5000);
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create job request');
      setTimeout(() => setError(''), 5000);
      return false;
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

  const getStatusIcon = (status) => {
    const icons = {
      pending: <FaHourglassHalf className="text-4xl" />,
      accepted: <FaCheckCircle className="text-4xl text-green-500" />,
      en_route: <FaCar className="text-4xl text-blue-500" />,
      in_progress: <FaWrench className="text-4xl text-orange-500" />,
      completed: <FaPartyPopper className="text-4xl text-green-500" />,
      cancelled: <FaTimesCircle className="text-4xl text-red-500" />
    };
    return icons[status] || <FaClipboardList className="text-4xl" />;
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="animate-pulse">
                  <FaExclamationTriangle className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-lg font-bold">Emergency Rescue in Progress</p>
                  <p className="text-sm opacity-90">Status: {getStatusText(activeJob.status)}</p>
                </div>
              </div>
              {activeJob.garageId && (
                <div className="text-left md:text-right">
                  <p className="font-medium">Assigned Garage</p>
                  <p className="text-sm opacity-90">
                    {typeof activeJob.garageId === 'object' ? activeJob.garageId.businessName : 'Garage Assigned'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Live Map Section - Shows during active job */}
      {activeJob && activeJob.status !== 'completed' && userLocation && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="mb-3 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-900">Live Tracking</h3>
                <p className="text-xs text-gray-500">Track your rescue vehicle in real-time</p>
              </div>
              {garageLocation && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full animate-pulse">
                  <FaCar className="inline mr-1 h-3 w-3" /> Vehicle en route
                </span>
              )}
            </div>
            
            <LiveMap
              clientLocation={userLocation}
              garageLocation={garageLocation}
              isActive={true}
              onRouteCalculated={(info) => setEtaInfo(info)}
            />
            
            {/* ETA Message */}
            {etaInfo && garageLocation && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <FaInfoCircle className="h-5 w-5 animate-pulse" />
                  <span>
                    Garage is <strong>{etaInfo.distance} km</strong> away - 
                    Estimated arrival in <strong>{etaInfo.duration} minutes</strong>
                  </span>
                </div>
                <p className="text-xs text-blue-600 mt-1 ml-7">
                  The driver is following the optimal route to reach you
                </p>
              </div>
            )}
            
            {!garageLocation && activeJob.status === 'accepted' && (
              <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-yellow-800">
                  <FaCar className="h-5 w-5" />
                  <span>Garage has accepted your request and will start moving shortly</span>
                </div>
              </div>
            )}
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
                <div className="mb-4">{getStatusIcon(activeJob.status)}</div>
                <h3 className="text-lg font-semibold text-gray-900">Active Rescue Request</h3>
                <p className="text-gray-600 mt-2">
                  Status: <span className={`font-medium ${activeJob.status === 'pending' ? 'text-yellow-600' : 'text-red-600'}`}>
                    {getStatusText(activeJob.status)}
                  </span>
                </p>
                <p className="text-gray-500 text-sm mt-4">
                  Your request is being processed. You can track the garage's location on the map above.
                </p>
                <button
                  onClick={() => window.location.href = '/history'}
                  className="mt-4 btn-outline"
                >
                  View Active Request
                </button>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmitJob); }}>
                <ServiceSelector
                  value={values.serviceType}
                  onChange={(val) => setFieldValue('serviceType', val)}
                />
                
                <div className="mt-4">
                  <LocationPicker
                    address={values.clientAddress}
                    onAddressChange={(val) => setFieldValue('clientAddress', val)}
                    onCoordinatesChange={(coords) => setFieldValue('clientLocation', coords)}
                  />
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    value={values.notes}
                    onChange={handleChange}
                    rows="3"
                    placeholder="e.g., Car is a white Toyota Fielder, near the Total petrol station"
                    className="input-primary resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3 mt-6"
                >
                  {isSubmitting ? (
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
              <h3 className="font-medium text-red-800 mb-2"><FaExclamationTriangle className="inline mr-1" /> Emergency Tips</h3>
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
                  <JobCard
                    key={job._id}
                    job={job}
                    onReview={openReviewModal}
                  />
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
                        <p className="text-sm text-gray-600 mt-1"><FaMapMarkerAlt className="inline mr-1 h-3 w-3" /> {garage.address}</p>
                        <p className="text-sm text-gray-600"><FaPhoneAlt className="inline mr-1 h-3 w-3" /> {garage.businessPhone}</p>
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
                          <FaStar className="h-4 w-4 text-yellow-500" />
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