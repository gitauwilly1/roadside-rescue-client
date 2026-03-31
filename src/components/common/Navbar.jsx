import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, garage, logout, isAuthenticated, isClient, isGarage, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (isClient) return '/';
    if (isGarage) return '/';
    if (isAdmin) return '/';
    return '/login';
  };

  const getBusinessName = () => {
    if (isGarage && garage) return garage.businessName;
    return user?.fullName || 'User';
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to={getDashboardLink()} className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center">
              <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="font-bold text-xl">Roadside Rescue</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                {isClient && (
                  <>
                    <Link to="/" className="hover:text-blue-200 transition-colors">Request Rescue</Link>
                    <Link to="/history" className="hover:text-blue-200 transition-colors">My History</Link>
                    <Link to="/garages" className="hover:text-blue-200 transition-colors">Nearby Garages</Link>
                  </>
                )}
                {isGarage && (
                  <>
                    <Link to="/" className="hover:text-blue-200 transition-colors">Available Jobs</Link>
                    <Link to="/my-jobs" className="hover:text-blue-200 transition-colors">My Jobs</Link>
                  </>
                )}
                {isAdmin && (
                  <>
                    <Link to="/" className="hover:text-blue-200 transition-colors">Dashboard</Link>
                    <Link to="/users" className="hover:text-blue-200 transition-colors">Users</Link>
                    <Link to="/garages" className="hover:text-blue-200 transition-colors">Garages</Link>
                  </>
                )}
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-blue-200 transition-colors">Login</Link>
                <Link to="/register" className="hover:text-blue-200 transition-colors">Register</Link>
              </>
            )}
          </div>

          {/* User Menu */}
          {isAuthenticated && (
            <div className="flex items-center space-x-4">
              <div className="hidden md:block">
                <p className="text-sm font-medium">{getBusinessName()}</p>
                <p className="text-xs text-blue-200 capitalize">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1 bg-blue-700 hover:bg-blue-800 rounded-lg text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;