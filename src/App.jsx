import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
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
    <Routes>
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

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;