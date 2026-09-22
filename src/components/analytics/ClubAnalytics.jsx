import React, { useMemo } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export const ClubAnalytics = ({ records, teams }) => {
  // 1. Trend Data (Date vs Attendance %)
  const trendData = useMemo(() => {
    const dateMap = {};
    records.forEach(r => {
      if (!dateMap[r.date]) dateMap[r.date] = { date: r.date, present: 0, late: 0, total: 0, absent: 0 };
      dateMap[r.date].total += 1;
      if (r.status === 'Present') dateMap[r.date].present += 1;
      if (r.status === 'Late') dateMap[r.date].late += 1;
      if (r.status === 'Absent') dateMap[r.date].absent += 1;
    });

    return Object.values(dateMap)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(d => ({
        ...d,
        rate: Math.round(((d.present + (d.late * 0.5)) / d.total) * 100)
      }));
  }, [records]);

  // 2. Distribution Data (Donut)
  const distributionData = useMemo(() => {
    let p = 0, l = 0, a = 0;
    records.forEach(r => {
      if (r.status === 'Present') p++;
      if (r.status === 'Late') l++;
      if (r.status === 'Absent') a++;
    });
    return [
      { name: 'Present', value: p, color: 'var(--color-present)' },
      { name: 'Late', value: l, color: 'var(--color-late)' },
      { name: 'Absent', value: a, color: 'var(--color-absent)' }
    ].filter(d => d.value > 0);
  }, [records]);

  const overallRate = records.length === 0 ? 0 : 
    Math.round(((distributionData.find(d=>d.name==='Present')?.value || 0) + ((distributionData.find(d=>d.name==='Late')?.value || 0) * 0.5)) / records.length * 100);

  // 3. Team Performance Data (Bar Chart)
  const teamData = useMemo(() => {
    const tMap = {};
    teams.forEach(t => {
      tMap[t.id] = { name: t.name, total: 0, score: 0 };
    });
    records.forEach(r => {
      if (tMap[r.teamId]) {
        tMap[r.teamId].total += 1;
        if (r.status === 'Present') tMap[r.teamId].score += 1;
        if (r.status === 'Late') tMap[r.teamId].score += 0.5;
      }
    });
    return Object.values(tMap)
      .filter(t => t.total > 0)
      .map(t => ({
        name: t.name,
        rate: Math.round((t.score / t.total) * 100)
      }))
      .sort((a, b) => b.rate - a.rate); // Sort descending
  }, [records, teams]);

  if (records.length === 0) {
    return null; // The parent dashboard handles empty states generally, or we could return empty placeholder
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-theme-surface-higher p-3 border border-theme-border rounded-lg shadow-float">
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Attendance Trend */}
      <div className="card p-6 lg:col-span-2 flex flex-col bg-theme-surface">
        <h3 className="font-bold text-theme-primary mb-6">Attendance Trend</h3>
        <div className="flex-1 min-h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-text)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--color-text)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{fontSize: 12, fill: 'var(--color-muted)'}} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{fontSize: 12, fill: 'var(--color-muted)'}} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="rate" name="Attendance" stroke="var(--color-text)" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribution Donut */}
      <div className="card p-6 flex flex-col items-center justify-center relative bg-theme-surface">
        <h3 className="font-bold text-theme-primary mb-2 self-start w-full">Distribution</h3>
        <div className="w-full flex-1 min-h-[200px] relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={distributionData}
                innerRadius={65}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-bold text-theme-primary drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">{overallRate}%</span>
            <span className="text-[10px] uppercase font-bold text-theme-muted tracking-wider">Overall</span>
          </div>
        </div>
        <div className="flex gap-4 mt-2">
          {distributionData.map(d => (
            <div key={d.name} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: d.color, color: d.color }}></div>
              <span className="text-xs font-medium text-theme-text-secondary">{d.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Team Performance */}
      <div className="card p-6 lg:col-span-3 bg-theme-surface">
        <h3 className="font-bold text-theme-primary mb-6">Team Performance</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={teamData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
              <XAxis type="number" domain={[0, 100]} tick={{fontSize: 12, fill: 'var(--color-muted)'}} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{fontSize: 12, fill: 'var(--color-text-secondary)', fontWeight: 500}} axisLine={false} tickLine={false} width={100} />
              <Tooltip cursor={{fill: 'var(--color-surface-higher)'}} content={<CustomTooltip />} />
              <Bar dataKey="rate" name="Attendance" fill="var(--color-text)" radius={[0, 4, 4, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
