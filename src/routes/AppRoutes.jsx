import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../context/AuthContext';

// Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

import AdminDashboard from '../pages/admin/AdminDashboard';
import ManageTeams from '../pages/admin/ManageTeams';
import ManageMembers from '../pages/admin/ManageMembers';
import ExternalMembersAdmin from '../pages/admin/ExternalMembers';

import LeaderDashboard from '../pages/leader/LeaderDashboard';
import ExternalMembersLeader from '../pages/leader/ExternalMembers';

import MemberDashboard from '../pages/member/MemberDashboard';
import MyAttendance from '../pages/member/MyAttendance';

import Settings from '../pages/settings/Settings';
import TeamDetails from '../pages/shared/TeamDetails';

const AppRoutes = () => {
  const { user } = useAuth();

  const getHomeRoute = () => {
    if (!user) return '/login';
    if (user.role === 'Admin') return '/admin';
    if (user.role === 'Team Leader') return '/leader';
    return '/member';
  };

  return (
    <Routes>
      <Route path="/" element={<Navigate to={getHomeRoute()} replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Shared Authenticated Routes */}
      <Route path="/settings" element={<ProtectedRoute allowedRoles={['Admin', 'Team Leader', 'Member']}><Settings /></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['Admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/teams" element={<ProtectedRoute allowedRoles={['Admin']}><ManageTeams /></ProtectedRoute>} />
      <Route path="/admin/teams/:teamId" element={<ProtectedRoute allowedRoles={['Admin']}><TeamDetails /></ProtectedRoute>} />
      <Route path="/admin/members" element={<ProtectedRoute allowedRoles={['Admin']}><ManageMembers /></ProtectedRoute>} />
      <Route path="/admin/external-members" element={<ProtectedRoute allowedRoles={['Admin']}><ExternalMembersAdmin /></ProtectedRoute>} />

      {/* Leader Routes */}
      <Route path="/leader" element={<ProtectedRoute allowedRoles={['Team Leader']}><LeaderDashboard /></ProtectedRoute>} />
      <Route path="/leader/team" element={<ProtectedRoute allowedRoles={['Team Leader']}><TeamDetails /></ProtectedRoute>} />
      <Route path="/leader/external-members" element={<ProtectedRoute allowedRoles={['Team Leader']}><ExternalMembersLeader /></ProtectedRoute>} />

      {/* Member Routes */}
      <Route path="/member" element={<ProtectedRoute allowedRoles={['Member']}><MemberDashboard /></ProtectedRoute>} />
      <Route path="/member/attendance" element={<ProtectedRoute allowedRoles={['Member']}><MyAttendance /></ProtectedRoute>} />
      
      <Route path="*" element={<Navigate to={getHomeRoute()} replace />} />
    </Routes>
  );
};

export default AppRoutes;
