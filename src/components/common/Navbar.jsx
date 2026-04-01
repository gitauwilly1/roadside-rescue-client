import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, garage, logout, isAuthenticated, isClient, isGarage, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMobileMenuOpen(false);
  };

  const getDashboardLink = () => {
    if (isClient) return '/';
    if (isGarage) return '/';
    if (isAdmin) return '/admin';
    return '/login';
  };

  const getDisplayName = () => {
    if (isGarage && garage) return garage.businessName;
    return user?.fullName?.split(' ')[0] || 'User';
  };

  const getFullName = () => {
    if (isGarage && garage) return garage.businessName;
    return user?.fullName || 'User';
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-gradient-primary text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to={getDashboardLink()} className="flex items-center space-x-2 group" onClick={closeMobileMenu}>
            <div className="h-9 w-9 bg-white rounded-full flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
              <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
              </svg>
            </div>
            <span className="font-bold text-xl tracking-tight">Roadside Rescue</span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                {isClient && (
                  <>
                    <Link 
                      to="/" 
                      className={`transition-colors duration-200 ${isActive('/') ? 'text-white font-semibold border-b-2 border-white' : 'text-white/80 hover:text-white'}`}
                    >
                       Request Rescue
                    </Link>
                    <Link 
                      to="/history" 
                      className={`transition-colors duration-200 ${isActive('/history') ? 'text-white font-semibold border-b-2 border-white' : 'text-white/80 hover:text-white'}`}
                    >
                       My History
                    </Link>
                    <Link 
                      to="/garages" 
                      className={`transition-colors duration-200 ${isActive('/garages') ? 'text-white font-semibold border-b-2 border-white' : 'text-white/80 hover:text-white'}`}
                    >
                       Nearby Garages
                    </Link>
                  </>
                )}
                {isGarage && (
                  <>
                    <Link 
                      to="/" 
                      className={`transition-colors duration-200 ${isActive('/') ? 'text-white font-semibold border-b-2 border-white' : 'text-white/80 hover:text-white'}`}
                    >
                       Available Jobs
                    </Link>
                    <Link 
                      to="/my-jobs" 
                      className={`transition-colors duration-200 ${isActive('/my-jobs') ? 'text-white font-semibold border-b-2 border-white' : 'text-white/80 hover:text-white'}`}
                    >
                       My Jobs
                    </Link>
                  </>
                )}
                {isAdmin && (
                  <>
                    <Link 
                      to="/admin" 
                      className={`transition-colors duration-200 ${isActive('/admin') ? 'text-white font-semibold border-b-2 border-white' : 'text-white/80 hover:text-white'}`}
                    >
                       Dashboard
                    </Link>
                    <Link 
                      to="/users" 
                      className={`transition-colors duration-200 ${isActive('/users') ? 'text-white font-semibold border-b-2 border-white' : 'text-white/80 hover:text-white'}`}
                    >
                       Users
                    </Link>
                    <Link 
                      to="/admin/garages" 
                      className={`transition-colors duration-200 ${isActive('/admin/garages') ? 'text-white font-semibold border-b-2 border-white' : 'text-white/80 hover:text-white'}`}
                    >
                       Garages
                    </Link>
                    <Link 
                      to="/jobs" 
                      className={`transition-colors duration-200 ${isActive('/jobs') ? 'text-white font-semibold border-b-2 border-white' : 'text-white/80 hover:text-white'}`}
                    >
                       Jobs
                    </Link>
                    <Link 
                      to="/vehicles" 
                      className={`transition-colors duration-200 ${isActive('/vehicles') ? 'text-white font-semibold border-b-2 border-white' : 'text-white/80 hover:text-white'}`}
                    >
                       Vehicles
                    </Link>
                  </>
                )}
              </>
            ) : (
              <>
                <Link to="/login" className="text-white/80 hover:text-white transition-colors">Login</Link>
                <Link to="/register" className="text-white/80 hover:text-white transition-colors">Register</Link>
              </>
            )}
          </div>

          {/* User Menu and Mobile Menu Button */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && (
              <div className="hidden md:block text-right">
                <Link to="/profile" className="text-sm font-medium text-white hover:underline transition-colors">
                  {getDisplayName()}
                </Link>
                <p className="text-xs text-red-100 capitalize">{user?.role}</p>
              </div>
            )}
            
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="hidden md:block px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-all duration-200"
              >
                Logout
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors focus:outline-none"
              aria-label="Toggle menu"
            >
              <div className="w-6 h-5 flex flex-col justify-between">
                <span className={`block w-full h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                <span className={`block w-full h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`block w-full h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden transition-all duration-300 overflow-hidden ${isMobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="py-4 space-y-2 border-t border-white/20">
            {isAuthenticated ? (
              <>
                {/* Mobile User Info */}
                <div className="px-3 py-2 mb-2 border-b border-white/20">
                  <Link to="/profile" onClick={closeMobileMenu} className="block">
                    <p className="font-medium text-white">{getFullName()}</p>
                    <p className="text-xs text-red-100 capitalize">{user?.role}</p>
                  </Link>
                </div>
                
                {isClient && (
                  <>
                    <Link 
                      to="/" 
                      onClick={closeMobileMenu}
                      className={`block px-3 py-2 rounded-lg transition-colors ${isActive('/') ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10'}`}
                    >
                       Request Rescue
                    </Link>
                    <Link 
                      to="/history" 
                      onClick={closeMobileMenu}
                      className={`block px-3 py-2 rounded-lg transition-colors ${isActive('/history') ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10'}`}
                    >
                       My History
                    </Link>
                    <Link 
                      to="/garages" 
                      onClick={closeMobileMenu}
                      className={`block px-3 py-2 rounded-lg transition-colors ${isActive('/garages') ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10'}`}
                    >
                       Nearby Garages
                    </Link>
                  </>
                )}
                {isGarage && (
                  <>
                    <Link 
                      to="/" 
                      onClick={closeMobileMenu}
                      className={`block px-3 py-2 rounded-lg transition-colors ${isActive('/') ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10'}`}
                    >
                       Available Jobs
                    </Link>
                    <Link 
                      to="/my-jobs" 
                      onClick={closeMobileMenu}
                      className={`block px-3 py-2 rounded-lg transition-colors ${isActive('/my-jobs') ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10'}`}
                    >
                       My Jobs
                    </Link>
                  </>
                )}
                {isAdmin && (
                  <>
                    <Link 
                      to="/admin" 
                      onClick={closeMobileMenu}
                      className={`block px-3 py-2 rounded-lg transition-colors ${isActive('/admin') ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10'}`}
                    >
                       Dashboard
                    </Link>
                    <Link 
                      to="/users" 
                      onClick={closeMobileMenu}
                      className={`block px-3 py-2 rounded-lg transition-colors ${isActive('/users') ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10'}`}
                    >
                       Users
                    </Link>
                    <Link 
                      to="/admin/garages" 
                      onClick={closeMobileMenu}
                      className={`block px-3 py-2 rounded-lg transition-colors ${isActive('/admin/garages') ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10'}`}
                    >
                       Garages
                    </Link>
                    <Link 
                      to="/jobs" 
                      onClick={closeMobileMenu}
                      className={`block px-3 py-2 rounded-lg transition-colors ${isActive('/jobs') ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10'}`}
                    >
                       Jobs
                    </Link>
                    <Link 
                      to="/vehicles" 
                      onClick={closeMobileMenu}
                      className={`block px-3 py-2 rounded-lg transition-colors ${isActive('/vehicles') ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10'}`}
                    >
                       Vehicles
                    </Link>
                  </>
                )}
                
                <Link 
                  to="/profile" 
                  onClick={closeMobileMenu}
                  className="block px-3 py-2 mt-2 rounded-lg text-white/80 hover:bg-white/10 transition-colors border-t border-white/20 pt-3"
                >
                   Profile Settings
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 mt-1 rounded-lg text-white/80 hover:bg-white/10 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  onClick={closeMobileMenu}
                  className="block px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  onClick={closeMobileMenu}
                  className="block px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;