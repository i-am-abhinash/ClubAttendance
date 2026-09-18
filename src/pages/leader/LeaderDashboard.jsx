import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../context/AuthContext';
import { fetchMembers, updateMember } from '../../services/memberService';
import { fetchAttendance } from '../../services/attendanceService';
import { calculateAttendanceStats } from '../../utils/analyticsUtils';
import { Users, Calendar, CheckSquare, TrendingUp, UserMinus, Plus } from 'lucide-react';

const StatCard = ({ title, value, subtitle, icon: Icon }) => (
  <div className="card p-6 flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold uppercase tracking-wider text-theme-muted">{title}</span>
      <div className="p-2 bg-theme-bg rounded-lg text-theme-primary">
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <div className="flex flex-col gap-1">
      <span className="text-3xl font-bold text-theme-primary">{value}</span>
      <span className="text-xs font-medium text-theme-text-secondary">{subtitle}</span>
    </div>
  </div>
);

const LeaderDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [members, setTeamMembers] = useState([]);

  useEffect(() => {
    loadTeamData();
  }, [user]);

  const loadTeamData = async () => {
    if (!user?.teamId) return;
    setLoading(true);
    try {
      const allMembers = await fetchMembers(user.teamId);
      setTeamMembers(allMembers);

      const allRecords = await fetchAttendance(user.teamId);
      
      const calculated = calculateAttendanceStats(allRecords, allMembers);
      setStats({ ...calculated, totalMembers: allMembers.length });
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Remove this member from your team? They will become an External Member.")) return;
    try {
      await updateMember(memberId, { teamId: null });
      loadTeamData(); // reload
    } catch (err) {
      console.error(err);
      alert("Failed to remove member.");
    }
  };

  if (loading) {
    return (
      <Layout title="My Team" description="Manage your team and view attendance.">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="card h-32 animate-pulse bg-theme-bg/50"></div>)}
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="My Team" description="Manage your team and view attendance insights.">
      
      {/* Quick Actions */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <Link to="/leader/external-members" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add External Member
        </Link>
        <Link to="/leader/analysis" className="btn-secondary flex items-center gap-2">
          <TrendingUp className="w-4 h-4" /> View Team Analytics
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard 
          title="Team Members" 
          value={stats?.totalMembers || 0} 
          subtitle="Users in your team" 
          icon={Users} 
        />
        <StatCard 
          title="Attendance Rate" 
          value={`${stats?.percentage || 0}%`} 
          subtitle="Overall average" 
          icon={TrendingUp} 
        />
        <StatCard 
          title="Present (All Time)" 
          value={stats?.present || 0} 
          subtitle="Total instances" 
          icon={CheckSquare} 
        />
        <StatCard 
          title="Sessions Logged" 
          value={stats?.totalRecords || 0} 
          subtitle="Total recorded" 
          icon={Calendar} 
        />
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-5 border-b border-theme-border-subtle flex justify-between items-center">
          <h3 className="font-semibold text-theme-primary">Team Roster</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Email</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-theme-accent-light text-theme-accent flex items-center justify-center font-bold text-xs">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-theme-primary">{m.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-md ${m.role === 'Team Leader' ? 'bg-theme-accent-light text-theme-accent' : 'bg-theme-bg text-theme-text-secondary'}`}>
                      {m.role}
                    </span>
                  </td>
                  <td className="text-theme-text-secondary">{m.email}</td>
                  <td className="text-right">
                    {m.role !== 'Team Leader' && (
                      <button 
                        onClick={() => handleRemoveMember(m.id)}
                        className="text-theme-muted hover:text-theme-absent transition-colors p-2 rounded-lg hover:bg-theme-absent-bg"
                        title="Remove from team"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-theme-text-secondary">No members found in your team.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default LeaderDashboard;
