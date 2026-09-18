import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../context/AuthContext';
import { fetchAttendance } from '../../services/attendanceService';
import { fetchMembers } from '../../services/memberService';
import { calculateAttendanceStats } from '../../utils/analyticsUtils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { Calendar, Users } from 'lucide-react';

const TeamAnalysis = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState('month');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        let startDate, endDate;
        const today = new Date();
        if (period === 'week') {
          startDate = format(startOfWeek(today), 'yyyy-MM-dd');
          endDate = format(endOfWeek(today), 'yyyy-MM-dd');
        } else {
          startDate = format(startOfMonth(today), 'yyyy-MM-dd');
          endDate = format(endOfMonth(today), 'yyyy-MM-dd');
        }

        const members = await fetchMembers(user.teamId);
        const records = await fetchAttendance(user.teamId, null, startDate, endDate);
        
        const calculated = calculateAttendanceStats(records, members);
        setStats(calculated);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };

    loadData();
  }, [period, user.teamId]);

  const chartColors = {
    present: '#16866A',
    late: '#C98A24',
    absent: '#D9536F',
    grid: '#F3F4F6',
    text: '#94A3B8'
  };

  return (
    <Layout title="Team Analytics" description="Detailed insights into your team's attendance.">
      
      {/* Controls */}
      <div className="card p-4 mb-8 flex flex-col sm:flex-row justify-between items-center bg-white border-theme-border-subtle">
        <h3 className="text-sm font-bold text-theme-primary uppercase tracking-wider mb-4 sm:mb-0">Overview</h3>
        <div className="relative w-full sm:w-48">
          <select 
            className="w-full appearance-none bg-theme-bg border border-theme-border rounded-lg py-2 pl-4 pr-10 text-sm focus:outline-none focus:border-theme-accent font-medium text-theme-primary"
            value={period}
            onChange={e => setPeriod(e.target.value)}
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <Calendar className="w-4 h-4 text-theme-muted absolute right-3 top-2.5 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="card p-12 text-center">
          <div className="w-6 h-6 border-2 border-theme-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-theme-text-secondary">Loading analytics...</p>
        </div>
      ) : stats ? (
        <div className="space-y-8">
          
          {/* Top Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-5 border-theme-border-subtle hover:border-theme-border transition-colors">
              <p className="text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">Attendance Rate</p>
              <p className="text-3xl font-bold text-theme-primary">{stats.percentage}%</p>
            </div>
            <div className="card p-5 border-theme-border-subtle hover:border-theme-border transition-colors">
              <p className="text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">Total Present</p>
              <p className="text-3xl font-bold text-theme-present">{stats.present}</p>
            </div>
            <div className="card p-5 border-theme-border-subtle hover:border-theme-border transition-colors">
              <p className="text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">Total Late</p>
              <p className="text-3xl font-bold text-theme-late">{stats.late}</p>
            </div>
            <div className="card p-5 border-theme-border-subtle hover:border-theme-border transition-colors">
              <p className="text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">Total Absent</p>
              <p className="text-3xl font-bold text-theme-absent">{stats.absent}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Daily Trend Chart */}
            <div className="card p-6 border-theme-border-subtle">
              <h4 className="text-sm font-bold text-theme-primary uppercase tracking-wider mb-6">Daily Trend</h4>
              <div className="h-72 w-full">
                {stats.trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                      <XAxis dataKey="date" tick={{fontSize: 11, fill: chartColors.text}} tickLine={false} axisLine={false} dy={10} />
                      <YAxis tick={{fontSize: 11, fill: chartColors.text}} tickLine={false} axisLine={false} dx={-10} />
                      <Tooltip 
                        contentStyle={{borderRadius: '8px', border: '1px solid #EEF0F3', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'}} 
                        itemStyle={{fontSize: '12px', fontWeight: 500}}
                      />
                      <Legend iconType="circle" wrapperStyle={{fontSize: '11px', paddingTop: '10px'}} />
                      <Line type="monotone" dataKey="present" name="Present" stroke={chartColors.present} strokeWidth={2} dot={{r: 4, fill: chartColors.present, strokeWidth: 0}} activeDot={{r: 6}} />
                      <Line type="monotone" dataKey="absent" name="Absent" stroke={chartColors.absent} strokeWidth={2} dot={{r: 4, fill: chartColors.absent, strokeWidth: 0}} activeDot={{r: 6}} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-sm text-theme-text-secondary">
                    <Calendar className="w-8 h-8 text-theme-muted mb-2" />
                    No trend data available for this period
                  </div>
                )}
              </div>
            </div>

            {/* Member Breakdown Chart */}
            <div className="card p-6 border-theme-border-subtle overflow-y-auto" style={{ maxHeight: '400px' }}>
              <h4 className="text-sm font-bold text-theme-primary uppercase tracking-wider mb-6">Member Breakdown</h4>
              <div className="w-full" style={{ height: `${Math.max(280, stats.memberChartData.length * 45)}px` }}>
                {stats.memberChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.memberChartData} layout="vertical" barSize={16} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartColors.grid} />
                      <XAxis type="number" tick={{fontSize: 11, fill: chartColors.text}} tickLine={false} axisLine={false} />
                      <YAxis dataKey="name" type="category" width={90} tick={{fontSize: 11, fill: chartColors.text, fontWeight: 500}} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{borderRadius: '8px', border: '1px solid #EEF0F3', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'}} 
                        itemStyle={{fontSize: '12px', fontWeight: 500}}
                        cursor={{fill: '#F7F8FA'}}
                      />
                      <Legend iconType="circle" wrapperStyle={{fontSize: '11px', paddingTop: '10px'}} />
                      <Bar dataKey="Present" stackId="a" fill={chartColors.present} radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Late" stackId="a" fill={chartColors.late} radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Absent" stackId="a" fill={chartColors.absent} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-sm text-theme-text-secondary">
                    <Users className="w-8 h-8 text-theme-muted mb-2" />
                    No member data available
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
      ) : null}
    </Layout>
  );
};

export default TeamAnalysis;
