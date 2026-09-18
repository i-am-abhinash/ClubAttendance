import React from 'react';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../context/AuthContext';

const LeaderDashboard = () => {
  const { user } = useAuth();
  
  return (
    <Layout title="Leader Dashboard">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-medium text-slate-900 mb-2">Welcome back, {user?.name}!</h3>
        <p className="text-slate-600 mb-6">Manage your team's attendance and view analytics here.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="/leader/mark-attendance" className="block p-4 border border-indigo-100 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
            <h4 className="font-semibold text-indigo-800">Mark Attendance</h4>
            <p className="text-sm text-indigo-600">Record attendance for your team today.</p>
          </a>
          <a href="/leader/analysis" className="block p-4 border border-emerald-100 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
            <h4 className="font-semibold text-emerald-800">Team Analysis</h4>
            <p className="text-sm text-emerald-600">View attendance trends for your team.</p>
          </a>
        </div>
      </div>
    </Layout>
  );
};

export default LeaderDashboard;
