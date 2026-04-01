import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { admin } from '../services/api';
import useForm from '../hooks/useForm';
import useDebounce from '../hooks/useDebounce';

const AdminDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [garages, setGarages] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
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
    if (debouncedSearch) {
      filterData();
    } else {
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

  const handleDeleteJob = async (jobId, reason = '') => {
    if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) return;

    setIsLoading(true);
    try {
      await admin.deleteJob(jobId, { reason });
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

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) return;

    setIsLoading(true);
    try {
      await admin.deleteReview(reviewId);
      setSuccess('Review deleted successfully');
      loadJobs(); // Reload to update job status
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete review');
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div className="bg-gradient-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div>
            <h1 className="text-2xl font-bold">
              {activeSection === 'stats' && ' Admin Dashboard'}
              {activeSection === 'users' && ' User Management'}
              {activeSection === 'garages' && ' Garage Management'}
              {activeSection === 'jobs' && ' Job Management'}
              {activeSection === 'vehicles' && ' Vehicle Management'}
            </h1>
            <p className="text-sm text-red-100">Welcome, {user?.fullName}</p>
          </div>
        </div>
      </div>

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

        {/* Search Bar for Data Sections */}
        {(activeSection === 'users' || activeSection === 'garages') && (
          <div className="mb-6">
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
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

        {/* Stats Section */}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
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
                          {userItem.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => toggleUserStatus(userItem._id, userItem.isActive)}
                          disabled={isLoading || userItem.role === 'admin'}
                          className={`px-3 py-1 rounded text-xs font-medium transition-all ${userItem.isActive
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                            } ${(isLoading || userItem.role === 'admin') && 'opacity-50 cursor-not-allowed'}`}
                        >
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
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
                          {garageItem.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${garageItem.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
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

        {/* Jobs Section */}
        {activeSection === 'jobs' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Garage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
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
                          className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Vehicles Section */}
        {activeSection === 'vehicles' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License Plate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Make & Model</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
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
                        {vehicle.isDefault ? '✓ Yes' : 'No'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${vehicle.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {vehicle.isActive ? 'Active' : 'Deleted'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDeleteVehicle(vehicle._id)}
                          disabled={isLoading}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;