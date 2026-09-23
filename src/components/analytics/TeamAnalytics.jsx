import React, { useMemo } from 'react';
import { calculateRate, formatPercentage } from '../../utils/analyticsUtils';

import { 
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { parseISO, format, getDay } from 'date-fns';
import { useTheme } from '../../context/ThemeContext';

export const TeamAnalytics = ({ records, members }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const accentColor = isDark ? 'var(--color-accent)' : '#3949AB';
  const gridColor = isDark ? 'var(--color-border)' : '#D9DCE3';
  const axisColor = isDark ? 'var(--color-muted)' : '#6B7280';
  const presentColor = isDark ? 'var(--color-present)' : '#16A34A';
  const absentColor = isDark ? 'var(--color-absent)' : '#DC2626';

  // 1. Weekly Attendance (Mon-Sun grouped bar)
  const weeklyData = useMemo(() => {
    const map = [
      { name: 'Mon', Present: 0, Absent: 0 },
      { name: 'Tue', Present: 0, Absent: 0 },
      { name: 'Wed', Present: 0, Absent: 0 },
      { name: 'Thu', Present: 0, Absent: 0 },
      { name: 'Fri', Present: 0, Absent: 0 },
      { name: 'Sat', Present: 0, Absent: 0 },
      { name: 'Sun', Present: 0, Absent: 0 },
    ];
    
    const dayToIndex = (d) => d === 0 ? 6 : d - 1;

    records.forEach(r => {
      if (!r.date) return;
      const date = parseISO(r.date);
      const dayIndex = dayToIndex(getDay(date));
      if (r.status === 'Present') map[dayIndex].Present += 1;
      if (r.status === 'Absent') map[dayIndex].Absent += 1;
    });

    return map;
  }, [records]);

  // 2. Trend Data
  const trendData = useMemo(() => {
    const dateMap = {};
    records.forEach(r => {
      if (!dateMap[r.date]) dateMap[r.date] = { date: r.date, present: 0, absent: 0, late: 0 };
      if (r.status === 'Present') dateMap[r.date].present += 1;
      if (r.status === 'Absent') dateMap[r.date].absent += 1;
        if (r.status === 'Late') dateMap[r.date].late += 1;
    });

    return Object.values(dateMap)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(d => {
        const total = d.present + d.absent;
        return {
          dateVal: d.date,
          date: format(parseISO(d.date), 'MMM d'),
          present: d.present,
          absent: d.absent,
          rate: total === 0 ? 0 : calculateRate(d.present, d.absent)
        };
      });
  }, [records]);

  // 3. Member Comparison
  const memberData = useMemo(() => {
    const mMap = {};
    members.forEach(m => {
      mMap[m.id] = { name: m.name, present: 0, absent: 0, late: 0 };
    });
    records.forEach(r => {
      if (mMap[r.userId]) {
        if (r.status === 'Present') mMap[r.userId].present += 1;
        if (r.status === 'Absent') mMap[r.userId].absent += 1;
          if (r.status === 'Late') mMap[r.userId].late += 1;
      }
    });
    return Object.values(mMap)
      .filter(m => m.present + m.absent > 0)
      .map(m => {
        const total = m.present + m.absent;
        return {
          name: m.name,
          present: m.present,
          absent: m.absent,
          rate: calculateRate(m.present, m.absent)
        };
      })
      .sort((a, b) => b.rate - a.rate);
  }, [records, members]);

  const CustomTooltipTrend = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-theme-surface-higher p-3 border border-theme-border rounded-lg shadow-float min-w-[150px]">
          <p className="text-sm font-bold text-theme-primary mb-2">{data.dateVal || label}</p>
          <p className="text-sm text-theme-text-secondary">Present: {data.present}</p>
          <p className="text-sm text-theme-text-secondary">Absent: {data.absent}</p>
          <p className="text-sm font-bold mt-2" style={{color: accentColor}}>Attendance: {formatPercentage(data.rate)}%</p>
        </div>
      );
    }
    return null;
  };

  const CustomTooltipMember = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-theme-surface-higher p-3 border border-theme-border rounded-lg shadow-float min-w-[150px]">
          <p className="text-sm font-bold text-theme-primary mb-2">{data.name || label}</p>
          <p className="text-sm text-theme-text-secondary">Present: {data.present}</p>
          <p className="text-sm text-theme-text-secondary">Absent: {data.absent}</p>
          <p className="text-sm font-bold mt-2" style={{color: accentColor}}>Attendance: {formatPercentage(data.rate)}%</p>
        </div>
      );
    }
    return null;
  };

  const CustomTooltipWeekly = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-theme-surface-higher p-3 border border-theme-border rounded-lg shadow-float min-w-[150px]">
          <p className="text-sm font-bold text-theme-primary mb-2">{label}</p>
          <p className="text-sm text-theme-text-secondary">Present: {data.Present}</p>
          <p className="text-sm text-theme-text-secondary">Absent: {data.Absent}</p>
        </div>
      );
    }
    return null;
  };

  // Custom label for horizontal bar chart
  const renderCustomBarLabel = (props) => {
    const { x, y, width, height, value } = props;
    return (
      <text 
        x={x + width + 5} 
        y={y + height / 2} 
        fill={axisColor} 
        dy="0.35em" 
        fontSize={12} 
        fontWeight={600}
      >
        {value}%
      </text>
    );
  };

  if (records.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Trend */}
      <div className="card p-6 lg:col-span-2 bg-theme-surface">
        <h3 className="font-bold text-theme-primary mb-6">Team Attendance Trend</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 5, right: 30, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis dataKey="date" tick={{fontSize: 12, fill: axisColor}} axisLine={{stroke: axisColor, strokeOpacity: 0.5}} tickLine={false} dy={10} />
              <YAxis ticks={[0, 25, 50, 75, 100]} domain={[0, 100]} tick={{fontSize: 12, fill: axisColor}} axisLine={{stroke: axisColor, strokeOpacity: 0.5}} tickLine={false} />
              <Tooltip content={<CustomTooltipTrend />} />
              <Line 
                type="linear" 
                dataKey="rate" 
                name="Attendance" 
                stroke={accentColor} 
                strokeWidth={2}
                dot={{ r: 3, fill: accentColor, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: accentColor, stroke: 'var(--color-bg)', strokeWidth: 2 }}
                isAnimationActive={true}
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekday Breakdown */}
      <div className="card p-6 bg-theme-surface">
        <h3 className="font-bold text-theme-primary mb-6">Weekday Attendance Pattern</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis dataKey="name" tick={{fontSize: 12, fill: axisColor}} axisLine={{stroke: axisColor, strokeOpacity: 0.5}} tickLine={false} dy={10} />
              <YAxis tick={{fontSize: 12, fill: axisColor}} axisLine={{stroke: axisColor, strokeOpacity: 0.5}} tickLine={false} />
              <Tooltip cursor={{fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}} content={<CustomTooltipWeekly />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="Present" fill={presentColor} radius={[2, 2, 0, 0]} barSize={12} stackId="a" isAnimationActive={true} animationDuration={1000} />
              <Bar dataKey="Absent" fill={absentColor} radius={[0, 0, 0, 0]} barSize={12} stackId="a" isAnimationActive={true} animationDuration={1000} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Member Comparison */}
      <div className="card p-6 bg-theme-surface">
        <h3 className="font-bold text-theme-primary mb-6">Member Comparison</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={memberData} layout="vertical" margin={{ top: 0, right: 50, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
              <XAxis type="number" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{fontSize: 12, fill: axisColor}} axisLine={{stroke: axisColor, strokeOpacity: 0.5}} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{fontSize: 11, fill: 'var(--color-text)', fontWeight: 500}} axisLine={{stroke: axisColor, strokeOpacity: 0.5}} tickLine={false} width={100} />
              <Tooltip cursor={{fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}} content={<CustomTooltipMember />} />
              <Bar 
                dataKey="rate" 
                name="Attendance" 
                fill={accentColor} 
                radius={[0, 4, 4, 0]} 
                barSize={16}
                label={renderCustomBarLabel}
                isAnimationActive={true}
                animationDuration={1000}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
