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
    <nav className="bg-gradient-primary text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to={getDashboardLink()} className="flex items-center space-x-2 group">
            <div className="h-9 w-9 bg-white rounded-full flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
              <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
              </svg>
            </div>
            <span className="font-bold text-xl tracking-tight">Roadside Rescue</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                {isClient && (
                  <>
                    <Link to="/" className="text-white/90 hover:text-white transition-colors duration-200">Request Rescue</Link>
                    <Link to="/history" className="text-white/90 hover:text-white transition-colors duration-200">My History</Link>
                    <Link to="/garages" className="text-white/90 hover:text-white transition-colors duration-200">Nearby Garages</Link>
                  </>
                )}
                {isGarage && (
                  <>
                    <Link to="/" className="text-white/90 hover:text-white transition-colors duration-200">Available Jobs</Link>
                    <Link to="/my-jobs" className="text-white/90 hover:text-white transition-colors duration-200">My Jobs</Link>
                  </>
                )}
                {isAdmin && (
                  <>
                    <Link to="/" className="text-white/90 hover:text-white transition-colors duration-200">Dashboard</Link>
                    <Link to="/users" className="text-white/90 hover:text-white transition-colors duration-200">Users</Link>
                    <Link to="/garages" className="text-white/90 hover:text-white transition-colors duration-200">Garages</Link>
                  </>
                )}
              </>
            ) : (
              <>
                <Link to="/login" className="text-white/90 hover:text-white transition-colors duration-200">Login</Link>
                <Link to="/register" className="text-white/90 hover:text-white transition-colors duration-200">Register</Link>
              </>
            )}
          </div>

          {isAuthenticated && (
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-white">{getBusinessName()}</p>
                <p className="text-xs text-red-100 capitalize">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-all duration-200"
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