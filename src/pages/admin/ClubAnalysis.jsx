import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { fetchAttendance } from '../../services/attendanceService';
import { fetchMembers } from '../../services/memberService';
import { fetchTeams } from '../../services/teamService';
import { calculateAttendanceStats } from '../../utils/analyticsUtils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

const ClubAnalysis = () => {
  const [period, setPeriod] = useState('month');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [teams, setTeams] = useState([]);
  
  const [clubStats, setClubStats] = useState(null);
  const [teamStats, setTeamStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTeams = async () => {
      const t = await fetchTeams();
      setTeams(t);
    };
    loadTeams();
  }, []);

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

        const allMembers = await fetchMembers();
        const allRecords = await fetchAttendance(null, null, startDate, endDate);
        const calculatedClub = calculateAttendanceStats(allRecords, allMembers);
        setClubStats(calculatedClub);

        if (selectedTeam !== 'all') {
          const teamMembers = allMembers.filter(m => m.teamId === selectedTeam);
          const teamRecords = allRecords.filter(r => r.teamId === selectedTeam);
          const calculatedTeam = calculateAttendanceStats(teamRecords, teamMembers);
          setTeamStats(calculatedTeam);
        } else {
          setTeamStats(calculatedClub); // When 'all' is selected, teamStats is the same as clubStats
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };

    loadData();
  }, [period, selectedTeam]);

  return (
    <Layout title="Club Analysis">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-medium text-slate-900">Analysis Overview</h3>
        <div className="flex gap-4">
          <select 
            className="border border-slate-300 rounded-md py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            value={selectedTeam}
            onChange={e => setSelectedTeam(e.target.value)}
          >
            <option value="all">Overall Club (All Teams)</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <select 
            className="border border-slate-300 rounded-md py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            value={period}
            onChange={e => setPeriod(e.target.value)}
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-slate-500 bg-white p-4 rounded-xl shadow-sm">Loading charts...</p>
      ) : clubStats && teamStats ? (
        <div className="space-y-6">
          {/* Overall Club Stats - Always visible as baseline */}
          {selectedTeam !== 'all' && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6">
              <h4 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">Overall Club Baseline</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><p className="text-xs text-slate-500">Club Rate</p><p className="text-lg font-bold text-slate-700">{clubStats.percentage}%</p></div>
                <div><p className="text-xs text-slate-500">Total Present</p><p className="text-lg font-bold text-slate-700">{clubStats.present}</p></div>
                <div><p className="text-xs text-slate-500">Total Absent</p><p className="text-lg font-bold text-slate-700">{clubStats.absent}</p></div>
                <div><p className="text-xs text-slate-500">Total Late</p><p className="text-lg font-bold text-slate-700">{clubStats.late}</p></div>
              </div>
            </div>
          )}

          {/* Active Selection Stats */}
          <h4 className="text-md font-semibold text-slate-800">{selectedTeam === 'all' ? 'Overall Club Stats' : 'Selected Team Stats'}</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <p className="text-sm text-slate-500 font-medium">Attendance Rate</p>
              <p className="text-2xl font-bold text-indigo-600">{teamStats.percentage}%</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <p className="text-sm text-slate-500 font-medium">Total Present</p>
              <p className="text-2xl font-bold text-emerald-600">{teamStats.present}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <p className="text-sm text-slate-500 font-medium">Total Absent</p>
              <p className="text-2xl font-bold text-rose-600">{teamStats.absent}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <p className="text-sm text-slate-500 font-medium">Total Late</p>
              <p className="text-2xl font-bold text-amber-500">{teamStats.late}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h4 className="text-md font-medium text-slate-800 mb-4">Daily Trend</h4>
              <div className="h-72 w-full">
                {teamStats.trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={teamStats.trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
                      <YAxis tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Legend iconType="circle" wrapperStyle={{fontSize: '12px'}} />
                      <Line type="monotone" dataKey="present" name="Present" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981'}} />
                      <Line type="monotone" dataKey="absent" name="Absent" stroke="#f43f5e" strokeWidth={3} dot={{r: 4, fill: '#f43f5e'}} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <p className="text-slate-400 text-center mt-20">No data available</p>}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 overflow-y-auto" style={{ maxHeight: '400px' }}>
              <h4 className="text-md font-medium text-slate-800 mb-4">Member Breakdown</h4>
              <div className="w-full" style={{ height: `${Math.max(300, teamStats.memberChartData.length * 40)}px` }}>
                {teamStats.memberChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={teamStats.memberChartData} layout="vertical" barSize={20}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
                      <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
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

export default ClubAnalysis;
