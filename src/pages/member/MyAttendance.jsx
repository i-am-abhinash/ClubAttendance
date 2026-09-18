import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../context/AuthContext';
import { fetchAttendance } from '../../services/attendanceService';
import { calculateAttendanceStats } from '../../utils/analyticsUtils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar } from 'lucide-react';

const MyAttendance = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchAttendance(null, user.uid);
        const sortedData = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
        setRecords(sortedData);
        
        const calculated = calculateAttendanceStats(data, [{id: user.uid, role: 'Member'}]);
        setStats(calculated);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };

    loadData();
  }, [user.uid]);

  const chartColors = {
    present: '#16866A',
    absent: '#D9536F',
    grid: '#F3F4F6',
    text: '#94A3B8'
  };

  return (
    <Layout title="My Attendance" description="Review your complete attendance history.">
      {loading ? (
        <div className="card p-12 text-center">
          <div className="w-6 h-6 border-2 border-theme-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-theme-text-secondary">Loading your records...</p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card p-5 border-theme-border-subtle hover:border-theme-border transition-colors">
                <p className="text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">Overall Rate</p>
                <p className="text-3xl font-bold text-theme-primary">{stats.percentage}%</p>
              </div>
              <div className="card p-5 border-theme-border-subtle hover:border-theme-border transition-colors">
                <p className="text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">Present</p>
                <p className="text-3xl font-bold text-theme-present">{stats.present}</p>
              </div>
              <div className="card p-5 border-theme-border-subtle hover:border-theme-border transition-colors">
                <p className="text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">Late</p>
                <p className="text-3xl font-bold text-theme-late">{stats.late}</p>
              </div>
              <div className="card p-5 border-theme-border-subtle hover:border-theme-border transition-colors">
                <p className="text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">Absent</p>
                <p className="text-3xl font-bold text-theme-absent">{stats.absent}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart */}
            <div className="card p-6 border-theme-border-subtle lg:col-span-1">
              <h4 className="text-sm font-bold text-theme-primary uppercase tracking-wider mb-6">Your Trend</h4>
              <div className="h-64 w-full">
                {stats?.trendData?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                      <XAxis dataKey="date" tick={{fontSize: 11, fill: chartColors.text}} tickLine={false} axisLine={false} dy={10} />
                      <YAxis tick={{fontSize: 11, fill: chartColors.text}} tickLine={false} axisLine={false} dx={-10} />
                      <Tooltip 
                        contentStyle={{borderRadius: '8px', border: '1px solid #EEF0F3', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'}} 
                        itemStyle={{fontSize: '12px', fontWeight: 500}}
                      />
                      <Line type="monotone" dataKey="present" name="Present" stroke={chartColors.present} strokeWidth={2} dot={{r: 4, fill: chartColors.present, strokeWidth: 0}} />
                      <Line type="monotone" dataKey="absent" name="Absent" stroke={chartColors.absent} strokeWidth={2} dot={{r: 4, fill: chartColors.absent, strokeWidth: 0}} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-theme-text-secondary">Not enough data to show a trend.</div>
                )}
              </div>
            </div>

            {/* History Table */}
            <div className="card border-theme-border-subtle lg:col-span-2 overflow-hidden flex flex-col">
              <div className="p-6 border-b border-theme-border-subtle">
                <h4 className="text-sm font-bold text-theme-primary uppercase tracking-wider">Attendance Log</h4>
              </div>
              <div className="flex-1 overflow-y-auto" style={{ maxHeight: '400px' }}>
                {records.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center justify-center h-full">
                    <Calendar className="w-10 h-10 text-theme-muted mb-4" />
                    <p className="text-theme-text font-medium">No attendance records found.</p>
                  </div>
                ) : (
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map(record => {
                        let badgeClass = '';
                        if (record.status === 'Present') badgeClass = 'bg-theme-present-bg text-theme-present';
                        else if (record.status === 'Late') badgeClass = 'bg-theme-late-bg text-theme-late';
                        else if (record.status === 'Absent') badgeClass = 'bg-theme-absent-bg text-theme-absent';

                        return (
                          <tr key={record.id}>
                            <td className="font-medium text-theme-primary">
                              {new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
                            </td>
                            <td>
                              <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${badgeClass}`}>
                                {record.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

        </div>
      )}
    </Layout>
  );
};

export default MyAttendance;
