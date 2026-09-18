import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../context/AuthContext';
import { fetchAttendance } from '../../services/attendanceService';
import { fetchMembers } from '../../services/memberService';
import { calculateAttendanceStats } from '../../utils/analyticsUtils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

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

  return (
    <Layout title="Team Analysis">
      <div className="mb-6 flex justify-between items-center">
        <h3 className="text-lg font-medium text-slate-900">Attendance Overview</h3>
        <select 
          className="border border-slate-300 rounded-md py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={period}
          onChange={e => setPeriod(e.target.value)}
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading charts...</p>
      ) : stats ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <p className="text-sm text-slate-500 font-medium">Rate</p>
              <p className="text-2xl font-bold text-indigo-600">{stats.percentage}%</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <p className="text-sm text-slate-500 font-medium">Present</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.present}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <p className="text-sm text-slate-500 font-medium">Absent</p>
              <p className="text-2xl font-bold text-rose-600">{stats.absent}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <p className="text-sm text-slate-500 font-medium">Late</p>
              <p className="text-2xl font-bold text-amber-500">{stats.late}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h4 className="text-md font-medium text-slate-800 mb-4">Daily Trend</h4>
              <div className="h-72 w-full">
                {stats.trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
                      <YAxis tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Legend iconType="circle" wrapperStyle={{fontSize: '12px'}} />
                      <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981'}} />
                      <Line type="monotone" dataKey="absent" stroke="#f43f5e" strokeWidth={3} dot={{r: 4, fill: '#f43f5e'}} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <p className="text-slate-400 text-center mt-20">No data available</p>}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h4 className="text-md font-medium text-slate-800 mb-4">Member Breakdown</h4>
              <div className="h-72 w-full">
                {stats.memberChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.memberChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
                      <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Legend iconType="circle" wrapperStyle={{fontSize: '12px'}} />
                      <Bar dataKey="Present" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Late" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Absent" stackId="a" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-slate-400 text-center mt-20">No data available</p>}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Layout>
  );
};

export default TeamAnalysis;
