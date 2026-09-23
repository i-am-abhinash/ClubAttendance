import React, { useMemo } from 'react';
import { calculateRate, formatPercentage } from '../../utils/analyticsUtils';

import { 
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { parseISO, format, startOfWeek, subWeeks } from 'date-fns';
import { useTheme } from '../../context/ThemeContext';

export const IndividualAnalytics = ({ records }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const accentColor = isDark ? 'var(--color-accent)' : '#3949AB';
  const gridColor = isDark ? 'var(--color-border)' : '#D9DCE3';
  const axisColor = isDark ? 'var(--color-muted)' : '#6B7280';

  // 1. Monthly Attendance Trend (Bar Chart)
  const monthlyData = useMemo(() => {
    const monthMap = {};
    records.forEach(r => {
      const date = parseISO(r.date);
      const monthKey = format(date, 'MMM yyyy'); // e.g. "Sep 2026"
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { name: monthKey, dateVal: date, present: 0, absent: 0 };
      }
      if (r.status === 'Present') monthMap[monthKey].present += 1;
      if (r.status === 'Absent') monthMap[monthKey].absent += 1;
    });

    return Object.values(monthMap)
      .sort((a, b) => a.dateVal - b.dateVal)
      .map(d => {
        const total = d.present + d.absent;
        return {
          name: format(d.dateVal, 'MMM'),
          fullMonth: d.name,
          present: d.present,
          absent: d.absent,
          rate: total === 0 ? 0 : calculateRate(d.present, d.absent)
        };
      });
  }, [records]);

  // 2. Weekly Trend
  const weeklyData = useMemo(() => {
    const weekMap = {};
    records.forEach(r => {
      const date = parseISO(r.date);
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const weekKey = format(weekStart, 'MMM d');
      if (!weekMap[weekKey]) {
        weekMap[weekKey] = { name: `Week of ${weekKey}`, dateVal: weekStart, present: 0, absent: 0 };
      }
      if (r.status === 'Present') weekMap[weekKey].present += 1;
      if (r.status === 'Absent') weekMap[weekKey].absent += 1;
    });

    return Object.values(weekMap)
      .sort((a, b) => a.dateVal - b.dateVal)
      .slice(-8) // Show last 8 weeks max
      .map(d => {
        const total = d.present + d.absent;
        return {
          name: d.name,
          present: d.present,
          absent: d.absent,
          rate: total === 0 ? 0 : calculateRate(d.present, d.absent)
        };
      });
  }, [records]);

  const CustomTooltipMonthly = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-theme-surface-higher p-3 border border-theme-border rounded-lg shadow-float min-w-[150px]">
          <p className="text-sm font-bold text-theme-primary mb-2">{data.fullMonth || label}</p>
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
          <p className="text-sm font-bold text-theme-primary mb-2">{data.name}</p>
          <p className="text-sm text-theme-text-secondary">Present: {data.present}</p>
          <p className="text-sm text-theme-text-secondary">Absent: {data.absent}</p>
          <p className="text-sm font-bold mt-2" style={{color: accentColor}}>Attendance: {formatPercentage(data.rate)}%</p>
        </div>
      );
    }
    return null;
  };

  if (records.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Monthly Trend */}
      <div className="card p-6 bg-theme-surface">
        <h3 className="font-bold text-theme-primary mb-6">Monthly Attendance</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis dataKey="name" tick={{fontSize: 12, fill: axisColor}} axisLine={{stroke: axisColor, strokeOpacity: 0.5}} tickLine={false} dy={10} />
              <YAxis ticks={[0, 25, 50, 75, 100]} domain={[0, 100]} tick={{fontSize: 12, fill: axisColor}} axisLine={{stroke: axisColor, strokeOpacity: 0.5}} tickLine={false} />
              <Tooltip cursor={{fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}} content={<CustomTooltipMonthly />} />
              <Bar 
                dataKey="rate" 
                fill={accentColor} 
                radius={[4, 4, 0, 0]} 
                barSize={30}
                isAnimationActive={true}
                animationDuration={1000}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Trend */}
      <div className="card p-6 bg-theme-surface">
        <h3 className="font-bold text-theme-primary mb-6">Weekly Attendance Trend</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis dataKey="name" tickFormatter={(v) => v.replace('Week of ', '')} tick={{fontSize: 12, fill: axisColor}} axisLine={{stroke: axisColor, strokeOpacity: 0.5}} tickLine={false} dy={10} />
              <YAxis ticks={[0, 25, 50, 75, 100]} domain={[0, 100]} tick={{fontSize: 12, fill: axisColor}} axisLine={{stroke: axisColor, strokeOpacity: 0.5}} tickLine={false} />
              <Tooltip content={<CustomTooltipWeekly />} />
              <Line 
                type="linear" 
                dataKey="rate" 
                stroke={accentColor} 
                strokeWidth={2} 
                dot={{r: 4, fill: accentColor, strokeWidth: 0}} 
                activeDot={{r: 6, fill: accentColor, stroke: 'var(--color-bg)', strokeWidth: 2}}
                isAnimationActive={true}
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
