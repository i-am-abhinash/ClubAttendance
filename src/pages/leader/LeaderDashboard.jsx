import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import FilterBar from '../../components/common/FilterBar';
import { TeamAnalytics } from '../../components/analytics/TeamAnalytics';
import { useAuth } from '../../context/AuthContext';
import { fetchMembers, updateMember } from '../../services/memberService';
import { fetchAttendance } from '../../services/attendanceService';
import { calculateAttendanceStats, applyFilters } from '../../utils/analyticsUtils';
import { Users, Calendar, TrendingUp, UserMinus } from 'lucide-react';

const StatCard = ({ title, value, subtitle, icon: Icon }) => (
  <div className="card p-5 flex flex-col gap-3 group">
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-bold uppercase tracking-wider text-theme-muted">{title}</span>
      <div className="text-theme-muted group-hover:text-theme-accent transition-colors">
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <div className="flex flex-col gap-0.5">
      <span className="text-[28px] leading-none font-bold text-theme-primary tracking-tight">{value}</span>
      <span className="text-xs font-medium text-theme-text-secondary">{subtitle}</span>
    </div>
  </div>
);

const LeaderDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const [members, setTeamMembers] = useState([]);
  const [records, setRecords] = useState([]);

  // Filter state (Team is fixed for Leader)
  const [filters, setFilters] = useState({ timePeriod: 'all', teamId: user?.teamId, status: 'all' });

  useEffect(() => {
    const loadTeamData = async () => {
      if (!user?.teamId) return;
      setLoading(true);
      try {
        const m = await fetchMembers(user.teamId);
        setTeamMembers(m);
        const r = await fetchAttendance(user.teamId);
        setRecords(r);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    loadTeamData();
  }, [user]);

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Remove this member from your team? They will become an External Member.")) return;
    try {
      await updateMember(memberId, { teamId: null });
      setTeamMembers(prev => prev.filter(m => m.id !== memberId));
    } catch (err) {
      console.error(err);
      alert("Failed to remove member.");
    }
  };

  if (loading) {
    return (
      <Layout title="My Team" description="Manage your team and view attendance insights.">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="card h-24 animate-pulse bg-theme-bg/50"></div>)}
        </div>
      </Layout>
    );
  }

  // Force teamId to user's teamId in filters
  const effectiveFilters = { ...filters, teamId: user.teamId };
  const filteredRecords = applyFilters(records, effectiveFilters);
  const stats = calculateAttendanceStats(filteredRecords, members);

  return (
    <Layout title="My Team" description="Manage your team and view attendance insights.">
      
      {/* Hide the Team selector for Leaders in FilterBar, but we can just use the component as is 
          Wait, FilterBar hides team selector if not Admin! So it works automatically. */}
      <FilterBar filters={filters} setFilters={setFilters} />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Team Members" 
          value={members.length} 
          subtitle="Users in your team" 
          icon={Users} 
        />
        <StatCard 
          title="Attendance Rate" 
          value={`${stats.percentage}%`} 
          subtitle="Filtered average" 
          icon={TrendingUp} 
        />
        <StatCard 
          title="Present Sessions" 
          value={stats.present} 
          subtitle="Filtered total" 
          icon={Calendar} 
        />
        <StatCard 
          title="Total Logged" 
          value={stats.totalRecords} 
          subtitle="Filtered total" 
          icon={Calendar} 
        />
      </div>

      {filteredRecords.length > 0 ? (
        <div className="mb-12">
          <TeamAnalytics records={filteredRecords} members={members} />
        </div>
      ) : (
        <div className="card p-12 text-center flex flex-col items-center mb-12">
          <Calendar className="w-10 h-10 text-theme-muted mb-3" />
          <p className="text-theme-text font-medium mb-1">No attendance data found</p>
          <p className="text-sm text-theme-text-secondary">Try adjusting your filters.</p>
        </div>
      )}

      {/* Roster */}
      <div className="card overflow-hidden">
        <div className="px-6 py-5 border-b border-theme-border-subtle">
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
