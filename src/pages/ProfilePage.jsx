import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { client, garage } from '../services/api';
import useForm from '../hooks/useForm';

const ProfilePage = () => {
  const { user, garage: garageProfile, isClient, isGarage } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  // Profile form
  const { values: profileValues, handleChange: handleProfileChange, setFieldValue: setProfileField, handleSubmit: handleProfileSubmit } = useForm({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Garage profile form
  const { values: garageValues, handleChange: handleGarageChange, setFieldValue: setGarageField, handleSubmit: handleGarageSubmit } = useForm({
    businessName: garageProfile?.businessName || '',
    businessPhone: garageProfile?.businessPhone || '',
    address: garageProfile?.address || '',
  });

  // Notification preferences form
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    jobAssigned: true,
    jobStatusUpdate: true,
    promotionalOffers: false,
  });
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(false);

  // Load notification preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await client.getNotificationPreferences();
        setNotifications(response.data.preferences);
      } catch (err) {
        console.error('Failed to load preferences:', err);
      }
    };
    if (isClient) {
      loadPreferences();
    }
  }, [isClient]);

  const handleUpdateProfile = async () => {
    if (profileValues.newPassword && profileValues.newPassword !== profileValues.confirmPassword) {
      setError('New passwords do not match');
      return false;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const updateData = {
        fullName: profileValues.fullName,
        phone: profileValues.phone,
        email: profileValues.email,
      };
      
      if (profileValues.newPassword) {
        updateData.password = profileValues.newPassword;
      }

      if (isClient) {
        await client.updateProfile(updateData);
      } else if (isGarage) {
        await garage.updateProfile(updateData);
      }

      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
      setTimeout(() => setError(''), 3000);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateGarageProfile = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await garage.updateProfile(garageValues);
      setSuccess('Garage profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update garage profile');
      setTimeout(() => setError(''), 3000);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateNotifications = async () => {
    setIsLoadingPrefs(true);
    try {
      await client.updateNotificationPreferences(notifications);
      setSuccess('Notification preferences updated');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update preferences');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoadingPrefs(false);
    }
  };

  const handleNotificationChange = (key, value) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-sm text-gray-500">Manage your profile and preferences</p>
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
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 font-medium rounded-t-lg transition-all ${
              activeTab === 'profile'
                ? 'text-red-600 border-b-2 border-red-600 bg-white'
                : 'text-gray-600 hover:text-red-600 hover:border-b-2 hover:border-red-300'
            }`}
          >
             Profile
          </button>
          {isGarage && (
            <button
              onClick={() => setActiveTab('garage')}
              className={`px-6 py-3 font-medium rounded-t-lg transition-all ${
                activeTab === 'garage'
                  ? 'text-red-600 border-b-2 border-red-600 bg-white'
                  : 'text-gray-600 hover:text-red-600 hover:border-b-2 hover:border-red-300'
              }`}
            >
               Garage Info
            </button>
          )}
          <button
            onClick={() => setActiveTab('security')}
            className={`px-6 py-3 font-medium rounded-t-lg transition-all ${
              activeTab === 'security'
                ? 'text-red-600 border-b-2 border-red-600 bg-white'
                : 'text-gray-600 hover:text-red-600 hover:border-b-2 hover:border-red-300'
            }`}
          >
             Security
          </button>
          {isClient && (
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-6 py-3 font-medium rounded-t-lg transition-all ${
                activeTab === 'notifications'
                  ? 'text-red-600 border-b-2 border-red-600 bg-white'
                  : 'text-gray-600 hover:text-red-600 hover:border-b-2 hover:border-red-300'
              }`}
            >
               Notifications
            </button>
          )}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
            
            <form onSubmit={(e) => { e.preventDefault(); handleProfileSubmit(handleUpdateProfile); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={profileValues.fullName}
                    onChange={handleProfileChange}
                    className="input-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileValues.phone}
                    onChange={handleProfileChange}
                    className="input-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profileValues.email}
                    onChange={handleProfileChange}
                    className="input-primary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary px-6 py-2"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Garage Info Tab */}
        {activeTab === 'garage' && isGarage && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h2>
            
            <form onSubmit={(e) => { e.preventDefault(); handleGarageSubmit(handleUpdateGarageProfile); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Name
                  </label>
                  <input
                    type="text"
                    name="businessName"
                    value={garageValues.businessName}
                    onChange={handleGarageChange}
                    className="input-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Phone
                  </label>
                  <input
                    type="tel"
                    name="businessPhone"
                    value={garageValues.businessPhone}
                    onChange={handleGarageChange}
                    className="input-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={garageValues.address}
                    onChange={handleGarageChange}
                    className="input-primary"
                  />
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">License Number:</span> {garageProfile?.licenseNumber}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Verification Status:</span>{' '}
                    {garageProfile?.isVerified ? (
                      <span className="text-green-600">✓ Verified</span>
                    ) : (
                      <span className="text-yellow-600">Pending Verification</span>
                    )}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary px-6 py-2"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
            
            <form onSubmit={(e) => { e.preventDefault(); handleProfileSubmit(handleUpdateProfile); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={profileValues.newPassword}
                    onChange={handleProfileChange}
                    className="input-primary"
                    placeholder="Minimum 6 characters"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={profileValues.confirmPassword}
                    onChange={handleProfileChange}
                    className="input-primary"
                    placeholder="Confirm your new password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary px-6 py-2"
                >
                  {isLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && isClient && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h2>
            <p className="text-sm text-gray-500 mb-4">Choose how you want to be notified</p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Email Notifications</p>
                  <p className="text-xs text-gray-500">Receive updates via email</p>
                </div>
                <button
                  onClick={() => handleNotificationChange('emailNotifications', !notifications.emailNotifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications.emailNotifications ? 'bg-red-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">SMS Notifications</p>
                  <p className="text-xs text-gray-500">Receive text message alerts</p>
                </div>
                <button
                  onClick={() => handleNotificationChange('smsNotifications', !notifications.smsNotifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications.smsNotifications ? 'bg-red-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications.smsNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Job Status Updates</p>
                  <p className="text-xs text-gray-500">Get notified when job status changes</p>
                </div>
                <button
                  onClick={() => handleNotificationChange('jobStatusUpdate', !notifications.jobStatusUpdate)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications.jobStatusUpdate ? 'bg-red-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications.jobStatusUpdate ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Promotional Offers</p>
                  <p className="text-xs text-gray-500">Receive special offers and discounts</p>
                </div>
                <button
                  onClick={() => handleNotificationChange('promotionalOffers', !notifications.promotionalOffers)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications.promotionalOffers ? 'bg-red-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications.promotionalOffers ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <button
                onClick={handleUpdateNotifications}
                disabled={isLoadingPrefs}
                className="mt-4 btn-primary px-6 py-2"
              >
                {isLoadingPrefs ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;