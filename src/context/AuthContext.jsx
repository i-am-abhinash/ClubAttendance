import React, { createContext, useContext, useState, useEffect } from 'react';
import { subscribeToAuthChanges, loginUser, logoutUser, registerUser, changeUserPassword } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((userData) => {
      setUser(userData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    return loginUser(email, password);
  };

  const register = async (email, password) => {
    return registerUser(email, password);
  };

  const logout = async () => {
    await logoutUser();
  };

  const changePassword = async (currentPassword, newPassword) => {
    return changeUserPassword(currentPassword, newPassword);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    changePassword,
    isAdmin: user?.role === 'Admin',
    isLeader: user?.role === 'Team Leader',
    isMember: user?.role === 'Member',
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
