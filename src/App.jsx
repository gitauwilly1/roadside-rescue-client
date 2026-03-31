import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/common/Layout';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ClientDashboard from './pages/ClientDashboard';
import GarageDashboard from './pages/GarageDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const { isAuthenticated, isClient, isGarage, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            !isAuthenticated ? <LoginPage /> : <Navigate to="/" />
          } 
        />
        <Route 
          path="/register" 
          element={
            !isAuthenticated ? <RegisterPage /> : <Navigate to="/" />
          } 
        />

        {/* Protected Routes - Role Based */}
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              isClient ? <ClientDashboard /> : 
              isGarage ? <GarageDashboard /> : 
              isAdmin ? <AdminDashboard /> : 
              <Navigate to="/login" />
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        {/* Client-specific routes */}
        <Route 
          path="/history" 
          element={
            isAuthenticated && isClient ? <ClientDashboard initialTab="history" /> : <Navigate to="/" />
          } 
        />
        <Route 
          path="/garages" 
          element={
            isAuthenticated && isClient ? <ClientDashboard initialTab="garages" /> : <Navigate to="/" />
          } 
        />

        {/* Garage-specific routes */}
        <Route 
          path="/my-jobs" 
          element={
            isAuthenticated && isGarage ? <GarageDashboard initialTab="myjobs" /> : <Navigate to="/" />
          } 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}

export default App;