import { isSameDay, isSameWeek, isSameMonth, parseISO } from 'date-fns';

export const calculateAttendanceStats = (records, members = []) => {
  const total = records.length;
  const present = records.filter(r => r.status === 'Present').length;
  const absent = records.filter(r => r.status === 'Absent').length;
  const late = records.filter(r => r.status === 'Late').length;
  
  const percentage = total === 0 ? 0 : Math.round(((present + (late * 0.5)) / total) * 100);

  return { total, present, absent, late, percentage, totalRecords: total };
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
      const recordDate = parseISO(r.date);
      if (filters.timePeriod === 'today') return isSameDay(recordDate, now);
      if (filters.timePeriod === 'week') return isSameWeek(recordDate, now, { weekStartsOn: 1 });
      if (filters.timePeriod === 'month') return isSameMonth(recordDate, now);
      return true;
    });
  }

  return filtered;
};
