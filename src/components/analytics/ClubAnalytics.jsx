import React, { useMemo } from 'react';
import { calculateRate, formatPercentage } from '../../utils/analyticsUtils';

import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';

export const ClubAnalytics = ({ records, teams }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const accentColor = isDark ? 'var(--color-accent)' : '#3949AB';
  const gridColor = isDark ? 'var(--color-border)' : '#D9DCE3';
  const axisColor = isDark ? 'var(--color-muted)' : '#6B7280';
  const presentColor = isDark ? 'var(--color-present)' : '#16A34A';
  const absentColor = isDark ? 'var(--color-absent)' : '#DC2626';

  // 1. Trend Data (Date vs Attendance %)
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
        
        return {
          ...d,
          rate: calculateRate(d.present, d.absent)
        };
      });
  }, [records]);

  // 2. Distribution Data (Donut)
  const distributionData = useMemo(() => {
    let p = 0, a = 0, l = 0;
    records.forEach(r => {
      if (r.status === 'Present') p++;
      if (r.status === 'Absent') a++;
      if (r.status === 'Late') l++;
    });
    return [
      { name: 'Present', value: p, color: presentColor },
      { name: 'Late', value: l, color: '#eab308' },
      { name: 'Absent', value: a, color: absentColor }
    ].filter(d => d.value > 0);
  }, [records, presentColor, absentColor]);

  const pCount = distributionData.find(d=>d.name==='Present')?.value || 0;
  const aCount = distributionData.find(d=>d.name==='Absent')?.value || 0;
  const lCount = distributionData.find(d=>d.name==='Late')?.value || 0;
  const validTotal = pCount + aCount + lCount;
  const overallRate = validTotal === 0 ? 0 : calculateRate(pCount, aCount);

  const teamData = useMemo(() => {
    const tMap = {};
    teams.forEach(t => {
      tMap[t.id] = { name: t.name, present: 0, absent: 0, late: 0 };
    });
    records.forEach(r => {
      if (tMap[r.teamId]) {
        if (r.status === 'Present') tMap[r.teamId].present += 1;
        if (r.status === 'Absent') tMap[r.teamId].absent += 1;
        if (r.status === 'Late') tMap[r.teamId].late += 1;
      }
    });
    return Object.values(tMap)
      .filter(t => t.present + t.absent + t.late > 0)
      .map(t => {
        return {
          ...t,
          rate: calculateRate(t.present, t.absent)
        };
      })
      .sort((a, b) => b.rate - a.rate); // Sort descending
  }, [records, teams]);

  if (records.length === 0) {
    return null;
  }

  const CustomTooltipTrend = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-theme-surface-higher p-3 border border-theme-border rounded-lg shadow-float min-w-[150px]">
          <p className="text-sm font-bold text-theme-primary mb-2">{data.date || label}</p>
          <p className="text-sm text-theme-text-secondary">Present: {data.present}</p>
          <p className="text-sm text-theme-text-secondary">Absent: {data.absent}</p>
          <p className="text-sm font-bold mt-2" style={{color: accentColor}}>Attendance: {formatPercentage(data.rate)}%</p>
        </div>
      );
    }
    return null;
  };

  const CustomTooltipTeam = ({ active, payload, label }) => {
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

  const renderCustomLegend = (props) => {
    const { payload } = props;
    return (
      <div className="flex justify-center gap-6 mt-4">
        {payload.map((entry, index) => {
          const { value: name, color, payload: dataPayload } = entry;
          const pct = validTotal > 0 ? ((dataPayload.value / validTotal) * 100).toFixed(2) : 0;
          return (
            <div key={`item-${index}`} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
              <div>
                <div className="text-sm font-bold text-theme-text">{name}</div>
                <div className="text-xs text-theme-text-secondary">{dataPayload.value} ({pct}%)</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Custom label for horizontal bar chart to show percentage at the end
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Attendance Trend (Line Chart) */}
      <div className="card p-6 lg:col-span-2 flex flex-col bg-theme-surface">
        <h3 className="font-bold text-theme-primary mb-6">Attendance Trend</h3>
        <div className="flex-1 min-h-[250px]">
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
                paddingAngle={2}
                dataKey="value"
                stroke="none"
                isAnimationActive={true}
                animationDuration={1000}
              >
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend content={renderCustomLegend} verticalAlign="bottom" />
              {/* Optional default tooltip just in case */}
              <Tooltip formatter={(value) => [value, 'Count']} contentStyle={{backgroundColor: 'var(--color-surface-higher)', borderColor: 'var(--color-border)', borderRadius: '8px'}} itemStyle={{color: 'var(--color-text)'}} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mb-10">
            <span className="text-3xl font-bold text-theme-primary drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">{formatPercentage(overallRate)}%</span>
            <span className="text-[10px] uppercase font-bold text-theme-muted tracking-wider text-center max-w-[80px]">Overall Attendance</span>
          </div>
        </div>
      </div>

      {/* Team Performance (Horizontal Bar Chart) */}
      <div className="card p-6 lg:col-span-3 bg-theme-surface">
        <h3 className="font-bold text-theme-primary mb-6">Team Performance</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={teamData} layout="vertical" margin={{ top: 0, right: 50, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
              <XAxis type="number" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{fontSize: 12, fill: axisColor}} axisLine={{stroke: axisColor, strokeOpacity: 0.5}} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{fontSize: 12, fill: 'var(--color-text)', fontWeight: 500}} axisLine={{stroke: axisColor, strokeOpacity: 0.5}} tickLine={false} width={120} />
              <Tooltip cursor={{fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}} content={<CustomTooltipTeam />} />
              <Bar 
                dataKey="rate" 
                name="Attendance" 
                fill={accentColor} 
                radius={[0, 4, 4, 0]} 
                barSize={20}
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
