import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import FilterBar from '../../components/common/FilterBar';
import { ClubAnalytics } from '../../components/analytics/ClubAnalytics';
import { fetchMembers } from '../../services/memberService';
import { fetchTeams } from '../../services/teamService';
import { fetchAttendance } from '../../services/attendanceService';
import { calculateAttendanceStats, applyFilters } from '../../utils/analyticsUtils';
import { Users, Calendar, TrendingUp, UsersRound, Database, UserMinus } from 'lucide-react';

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

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  
  // Raw Data
  const [members, setMembers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [records, setRecords] = useState([]);

  // Filters
  const [filters, setFilters] = useState({ timePeriod: 'all', teamId: 'all', status: 'all' });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const m = await fetchMembers();
        const t = await fetchTeams();
        const r = await fetchAttendance();
        setMembers(m);
        setTeams(t);
        setRecords(r);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <Layout title="Dashboard" description="Club-wide overview of attendance and member activity.">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="card h-24 animate-pulse bg-theme-bg/50"></div>)}
        </div>
      </Layout>
    );
  }

  // Apply filters to records
  const filteredRecords = applyFilters(records, filters);

  // Compute stats on filtered records
  const stats = calculateAttendanceStats(filteredRecords, members);
  const extCount = members.filter(m => !m.teamId && m.role === 'Member').length;
  const teamMemberCount = members.filter(m => m.teamId).length;

  return (
    <Layout title="Dashboard" description="Club-wide overview of attendance and member activity.">
      
      <FilterBar filters={filters} setFilters={setFilters} availableTeams={teams} />

      {/* Minimal KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Members" 
          value={members.length} 
          subtitle={`${extCount} unassigned`} 
          icon={UsersRound} 
        />
        <StatCard 
          title="Active Teams" 
          value={teams.length} 
          subtitle={`${teamMemberCount} members assigned`} 
          icon={Database} 
        />
        <StatCard 
          title="Attendance Rate" 
          value={`${stats.percentage}%`} 
          subtitle="Filtered average" 
          icon={TrendingUp} 
        />
        <StatCard 
          title="Sessions Logged" 
          value={stats.totalRecords} 
          subtitle="Filtered total" 
          icon={Calendar} 
        />
      </div>

      {/* Analytics Charts */}
      {filteredRecords.length > 0 ? (
        <div className="mb-8">
          <ClubAnalytics records={filteredRecords} teams={teams} />
        </div>
      ) : (
        <div className="card p-12 text-center flex flex-col items-center mb-8">
          <Calendar className="w-10 h-10 text-theme-muted mb-3" />
          <p className="text-theme-text font-medium mb-1">No attendance data found</p>
          <p className="text-sm text-theme-text-secondary">Try adjusting your filters or recording new attendance.</p>
        </div>
      )}

      {/* We can keep a simplified recent records table or rely on analytics */}
      
    </Layout>
  );
};

export default AdminDashboard;
