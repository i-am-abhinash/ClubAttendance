import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Force password change check
  if (user.mustChangePassword && location.pathname !== '/settings') {
    return <Navigate to="/settings" state={{ message: "Your account is using the initial password. Please change your password before continuing." }} replace />;
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
