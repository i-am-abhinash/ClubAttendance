import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../context/AuthContext';
import { fetchAttendance } from '../../services/attendanceService';
import { fetchTeams } from '../../services/teamService';
import { IndividualAnalytics } from '../../components/analytics/IndividualAnalytics';
import { Calendar, CheckSquare, Clock, XCircle, TrendingUp, ShieldAlert, ShieldCheck } from 'lucide-react';

const StatCard = ({ title, value, subtitle, icon: Icon, colorClass }) => (
  <div className="card p-5 flex flex-col gap-3 group">
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-bold uppercase tracking-wider text-theme-muted">{title}</span>
      <div className={`p-1.5 rounded-lg ${colorClass} opacity-80 group-hover:opacity-100 transition-opacity`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <div className="flex flex-col gap-0.5">
      <span className="text-[28px] leading-none font-bold text-theme-primary tracking-tight">{value}</span>
      <span className="text-xs font-medium text-theme-text-secondary">{subtitle}</span>
    </div>
  </div>
);

const MemberDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ present: 0, late: 0, absent: 0, total: 0, rate: 0 });
  const [records, setRecords] = useState([]);
  const [teamName, setTeamName] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!user?.uid) return;
      setLoading(true);
      try {
        if (user.teamId) {
          const teams = await fetchTeams();
          const t = teams.find(t => t.id === user.teamId);
          if (t) setTeamName(t.name);
        }

        const rawRecords = await fetchAttendance(null, user.uid);
        const sortedRecords = rawRecords.sort((a, b) => b.date.localeCompare(a.date));
        
        let present = 0, late = 0, absent = 0;
        sortedRecords.forEach(r => {
          if (r.status === 'Present') present++;
          else if (r.status === 'Late') late++;
          else if (r.status === 'Absent') absent++;
        });

        const total = present + late + absent;
        const rate = total === 0 ? 0 : Math.round(((present + (late * 0.5)) / total) * 100);

        setStats({ present, late, absent, total, rate });
        setRecords(sortedRecords);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    loadData();
  }, [user]);

  if (loading) {
    return (
      <Layout title="Dashboard" description="Here's how your club participation is going.">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="card h-24 animate-pulse bg-theme-bg/50"></div>)}
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard" description="Here's how your club participation is going.">
      
      {/* Team Status Alert */}
      <div className={`card p-4 mb-6 flex items-center gap-4 border-l-4 ${user?.teamId ? 'border-theme-present' : 'border-theme-late'}`}>
        <div className={`p-2 rounded-full ${user?.teamId ? 'bg-theme-present-bg text-theme-present' : 'bg-theme-late-bg text-theme-late'}`}>
          {user?.teamId ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
        </div>
        <div>
          <h4 className="font-semibold text-theme-primary text-sm">
            {user?.teamId ? 'Team Member' : 'External Member'}
          </h4>
          <p className="text-xs text-theme-text-secondary mt-0.5">
            {user?.teamId ? `You are currently assigned to ${teamName || 'a team'}.` : 'You have not been assigned to a team yet. A team leader will recruit you soon.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Attendance Rate" 
          value={`${stats.rate}%`} 
          subtitle="Overall score" 
          icon={TrendingUp}
          colorClass="bg-theme-accent-light text-theme-accent" 
        />
        <StatCard 
          title="Present" 
          value={stats.present} 
          subtitle="On time sessions" 
          icon={CheckSquare}
          colorClass="bg-theme-present-bg text-theme-present" 
        />
        <StatCard 
          title="Late" 
          value={stats.late} 
          subtitle="Delayed arrivals" 
          icon={Clock}
          colorClass="bg-theme-late-bg text-theme-late" 
        />
        <StatCard 
          title="Absent" 
          value={stats.absent} 
          subtitle="Missed sessions" 
          icon={XCircle}
          colorClass="bg-theme-absent-bg text-theme-absent" 
        />
      </div>

      {records.length > 0 ? (
        <div className="mb-12">
          <IndividualAnalytics records={records} />
        </div>
      ) : (
        <div className="card p-12 text-center flex flex-col items-center mb-8">
          <Calendar className="w-10 h-10 text-theme-muted mb-3" />
          <p className="text-theme-text font-medium mb-1">No attendance data yet</p>
          <p className="text-sm text-theme-text-secondary">Your attendance will appear here once recorded.</p>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="px-6 py-5 border-b border-theme-border-subtle flex items-center justify-between">
          <h3 className="font-semibold text-theme-primary">Recent History</h3>
          <Link to="/member/attendance" className="text-xs font-semibold text-theme-accent hover:text-theme-primary transition-colors">
            View All &rarr;
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.slice(0, 5).map(r => {
                let badgeClass = '';
                if (r.status === 'Present') badgeClass = 'bg-theme-present-bg text-theme-present';
                else if (r.status === 'Late') badgeClass = 'bg-theme-late-bg text-theme-late';
                else if (r.status === 'Absent') badgeClass = 'bg-theme-absent-bg text-theme-absent';

                return (
                  <tr key={r.id}>
                    <td className="font-medium text-theme-primary">{new Date(r.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                    <td>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${badgeClass}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default MemberDashboard;
