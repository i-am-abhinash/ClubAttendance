import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../context/AuthContext';
import { fetchAttendance } from '../../services/attendanceService';
import { Calendar, CheckSquare, Clock, XCircle, TrendingUp } from 'lucide-react';

const StatCard = ({ title, value, subtitle, icon: Icon, colorClass }) => (
  <div className="card p-6 flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold uppercase tracking-wider text-theme-muted">{title}</span>
      <div className={`p-2 rounded-lg ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <div className="flex flex-col gap-1">
      <span className="text-3xl font-bold text-theme-primary">{value}</span>
      <span className="text-xs font-medium text-theme-text-secondary">{subtitle}</span>
    </div>
  </div>
);

const MemberDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ present: 0, late: 0, absent: 0, total: 0, rate: 0 });
  const [recentRecords, setRecentRecords] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.uid) return;
      setLoading(true);
      try {
        const records = await fetchAttendance();
        const myRecords = records.filter(r => r.userId === user.uid).sort((a, b) => b.date.localeCompare(a.date));
        
        let present = 0, late = 0, absent = 0;
        myRecords.forEach(r => {
          if (r.status === 'Present') present++;
          else if (r.status === 'Late') late++;
          else if (r.status === 'Absent') absent++;
        });

        const total = present + late + absent;
        const rate = total === 0 ? 0 : Math.round((present + late) / total * 100);

        setStats({ present, late, absent, total, rate });
        setRecentRecords(myRecords.slice(0, 5));
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    loadData();
  }, [user]);

  if (loading) {
    return (
      <Layout title={`Welcome back, ${user?.name || ''}`} description="Here's how your club participation is going.">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="card h-32 animate-pulse bg-theme-bg/50"></div>)}
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Welcome back, ${user?.name || ''}`} description="Here's how your club participation is going.">
      
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <Link to="/member/attendance" className="btn-secondary flex items-center gap-2">
          <Calendar className="w-4 h-4" /> View Full History
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
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

      <div className="card overflow-hidden">
        <div className="px-6 py-5 border-b border-theme-border-subtle flex items-center justify-between">
          <h3 className="font-semibold text-theme-primary">Recent Attendance</h3>
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
              {recentRecords.map(r => {
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
              {recentRecords.length === 0 && (
                <tr>
                  <td colSpan="2" className="text-center py-12 text-theme-text-secondary">
                    <Calendar className="w-10 h-10 text-theme-muted mx-auto mb-4" />
                    <p>There isn't any attendance data for you yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default MemberDashboard;
