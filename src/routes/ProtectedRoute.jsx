import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect based on role
    if (user.role === 'Admin') return <Navigate to="/admin" replace />;
    if (user.role === 'Team Leader') return <Navigate to="/leader" replace />;
    return <Navigate to="/member" replace />;
  }

  return children;
};

export default ProtectedRoute;
