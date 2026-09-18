import React, { useMemo } from 'react';
import { 
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { parseISO, format, getDay } from 'date-fns';

export const TeamAnalytics = ({ records, members }) => {
  
  // 1. Weekly Attendance (Mon-Sun grouped bar)
  const weeklyData = useMemo(() => {
    // days: 0 = Sun, 1 = Mon ... 6 = Sat. We want Mon-Sun
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const map = [
      { name: 'Mon', Present: 0, Late: 0, Absent: 0 },
      { name: 'Tue', Present: 0, Late: 0, Absent: 0 },
      { name: 'Wed', Present: 0, Late: 0, Absent: 0 },
      { name: 'Thu', Present: 0, Late: 0, Absent: 0 },
      { name: 'Fri', Present: 0, Late: 0, Absent: 0 },
      { name: 'Sat', Present: 0, Late: 0, Absent: 0 },
      { name: 'Sun', Present: 0, Late: 0, Absent: 0 },
    ];
    
    // JS getDay(): 0 is Sunday, 1 is Monday.
    // Our map: index 0 is Mon, 6 is Sun.
    const dayToIndex = (d) => d === 0 ? 6 : d - 1;

    records.forEach(r => {
      const date = parseISO(r.date);
      const dayIndex = dayToIndex(getDay(date));
      if (r.status === 'Present') map[dayIndex].Present += 1;
      if (r.status === 'Late') map[dayIndex].Late += 1;
      if (r.status === 'Absent') map[dayIndex].Absent += 1;
    });

    return map;
  }, [records]);

  // 2. Trend Data
  const trendData = useMemo(() => {
    const dateMap = {};
    records.forEach(r => {
      if (!dateMap[r.date]) dateMap[r.date] = { date: r.date, present: 0, late: 0, total: 0 };
      dateMap[r.date].total += 1;
      if (r.status === 'Present') dateMap[r.date].present += 1;
      if (r.status === 'Late') dateMap[r.date].late += 1;
    });

    return Object.values(dateMap)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(d => ({
        date: format(parseISO(d.date), 'MMM d'),
        rate: Math.round(((d.present + (d.late * 0.5)) / d.total) * 100)
      }));
  }, [records]);

  // 3. Member Comparison
  const memberData = useMemo(() => {
    const mMap = {};
    members.forEach(m => {
      mMap[m.id] = { name: m.name, total: 0, score: 0 };
    });
    records.forEach(r => {
      if (mMap[r.userId]) {
        mMap[r.userId].total += 1;
        if (r.status === 'Present') mMap[r.userId].score += 1;
        if (r.status === 'Late') mMap[r.userId].score += 0.5;
      }
    });
    return Object.values(mMap)
      .filter(m => m.total > 0)
      .map(m => ({
        name: m.name,
        rate: Math.round((m.score / m.total) * 100)
      }))
      .sort((a, b) => b.rate - a.rate);
  }, [records, members]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-theme-border rounded-lg shadow-lg">
          <p className="text-xs font-bold text-theme-muted mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} className="text-sm font-medium" style={{ color: entry.color }}>
              {entry.name}: {entry.value}{entry.name === 'rate' || entry.name === 'Attendance' ? '%' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (records.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Trend */}
      <div className="card p-6 lg:col-span-2">
        <h3 className="font-bold text-theme-primary mb-6">Team Attendance Trend</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5865F2" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#5865F2" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="date" tick={{fontSize: 12, fill: '#94A3B8'}} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{fontSize: 12, fill: '#94A3B8'}} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="rate" name="Attendance" stroke="#5865F2" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Breakdown */}
      <div className="card p-6">
        <h3 className="font-bold text-theme-primary mb-6">Weekly Distribution</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{fontSize: 12, fill: '#94A3B8'}} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{fontSize: 12, fill: '#94A3B8'}} axisLine={false} tickLine={false} />
              <Tooltip cursor={{fill: '#F7F8FA'}} content={<CustomTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="Present" fill="#16866A" radius={[2, 2, 0, 0]} barSize={12} stackId="a" />
              <Bar dataKey="Late" fill="#C98A24" radius={[0, 0, 0, 0]} barSize={12} stackId="a" />
              <Bar dataKey="Absent" fill="#D9536F" radius={[0, 0, 0, 0]} barSize={12} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Member Comparison */}
      <div className="card p-6">
        <h3 className="font-bold text-theme-primary mb-6">Member Comparison</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={memberData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
              <XAxis type="number" domain={[0, 100]} tick={{fontSize: 12, fill: '#94A3B8'}} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{fontSize: 11, fill: '#172033', fontWeight: 500}} axisLine={false} tickLine={false} width={80} />
              <Tooltip cursor={{fill: '#F7F8FA'}} content={<CustomTooltip />} />
              <Bar dataKey="rate" name="Attendance" fill="#5865F2" radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
