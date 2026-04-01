import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signOutGoogle } from '../config/firebase';

const RegisterPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { register, googleLogin } = useAuth();

  // Check if coming from Google Sign-In
  const googleUser = location.state?.googleUser;
  const isGoogleSignUp = location.state?.isGoogleSignUp;

  const [formData, setFormData] = useState({
    fullName: googleUser?.fullName || '',
    phone: '',
    email: googleUser?.email || '',
    password: '',
    confirmPassword: '',
    role: 'client',
  });

  const [businessDetails, setBusinessDetails] = useState({
    businessName: '',
    licenseNumber: '',
    businessPhone: '',
    address: '',
    location: {
      coordinates: [36.8219, -1.2921]
    },
    services: []
  });

  const [showBusinessFields, setShowBusinessFields] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isGoogleUser, setIsGoogleUser] = useState(!!googleUser);

  // Pre-fill form with Google data if available
  useEffect(() => {
    if (googleUser && isGoogleSignUp) {
      setFormData(prev => ({
        ...prev,
        fullName: googleUser.fullName || '',
        email: googleUser.email || '',
      }));
      console.log('Google user data loaded:', googleUser.email);
    }
  }, [googleUser, isGoogleSignUp]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBusinessChange = (e) => {
    const { name, value } = e.target;
    setBusinessDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (role) => {
    setFormData(prev => ({ ...prev, role }));
    setShowBusinessFields(role === 'garage');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isGoogleUser) {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
    }

    setIsLoading(true);
    setError('');

    if (isGoogleUser && googleUser) {
      const result = await googleLogin(googleUser.idToken, {
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        role: formData.role,
        businessDetails: formData.role === 'garage' ? businessDetails : undefined,
      });

      if (result.success) {
        navigate('/');
      } else {
        setError(result.error);
      }
    } else {
      const userData = {
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
      };

      const businessData = formData.role === 'garage' ? businessDetails : null;

      const result = await register(userData, businessData);

      if (result.success) {
        navigate('/');
      } else {
        setError(result.error);
      }
    }

    setIsLoading(false);
  };

  const handleSkipGoogleSignUp = () => {
    setIsGoogleUser(false);
    setFormData(prev => ({
      ...prev,
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    }));
    // Clear location state
    navigate('/register', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-soft py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 p-8 bg-white rounded-2xl shadow-xl animate-fade-in">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-lg emergency-pulse">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gradient">
            {isGoogleUser ? 'Complete Your Profile' : 'Create Account'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isGoogleUser
              ? `Welcome ${googleUser?.fullName || ''}! Please complete your registration.`
              : 'Join Roadside Rescue today'}
          </p>

          {/* Google Sign-Up Banner */}
          {isGoogleUser && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
              <svg className="h-3 w-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              </svg>
              <span>Signing up with Google</span>
              <button
                onClick={handleSkipGoogleSignUp}
                className="ml-2 text-blue-500 hover:text-blue-700"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Registration Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg shadow-sm animate-fade-in">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Role Selection */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              I am a:
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => handleRoleChange('client')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${formData.role === 'client'
                  ? 'border-red-600 bg-red-50 text-red-700 shadow-sm'
                  : 'border-gray-200 text-gray-600 hover:border-red-300 hover:bg-red-50/30'
                  }`}
              >
                Stranded Driver
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('garage')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${formData.role === 'garage'
                  ? 'border-red-600 bg-red-50 text-red-700 shadow-sm'
                  : 'border-gray-200 text-gray-600 hover:border-red-300 hover:bg-red-50/30'
                  }`}
              >
                Garage Owner
              </button>
            </div>
          </div>

          {/* User Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                required
                className="input-primary"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                required
                className="input-primary"
                placeholder="0712345678"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                required
                className={`input-primary ${isGoogleUser ? 'bg-gray-100 text-gray-500' : ''}`}
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isGoogleUser}
              />
              {isGoogleUser && (
                <p className="text-xs text-gray-500 mt-1">
                  Email is from your Google account and cannot be changed
                </p>
              )}
            </div>

            {!isGoogleUser && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    className="input-primary"
                    placeholder="Minimum 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    className="input-primary"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}

            {isGoogleUser && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                  You're signing up with Google. You'll be able to set a password later from your profile settings.
                </p>
              </div>
            )}
          </div>

          {/* Garage Business Details (conditional) */}
          {showBusinessFields && (
            <div className="space-y-4 border-t border-gray-200 pt-4 animate-fade-in">
              <h3 className="text-lg font-medium text-gray-900">Business Information</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  name="businessName"
                  required
                  className="input-primary"
                  placeholder="Nairobi Quick Tow"
                  value={businessDetails.businessName}
                  onChange={handleBusinessChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Number *
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  required
                  className="input-primary"
                  placeholder="TOW12345"
                  value={businessDetails.licenseNumber}
                  onChange={handleBusinessChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Phone *
                </label>
                <input
                  type="tel"
                  name="businessPhone"
                  required
                  className="input-primary"
                  placeholder="0723456789"
                  value={businessDetails.businessPhone}
                  onChange={handleBusinessChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Address *
                </label>
                <input
                  type="text"
                  name="address"
                  required
                  className="input-primary"
                  placeholder="Mombasa Road, Nairobi"
                  value={businessDetails.address}
                  onChange={handleBusinessChange}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span>{isGoogleUser ? 'Complete Registration' : 'Create Account'}</span>
              </>
            )}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-red-600 hover:text-red-500 transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;