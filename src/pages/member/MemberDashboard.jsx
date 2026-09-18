import React from 'react';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../context/AuthContext';

const MemberDashboard = () => {
  const { user } = useAuth();
  
  return (
    <Layout title="Member Dashboard">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-medium text-slate-900 mb-2">Welcome, {user?.name}!</h3>
        <p className="text-slate-600 mb-6">Here is an overview of your recent attendance.</p>
        
        <div className="block p-4 border border-indigo-100 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
          <a href="/member/attendance">
            <h4 className="font-semibold text-indigo-800">View My Attendance History</h4>
            <p className="text-sm text-indigo-600">See your full attendance records and stats.</p>
          </a>
        </div>
      </div>
    </Layout>
  );
};

export default MemberDashboard;
