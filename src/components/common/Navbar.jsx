import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from './Logo';

const Navbar = () => {
  const { user, garage, logout, isAuthenticated, isClient, isGarage, isAdmin } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getBusinessName = () => {
    if (isGarage && garage) return garage.businessName;
    return user?.fullName?.split(' ')[0] || 'User';
  };

  const NavLinks = () => (
    <>
      {isClient && (
        <>
          <Link to="/" className="text-gray-700 hover:text-blue-600 transition-colors">Request Rescue</Link>
          <Link to="/history" className="text-gray-700 hover:text-blue-600 transition-colors">My History</Link>
          <Link to="/garages" className="text-gray-700 hover:text-blue-600 transition-colors">Nearby Garages</Link>
          <Link to="/vehicles" className="text-gray-700 hover:text-blue-600 transition-colors">My Vehicles</Link>
          <Link to="/locations" className="text-gray-700 hover:text-blue-600 transition-colors">Saved Places</Link>
        </>
      )}
      {isGarage && (
        <>
          <Link to="/" className="text-gray-700 hover:text-blue-600 transition-colors">Available Jobs</Link>
          <Link to="/my-jobs" className="text-gray-700 hover:text-blue-600 transition-colors">My Jobs</Link>
          <Link to="/services" className="text-gray-700 hover:text-blue-600 transition-colors">Services</Link>
          <Link to="/earnings" className="text-gray-700 hover:text-blue-600 transition-colors">Earnings</Link>
        </>
      )}
      {isAdmin && (
        <>
          <Link to="/" className="text-gray-700 hover:text-blue-600 transition-colors">Dashboard</Link>
          <Link to="/users" className="text-gray-700 hover:text-blue-600 transition-colors">Users</Link>
          <Link to="/garages" className="text-gray-700 hover:text-blue-600 transition-colors">Garages</Link>
          <Link to="/analytics" className="text-gray-700 hover:text-blue-600 transition-colors">Analytics</Link>
        </>
      )}
    </>
  );

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Logo size="md" withText={true} linkTo={isAuthenticated ? '/' : '/login'} />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                <NavLinks />
                <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-gray-200">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{getBusinessName()}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-all duration-200"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium">Sign In</Link>
                <Link to="/register" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 animate-fade-in">
            <div className="flex flex-col space-y-3">
              {isAuthenticated ? (
                <>
                  <NavLinks />
                  <div className="pt-3 mt-3 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-900 mb-2">{getBusinessName()}</p>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-all duration-200"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col space-y-2">
                  <Link to="/login" className="px-4 py-2 text-center text-blue-600 hover:bg-blue-50 rounded-lg">Sign In</Link>
                  <Link to="/register" className="px-4 py-2 text-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Get Started</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;