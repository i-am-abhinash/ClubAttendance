import React, { useMemo } from 'react';
import { 
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { parseISO, format, subDays, isAfter } from 'date-fns';

export const IndividualAnalytics = ({ records }) => {
  
  // 1. Monthly Attendance Trend
  const monthlyData = useMemo(() => {
    const monthMap = {};
    records.forEach(r => {
      const date = parseISO(r.date);
      const monthKey = format(date, 'MMM yyyy'); // e.g. "Sep 2026"
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { name: monthKey, dateVal: date, present: 0, late: 0, total: 0 };
      }
      monthMap[monthKey].total += 1;
      if (r.status === 'Present') monthMap[monthKey].present += 1;
      if (r.status === 'Late') monthMap[monthKey].late += 1;
    });

    return Object.values(monthMap)
      .sort((a, b) => a.dateVal - b.dateVal)
      .map(d => ({
        name: d.name,
        rate: Math.round(((d.present + (d.late * 0.5)) / d.total) * 100)
      }));
  }, [records]);

  // 2. Weekly Behavior (Last 7 Days)
  const weeklyData = useMemo(() => {
    const sevenDaysAgo = subDays(new Date(), 7);
    const recent = records.filter(r => isAfter(parseISO(r.date), sevenDaysAgo));
    
    // Create a map of the last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i);
      days.push({
        dateStr: format(d, 'yyyy-MM-dd'),
        display: format(d, 'EEE'), // Mon, Tue
        status: null, // null means no session
        color: '#1E2A3A' // default dark gray
      });
    }

    // Fill in records
    recent.forEach(r => {
      const day = days.find(d => d.dateStr === r.date);
      if (day) {
        day.status = r.status;
        if (r.status === 'Present') day.color = '#34D399';
        else if (r.status === 'Late') day.color = '#FBBF24';
        else if (r.status === 'Absent') day.color = '#FB7185';
      }
    });

    return days;
  }, [records]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-theme-surface-higher p-3 border border-theme-border rounded-lg shadow-float">
          <p className="text-xs font-bold text-theme-muted mb-1">{label}</p>
          <p className="text-sm font-medium text-theme-primary">
            {payload[0].name === 'rate' ? 'Attendance' : payload[0].name}: {payload[0].value}{payload[0].name === 'rate' ? '%' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomWeeklyTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-theme-surface-higher p-3 border border-theme-border rounded-lg shadow-float">
          <p className="text-xs font-bold text-theme-muted mb-1">{data.dateStr}</p>
          <p className="text-sm font-medium drop-shadow-[0_0_8px_currentColor]" style={{ color: data.color }}>
            {data.status || 'No Session'}
          </p>
        </div>
      );
    }
    return null;
  };

  if (records.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Monthly Trend */}
      <div className="card p-6 bg-gradient-to-br from-theme-surface to-[#0B111D]">
        <h3 className="font-bold text-theme-primary mb-6">Monthly Attendance</h3>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E2A3A" />
              <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748B'}} axisLine={false} tickLine={false} dy={10} />
              <YAxis domain={[0, 100]} tick={{fontSize: 12, fill: '#64748B'}} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="rate" name="rate" stroke="#38BDF8" strokeWidth={3} dot={{r: 4, fill: '#38BDF8', strokeWidth: 2, stroke: '#0D1420'}} activeDot={{r: 6}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Behavior */}
      <div className="card p-6 bg-gradient-to-br from-theme-surface to-[#0B111D]">
        <h3 className="font-bold text-theme-primary mb-6">Recent Weekly Behavior</h3>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E2A3A" />
              <XAxis dataKey="display" tick={{fontSize: 12, fill: '#64748B'}} axisLine={false} tickLine={false} dy={10} />
              <YAxis hide domain={[0, 1]} />
              <Tooltip cursor={{fill: '#111B2A'}} content={<CustomWeeklyTooltip />} />
              <Bar dataKey={() => 1} radius={[4, 4, 4, 4]} barSize={24}>
                {weeklyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 mt-4 justify-center">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] bg-theme-present text-theme-present"></div><span className="text-[10px] text-theme-text-secondary uppercase font-semibold">Present</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] bg-theme-late text-theme-late"></div><span className="text-[10px] text-theme-text-secondary uppercase font-semibold">Late</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] bg-theme-absent text-theme-absent"></div><span className="text-[10px] text-theme-text-secondary uppercase font-semibold">Absent</span></div>
        </div>
      </div>

    </div>
  );
};
