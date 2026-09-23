import { isSameDay, isSameWeek, isSameMonth, parseISO, format, subMonths, startOfMonth, eachMonthOfInterval } from 'date-fns';

export const calculateRate = (present, absent) => {
  const validTotal = present + absent;
  if (validTotal === 0) return 0;
  return (present / validTotal) * 100;
};

export const formatPercentage = (value) => {
  if (typeof value !== 'number' || isNaN(value)) return '0';
  if (value % 1 === 0) return value.toString();
  return value.toFixed(2);
};

export const calculateAttendanceStats = (records, members = []) => {
  const total = records.length;
  const present = records.filter(r => r.status === 'Present').length;
  const absent = records.filter(r => r.status === 'Absent').length;
  const late = records.filter(r => r.status === 'Late').length;
  
  const percentage = calculateRate(present, absent);

  // Generate trendData based on the last 6 months
  const now = new Date();
  const past6Months = eachMonthOfInterval({
    start: subMonths(startOfMonth(now), 5),
    end: startOfMonth(now)
  });

  const trendData = past6Months.map(monthDate => {
    const monthStr = format(monthDate, 'MMM');
    const monthRecords = records.filter(r => r.date && isSameMonth(parseISO(r.date), monthDate));
    const mPresent = monthRecords.filter(r => r.status === 'Present').length;
    const mAbsent = monthRecords.filter(r => r.status === 'Absent').length;
    const mLate = monthRecords.filter(r => r.status === 'Late').length;
    
    return {
      date: monthStr,
      present: mPresent,
      absent: mAbsent,
      late: mLate,
      total: mPresent + mAbsent + mLate,
      rate: calculateRate(mPresent, mAbsent)
    };
  });

  return { total, present, absent, late, percentage, totalRecords: total, trendData };
};

export const applyFilters = (records, filters) => {
  let filtered = [...records];
  const now = new Date();

  if (filters.teamId && filters.teamId !== 'all') {
    filtered = filtered.filter(r => r.teamId === filters.teamId);
  }

  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter(r => r.status === filters.status);
  }

  if (filters.timePeriod && filters.timePeriod !== 'all') {
    filtered = filtered.filter(r => {
      if (!r.date) return false;

      if (filters.timePeriod === 'custom') {
        if (filters.customStart && r.date < filters.customStart) return false;
        if (filters.customEnd && r.date > filters.customEnd) return false;
        return true;
      }

      const recordDate = parseISO(r.date);
      if (filters.timePeriod === 'today') return isSameDay(recordDate, now);
      if (filters.timePeriod === 'week') return isSameWeek(recordDate, now, { weekStartsOn: 1 });
      if (filters.timePeriod === 'month') return isSameMonth(recordDate, now);
      return true;
    });
  }

  return filtered;
};
