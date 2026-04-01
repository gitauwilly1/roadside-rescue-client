import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [garage, setGarage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const response = await auth.getMe();
      const { user: userData, garage: garageData } = response.data;
      setUser(userData);
      if (garageData) setGarage(garageData);
    } catch (err) {
      console.error('Failed to load user:', err);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData, businessDetails = null) => {
    try {
      const payload = {
        ...userData,
        role: businessDetails ? 'garage' : 'client',
        businessDetails,
      };
      const response = await auth.register(payload);
      const { token, user: userDataRes, garage: garageDataRes } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userDataRes));
      setUser(userDataRes);
      if (garageDataRes) setGarage(garageDataRes);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Registration failed' };
    }
  };

  const login = async (identifier, password) => {
    try {
      const response = await auth.login({ identifier, password });
      const { token, user: userData, garage: garageData } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      if (garageData) setGarage(garageData);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Login failed' };
    }
  };

  const googleLogin = async (idToken, userData) => {
  try {
    const response = await auth.googleAuth(idToken, userData);
    const { token, user: userDataRes, garage: garageDataRes, isNewUser } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userDataRes));
    setUser(userDataRes);
    if (garageDataRes) setGarage(garageDataRes);
    return { success: true, isNewUser };
  } catch (err) {
    console.error('Google login error:', err);
    return { success: false, error: err.response?.data?.error || 'Google login failed' };
  }
};

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setGarage(null);
  };

  const value = {
    user,
    garage,
    loading,
    error,
    register,
    googleLogin,
    login,
    logout,
    isAuthenticated: !!user,
    isClient: user?.role === 'client',
    isGarage: user?.role === 'garage',
    isAdmin: user?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};