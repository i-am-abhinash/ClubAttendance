import React, { useState } from 'react';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../context/AuthContext';
import { Settings as SettingsIcon, Shield, Key } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import SeedDatabase from './SeedDatabase';

const Settings = () => {
  const { user, changePassword } = useAuth();
  const location = useLocation();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(location.state?.message || '');
  const [error, setError] = useState('');

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setMessage("Password changed successfully.");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError("Incorrect current password.");
      } else {
        setError(err.message || "Failed to change password.");
      }
    }
    setLoading(false);
  };

  return (
    <Layout title="Settings" description="Manage your personal account settings.">
      <div className="max-w-3xl space-y-6">
        
        {/* Profile Card */}
        <div className="card p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-theme-accent-light text-theme-accent flex items-center justify-center font-bold text-2xl border border-theme-accent/20">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-theme-primary">{user?.name}</h2>
            <p className="text-theme-text-secondary">{user?.email}</p>
            <span className="inline-block mt-2 text-xs font-semibold px-2.5 py-1 rounded-md bg-theme-bg text-theme-text-secondary">
              Role: {user?.role}
            </span>
          </div>
        </div>

        {/* Security Settings */}
        <div className="card overflow-hidden">
          <div className="border-b border-theme-border-subtle p-6 bg-theme-surface/50 flex items-center gap-3">
            <Shield className="w-5 h-5 text-theme-accent" />
            <h3 className="text-lg font-bold text-theme-primary">Account Security</h3>
          </div>
          
          <div className="p-6">
            <h4 className="text-sm font-bold text-theme-primary mb-4 flex items-center gap-2">
              <Key className="w-4 h-4 text-theme-muted" /> Change Password
            </h4>
            
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              {message && (
                <div className="bg-theme-present-bg text-theme-present p-3 rounded-lg text-sm border border-theme-present/20 font-medium">
                  {message}
                </div>
              )}
              {error && (
                <div className="bg-theme-absent-bg text-theme-absent p-3 rounded-lg text-sm border border-theme-absent/20 font-medium">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-theme-text mb-1">Current Password</label>
                <input 
                  type="password" 
                  required
                  className="w-full border border-theme-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-theme-accent"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-theme-text mb-1">New Password</label>
                <input 
                  type="password" 
                  required
                  className="w-full border border-theme-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-theme-accent"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-theme-text mb-1">Confirm New Password</label>
                <input 
                  type="password" 
                  required
                  className="w-full border border-theme-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-theme-accent"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
              
              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn-primary w-full sm:w-auto"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Admin Tools */}
        {user?.role === 'Admin' && <SeedDatabase />}

      </div>
    </Layout>
  );
};

export default Settings;
