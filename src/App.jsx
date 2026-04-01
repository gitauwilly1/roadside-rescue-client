import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/common/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ClientDashboard from './pages/ClientDashboard';
import GarageDashboard from './pages/GarageDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProfilePage from './pages/ProfilePage';

function App() {
  const { isAuthenticated, isClient, isGarage, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
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

        {/* Client Routes */}
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

        <Route
          path="/history"
          element={
            isAuthenticated && isClient ? <ClientDashboard /> : <Navigate to="/" />
          }
        />

        <Route
          path="/garages"
          element={
            isAuthenticated && (isClient || isAdmin) ?
              (isClient ? <ClientDashboard /> : <AdminDashboard />) :
              <Navigate to="/" />
          }
        />

        <Route
          path="/my-jobs"
          element={
            isAuthenticated && isGarage ? <GarageDashboard /> : <Navigate to="/" />
          }
        />

        <Route
          path="/admin"
          element={
            isAuthenticated && isAdmin ? <AdminDashboard /> : <Navigate to="/" />
          }
        />

        <Route
          path="/users"
          element={
            isAuthenticated && isAdmin ? <AdminDashboard /> : <Navigate to="/" />
          }
        />

        <Route
          path="/admin/garages"
          element={
            isAuthenticated && isAdmin ? <AdminDashboard /> : <Navigate to="/" />
          }
        />

        <Route
          path="/jobs"
          element={
            isAuthenticated && isAdmin ? <AdminDashboard /> : <Navigate to="/" />
          }
        />

        <Route
          path="/vehicles"
          element={
            isAuthenticated && isAdmin ? <AdminDashboard /> : <Navigate to="/" />
          }
        />
        <Route
          path="/profile"
          element={
            isAuthenticated ? <ProfilePage /> : <Navigate to="/login" />
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}

export default App;