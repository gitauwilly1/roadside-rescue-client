import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { admin } from '../services/api';
import useDebounce from '../hooks/useDebounce';
import AnalyticsCards from '../components/admin/AnalyticsCards';
import {
  FaChartLine, FaUsers, FaBuilding, FaClipboardList, FaCar,
  FaSearch, FaUser, FaPhone, FaEnvelope, FaToggleOn, FaToggleOff,
  FaCheckCircle, FaTimesCircle, FaTrash, FaUserCheck, FaUserTimes,
  FaStar, FaCalendarAlt, FaLicense, FaMapMarkerAlt, FaStarHalfAlt,
  FaRegStar, FaComment, FaFilter
} from 'react-icons/fa';
import { MdVerified, MdPending, MdRateReview } from 'react-icons/md';

const AdminDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [garages, setGarages] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [reviewsPagination, setReviewsPagination] = useState({ total: 0, page: 1, pages: 1, limit: 20 });
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    const path = location.pathname;
    if (path === '/users') {
      setActiveSection('users');
    } else if (path === '/admin/garages') {
      setActiveSection('garages');
    } else if (path === '/jobs') {
      setActiveSection('jobs');
    } else if (path === '/vehicles') {
      setActiveSection('vehicles');
    } else if (path === '/reviews') {
      setActiveSection('reviews');
    } else {
      setActiveSection('stats');
    }
  }, [location.pathname]);

  useEffect(() => {
    loadStats();
    loadUsers();
    loadGarages();
    loadJobs();
    loadVehicles();
  }, []);

  useEffect(() => {
    if (activeSection === 'reviews') {
      loadReviews();
    }
  }, [activeSection, reviewsPagination.page, ratingFilter]);

  useEffect(() => {
    if (debouncedSearch) {
      filterData();
    } else if (activeSection !== 'reviews') {
      loadUsers();
      loadGarages();
      loadJobs();
      loadVehicles();
    }
  }, [debouncedSearch]);

  const loadStats = async () => {
    try {
      const response = await admin.getStats();
      setStats(response.data.stats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await admin.getUsers({ limit: 100 });
      setUsers(response.data.users);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const loadGarages = async () => {
    try {
      const response = await admin.getGarages({ limit: 100 });
      setGarages(response.data.garages);
    } catch (err) {
      console.error('Failed to load garages:', err);
    }
  };

  const loadJobs = async () => {
    try {
      const response = await admin.getJobs({ limit: 100 });
      setJobs(response.data.jobs);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    }
  };

  const loadVehicles = async () => {
    try {
      const response = await admin.getVehicles();
      setVehicles(response.data.vehicles);
    } catch (err) {
      console.error('Failed to load vehicles:', err);
    }
  };

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      const params = {
        limit: reviewsPagination.limit,
        page: reviewsPagination.page
      };
      if (ratingFilter) params.rating = ratingFilter;

      const response = await admin.getReviews(params);
      setReviews(response.data.reviews);
      setReviewsPagination({
        total: response.data.pagination.total,
        page: response.data.pagination.page,
        pages: response.data.pagination.pages,
        limit: response.data.pagination.limit
      });
    } catch (err) {
      console.error('Failed to load reviews:', err);
      setError('Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) return;

    setIsLoading(true);
    try {
      await admin.deleteReview(reviewId);
      setSuccess('Review deleted successfully');
      loadReviews();
      loadStats(); // Refresh stats to update average rating
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete review');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const filterData = () => {
    if (activeSection === 'users') {
      const filtered = users.filter(user =>
        user.fullName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        user.phone?.includes(debouncedSearch) ||
        user.email?.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
      setUsers(filtered);
    } else if (activeSection === 'garages') {
      const filtered = garages.filter(garage =>
        garage.businessName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        garage.businessPhone?.includes(debouncedSearch) ||
        garage.address?.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
      setGarages(filtered);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    setIsLoading(true);
    try {
      await admin.updateUser(userId, { isActive: !currentStatus });
      setSuccess(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyGarage = async (garageId, isVerified) => {
    setIsLoading(true);
    try {
      await admin.verifyGarage(garageId, !isVerified);
      setSuccess(`Garage ${!isVerified ? 'verified' : 'unverified'} successfully`);
      loadGarages();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to verify garage');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) return;

    setIsLoading(true);
    try {
      await admin.deleteJob(jobId);
      setSuccess('Job deleted successfully');
      loadJobs();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete job');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (!window.confirm('Are you sure you want to permanently delete this vehicle? This action cannot be undone.')) return;

    setIsLoading(true);
    try {
      await admin.deleteVehicle(vehicleId);
      setSuccess('Vehicle deleted successfully');
      loadVehicles();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete vehicle');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'bg-purple-100 text-purple-800',
      garage: 'bg-red-100 text-red-800',
      client: 'bg-blue-100 text-blue-800'
    };
    return badges[role] || 'bg-gray-100 text-gray-800';
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

  // Render star rating for display
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
      {/* Header Banner */}
      <div className="bg-gradient-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {activeSection === 'stats' && <><FaChartLine className="inline" /> Admin Dashboard</>}
              {activeSection === 'users' && <><FaUsers className="inline" /> User Management</>}
              {activeSection === 'garages' && <><FaBuilding className="inline" /> Garage Management</>}
              {activeSection === 'jobs' && <><FaClipboardList className="inline" /> Job Management</>}
              {activeSection === 'vehicles' && <><FaCar className="inline" /> Vehicle Management</>}
              {activeSection === 'reviews' && <><MdRateReview className="inline" /> Review Management</>}
            </h1>
            <p className="text-sm text-red-100">Welcome, {user?.fullName}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            onClick={() => setActiveSection('stats')}
            className={`px-6 py-3 font-medium rounded-t-lg transition-all whitespace-nowrap flex items-center gap-2 ${activeSection === 'stats'
                ? 'text-red-600 border-b-2 border-red-600 bg-white'
                : 'text-gray-600 hover:text-red-600 hover:border-b-2 hover:border-red-300'
              }`}
          >
            <FaChartLine /> Dashboard
          </button>
          <button
            onClick={() => setActiveSection('users')}
            className={`px-6 py-3 font-medium rounded-t-lg transition-all whitespace-nowrap flex items-center gap-2 ${activeSection === 'users'
                ? 'text-red-600 border-b-2 border-red-600 bg-white'
                : 'text-gray-600 hover:text-red-600 hover:border-b-2 hover:border-red-300'
              }`}
          >
            <FaUsers /> Users
          </button>
          <button
            onClick={() => setActiveSection('garages')}
            className={`px-6 py-3 font-medium rounded-t-lg transition-all whitespace-nowrap flex items-center gap-2 ${activeSection === 'garages'
                ? 'text-red-600 border-b-2 border-red-600 bg-white'
                : 'text-gray-600 hover:text-red-600 hover:border-b-2 hover:border-red-300'
              }`}
          >
            <FaBuilding /> Garages
          </button>
          <button
            onClick={() => setActiveSection('jobs')}
            className={`px-6 py-3 font-medium rounded-t-lg transition-all whitespace-nowrap flex items-center gap-2 ${activeSection === 'jobs'
                ? 'text-red-600 border-b-2 border-red-600 bg-white'
                : 'text-gray-600 hover:text-red-600 hover:border-b-2 hover:border-red-300'
              }`}
          >
            <FaClipboardList /> Jobs
          </button>
          <button
            onClick={() => setActiveSection('vehicles')}
            className={`px-6 py-3 font-medium rounded-t-lg transition-all whitespace-nowrap flex items-center gap-2 ${activeSection === 'vehicles'
                ? 'text-red-600 border-b-2 border-red-600 bg-white'
                : 'text-gray-600 hover:text-red-600 hover:border-b-2 hover:border-red-300'
              }`}
          >
            <FaCar /> Vehicles
          </button>
          <button
            onClick={() => setActiveSection('reviews')}
            className={`px-6 py-3 font-medium rounded-t-lg transition-all whitespace-nowrap flex items-center gap-2 ${activeSection === 'reviews'
                ? 'text-red-600 border-b-2 border-red-600 bg-white'
                : 'text-gray-600 hover:text-red-600 hover:border-b-2 hover:border-red-300'
              }`}
          >
            <MdRateReview /> Reviews ({reviewsPagination.total})
          </button>
        </div>

        {/* Search Bar for Data Sections */}
        {(activeSection === 'users' || activeSection === 'garages') && (
          <div className="mb-6">
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={`Search ${activeSection === 'users' ? 'users by name, phone, or email' : 'garages by name, phone, or address'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>
        )}

        {/* Stats Section with Analytics */}
        {activeSection === 'stats' && stats && (
          <AnalyticsCards stats={stats} />
        )}

        {/* Users Section */}
        {activeSection === 'users' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><FaUser className="inline mr-1" /> Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><FaPhone className="inline mr-1" /> Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><FaEnvelope className="inline mr-1" /> Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((userItem) => (
                    <tr key={userItem._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{userItem.fullName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{userItem.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{userItem.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadge(userItem.role)}`}>
                          {userItem.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${userItem.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {userItem.isActive ? <FaCheckCircle className="inline mr-1 h-3 w-3" /> : <FaTimesCircle className="inline mr-1 h-3 w-3" />}
                          {userItem.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => toggleUserStatus(userItem._id, userItem.isActive)}
                          disabled={isLoading || userItem.role === 'admin'}
                          className={`px-3 py-1 rounded text-xs font-medium transition-all flex items-center gap-1 ${userItem.isActive
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                            } ${(isLoading || userItem.role === 'admin') && 'opacity-50 cursor-not-allowed'}`}
                        >
                          {userItem.isActive ? <FaUserTimes /> : <FaUserCheck />}
                          {userItem.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Garages Section */}
        {activeSection === 'garages' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><FaBuilding className="inline mr-1" /> Business Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><FaPhone className="inline mr-1" /> Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><FaMapMarkerAlt className="inline mr-1" /> Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verified</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {garages.map((garageItem) => (
                    <tr key={garageItem._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{garageItem.businessName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{garageItem.businessPhone}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{garageItem.address}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${garageItem.isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {garageItem.isOnline ? <FaToggleOn className="inline mr-1" /> : <FaToggleOff className="inline mr-1" />}
                          {garageItem.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${garageItem.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {garageItem.isVerified ? <MdVerified className="inline mr-1" /> : <MdPending className="inline mr-1" />}
                          {garageItem.isVerified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => verifyGarage(garageItem._id, garageItem.isVerified)}
                          disabled={isLoading}
                          className={`px-3 py-1 rounded text-xs font-medium transition-all ${garageItem.isVerified
                              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                            } ${isLoading && 'opacity-50 cursor-not-allowed'}`}
                        >
                          {garageItem.isVerified ? 'Unverify' : 'Verify'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Jobs Section with Delete */}
        {activeSection === 'jobs' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><FaClipboardList className="inline mr-1" /> Service</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><FaUser className="inline mr-1" /> Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><FaBuilding className="inline mr-1" /> Garage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><FaCalendarAlt className="inline mr-1" /> Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {jobs.map((jobItem) => (
                    <tr key={jobItem._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{jobItem.serviceType?.replace('_', ' ')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{jobItem.clientId?.fullName || 'Unknown'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{jobItem.garageId?.businessName || 'Not assigned'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(jobItem.status)}`}>
                          {getStatusText(jobItem.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(jobItem.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDeleteJob(jobItem._id)}
                          disabled={isLoading}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors flex items-center gap-1"
                        >
                          <FaTrash className="h-3 w-3" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Vehicles Section with Delete */}
        {activeSection === 'vehicles' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><FaCar className="inline mr-1" /> License Plate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><FaCar className="inline mr-1" /> Make & Model</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><FaUser className="inline mr-1" /> Owner</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vehicle.licensePlate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{vehicle.make} {vehicle.model}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{vehicle.clientId?.fullName || 'Unknown'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {vehicle.isDefault ? <FaCheckCircle className="inline text-green-500 mr-1" /> : <FaTimesCircle className="inline text-gray-400 mr-1" />}
                        {vehicle.isDefault ? 'Yes' : 'No'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${vehicle.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {vehicle.isActive ? <FaCheckCircle className="inline mr-1 h-3 w-3" /> : <FaTimesCircle className="inline mr-1 h-3 w-3" />}
                          {vehicle.isActive ? 'Active' : 'Deleted'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDeleteVehicle(vehicle._id)}
                          disabled={isLoading}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors flex items-center gap-1"
                        >
                          <FaTrash className="h-3 w-3" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reviews Section */}
        {activeSection === 'reviews' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <MdRateReview className="h-5 w-5 text-red-600" /> Review Management
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Manage and moderate customer reviews across the platform
                </p>
              </div>

              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors"
              >
                <FaFilter className="h-4 w-4 text-gray-500" />
                <span className="text-sm">Filter</span>
                {ratingFilter && <span className="ml-1 w-2 h-2 bg-red-500 rounded-full"></span>}
              </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Rating</label>
                    <select
                      value={ratingFilter}
                      onChange={(e) => {
                        setRatingFilter(e.target.value);
                        setReviewsPagination(prev => ({ ...prev, page: 1 }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">All Ratings</option>
                      <option value="5">5 Stars ★★★★★</option>
                      <option value="4">4 Stars ★★★★☆</option>
                      <option value="3">3 Stars ★★★☆☆</option>
                      <option value="2">2 Stars ★★☆☆☆</option>
                      <option value="1">1 Star ★☆☆☆☆</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setRatingFilter('');
                        setReviewsPagination(prev => ({ ...prev, page: 1 }));
                      }}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Reviews Table */}
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading reviews...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MdRateReview className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p>No reviews found</p>
                <p className="text-sm mt-1">Reviews will appear here once customers submit them</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Garage</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reviews.map((review) => (
                      <tr key={review._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            {renderStars(review.rating)}
                            <span className="ml-1 text-xs text-gray-500">({review.rating})</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{review.clientId?.fullName || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{review.clientId?.phone || 'No phone'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{review.garageId?.businessName || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{review.garageId?.businessPhone || 'No phone'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            <div className="flex items-start gap-1">
                              <FaComment className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-gray-600">
                                {review.comment ? (
                                  review.comment.length > 100 ? review.comment.substring(0, 100) + '...' : review.comment
                                ) : (
                                  <span className="text-gray-400 italic">No comment</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xs text-gray-500">
                            {review.jobId?.serviceType?.replace('_', ' ') || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleDeleteReview(review._id)}
                            disabled={isLoading}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors flex items-center gap-1"
                          >
                            <FaTrash className="h-3 w-3" /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

export default AdminDashboard;