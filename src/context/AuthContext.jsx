import React, { createContext, useState, useContext, useEffect } from 'react';
import { signInWithGoogle, signOutGoogle, handleRedirectResult } from '../config/firebase';
import { auth as apiAuth } from '../services/api';

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
    const checkRedirectResult = async () => {
      const redirectResult = await handleRedirectResult();
      if (redirectResult.success) {
        // User signed in via redirect, now authenticate with backend
        await handleGoogleUser(redirectResult.user, 'client');
      }
    };
    checkRedirectResult();
  }, []);

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
      const response = await apiAuth.getMe();
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

  const handleGoogleUser = async (googleUser, role) => {
    try {
      const { email, fullName, uid } = googleUser;
      
      // Try to login with email
      const loginResult = await apiAuth.login({ identifier: email, password: uid });
      
      if (loginResult.data?.success) {
        const { token, user: userData, garage: garageData } = loginResult.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        if (garageData) setGarage(garageData);
        return { success: true };
      }
      
      // Register new user
      const registerPayload = {
        phone: '',
        email,
        password: uid,
        fullName,
        role,
      };
      
      const registerResult = await apiAuth.register(registerPayload);
      
      if (registerResult.data?.success) {
        const { token, user: userData, garage: garageData } = registerResult.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        if (garageData) setGarage(garageData);
        return { success: true };
      }
      
      return { success: false, error: 'Failed to authenticate with Google' };
    } catch (err) {
      console.error('Google user handling error:', err);
      return { success: false, error: err.response?.data?.error || 'Google authentication failed' };
    }
  };

  const register = async (userData, businessDetails = null) => {
    try {
      const payload = {
        ...userData,
        role: businessDetails ? 'garage' : 'client',
        businessDetails,
      };
      const response = await apiAuth.register(payload);
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
      const response = await apiAuth.login({ identifier, password });
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

  const googleLogin = async (role = 'client') => {
    try {
      const googleResult = await signInWithGoogle();
      
      if (googleResult.redirect) {
        // Redirect happening, user will come back
        return { success: false, redirect: true, message: googleResult.message };
      }
      
      if (!googleResult.success) {
        return { success: false, error: googleResult.error };
      }

      return await handleGoogleUser(googleResult.user, role);
      
    } catch (err) {
      console.error('Google login error:', err);
      return { success: false, error: err.response?.data?.error || 'Google login failed' };
    }
  };

  const logout = async () => {
    await signOutGoogle();
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
    login,
    googleLogin,
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