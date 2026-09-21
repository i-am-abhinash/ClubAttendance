import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../context/AuthContext';
import { fetchMembers } from '../../services/memberService';
import { fetchAttendance } from '../../services/attendanceService';
import { calculateAttendanceStats } from '../../utils/analyticsUtils';
import { Users, Calendar, TrendingUp, ArrowRight } from 'lucide-react';

const StatCard = ({ title, value, subtitle, icon: Icon }) => (
  <div className="card p-5 flex flex-col gap-3 group hover:border-theme-accent transition-colors">
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
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [members, setTeamMembers] = useState([]);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    const loadTeamData = async () => {
      if (!user?.teamId) return;
      setLoading(true);
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const startDateString = thirtyDaysAgo.toISOString().split('T')[0];

        const m = await fetchMembers(user.teamId);
        setTeamMembers(m);
        const r = await fetchAttendance(user.teamId, null, startDateString);
        setRecords(r);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    loadTeamData();
  }, [user]);

  if (loading) {
    return (
      <Layout title="Dashboard" description="Overview of your team's performance.">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="card h-24 animate-pulse bg-theme-bg/50"></div>)}
        </div>
      </Layout>
    );
  }

  const stats = calculateAttendanceStats(records, members);

  return (
    <Layout title="Dashboard" description="Overview of your team's performance.">
      
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Team Members" 
          value={members.length} 
          subtitle="Total users assigned to you" 
          icon={Users} 
        />
        <StatCard 
          title="Attendance Rate" 
          value={`${stats.percentage}%`} 
          subtitle="All-time average" 
          icon={TrendingUp} 
        />
        <StatCard 
          title="Present Sessions" 
          value={stats.present} 
          subtitle="All-time total" 
          icon={Calendar} 
        />
        <StatCard 
          title="Total Logged" 
          value={stats.totalRecords} 
          subtitle="All-time total records" 
          icon={Calendar} 
        />
      </div>

      <div className="card p-8 flex flex-col items-center justify-center text-center max-w-2xl mx-auto border-theme-accent/20 bg-theme-accent/5">
        <Users className="w-12 h-12 text-theme-accent mb-4" />
        <h2 className="text-xl font-bold text-theme-primary mb-2">Manage Your Team</h2>
        <p className="text-sm text-theme-text-secondary mb-6 max-w-md mx-auto">
          View your complete team roster, monitor daily attendance records, and review detailed performance analytics in the Team Details workspace.
        </p>
        <button 
          onClick={() => navigate('/leader/team')}
          className="btn-primary flex items-center gap-2"
        >
          Open Team Workspace <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </Layout>
  );
};

export default LeaderDashboard;
