import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { admin } from '../services/api';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [garages, setGarages] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load data based on active tab
  useEffect(() => {
    loadStats();
    loadUsers();
    loadGarages();
    loadJobs();
    loadVehicles();
  }, []);

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
      garage: 'bg-green-100 text-green-800',
      client: 'bg-blue-100 text-blue-800'
    };
    return badges[role] || 'bg-gray-100 text-gray-800';
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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-purple-600 text-white sticky top-0 z-10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Roadside Rescue - Admin</h1>
              <p className="text-sm text-purple-100">Welcome, {user?.fullName}</p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 rounded-lg text-sm font-medium transition-colors"
            >
              Logout
            </button>
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

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-3 font-medium rounded-t-lg transition-colors whitespace-nowrap ${
              activeTab === 'stats'
                ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📊 Dashboard Stats
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 font-medium rounded-t-lg transition-colors whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            👥 Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('garages')}
            className={`px-6 py-3 font-medium rounded-t-lg transition-colors whitespace-nowrap ${
              activeTab === 'garages'
                ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🏪 Garages ({garages.length})
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-6 py-3 font-medium rounded-t-lg transition-colors whitespace-nowrap ${
              activeTab === 'jobs'
                ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📋 Jobs ({jobs.length})
          </button>
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`px-6 py-3 font-medium rounded-t-lg transition-colors whitespace-nowrap ${
              activeTab === 'vehicles'
                ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🚗 Vehicles ({vehicles.length})
          </button>
        </div>

        {/* Stats Tab */}
        {activeTab === 'stats' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.users?.total || 0}</p>
                </div>
                <div className="text-4xl">👥</div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <span>Clients: {stats.users?.clients || 0}</span>
                <span className="ml-4">Garages: {stats.users?.garages || 0}</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Garages</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.garages?.total || 0}</p>
                </div>
                <div className="text-4xl">🏪</div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <span>Active: {stats.garages?.active || 0}</span>
                <span className="ml-4">Verified: {stats.garages?.verified || 0}</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Jobs</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.jobs?.total || 0}</p>
                </div>
                <div className="text-4xl">📋</div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <span>Completed: {stats.jobs?.completed || 0}</span>
                <span className="ml-4">Pending: {stats.jobs?.pending || 0}</span>
              </div>
              <div className="mt-2 text-sm text-green-600">
                Completion Rate: {stats.jobs?.completionRate || 0}%
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Average Rating</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.averageRating || 0}</p>
                </div>
                <div className="text-4xl">⭐</div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                Based on all reviews
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
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
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            userItem.isActive 
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

        {/* Garages Tab */}
        {activeTab === 'garages' && (
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
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            garageItem.isVerified 
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

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
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
                          {jobItem.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(jobItem.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Vehicles Tab */}
        {activeTab === 'vehicles' && (
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