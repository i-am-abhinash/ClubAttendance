import { isSameDay, isSameWeek, isSameMonth, parseISO, format, subMonths, startOfMonth, eachMonthOfInterval } from 'date-fns';

/**
 * MITRA Attendance Policy — Single Source of Truth
 * ─────────────────────────────────────────────────
 * Present = 1.0 point
 * Late    = 0.5 points
 * Absent  = 0.0 points
 *
 * Attendance % = (present + late × 0.5) / (present + late + absent) × 100
 *
 * NOTE: Records with no status (not marked) are NOT counted in the denominator.
 */

/**
 * Calculate the attendance rate given raw counts.
 * @param {number} present
 * @param {number} late
 * @param {number} absent
 * @returns {number} percentage 0–100 (full precision)
 */
export const calculateAttendanceRate = (present = 0, late = 0, absent = 0) => {
  const total = present + late + absent;
  if (total === 0) return 0;
  return ((present + late * 0.5) / total) * 100;
};

/**
 * Legacy alias — kept so existing callers that pass (present, absent) still work.
 * If you need the correct Late-aware calculation use calculateAttendanceRate().
 * @deprecated prefer calculateAttendanceRate(present, late, absent)
 */
export const calculateRate = (present, absent) => {
  // Maintained for backward compatibility – treats late as 0
  const total = present + absent;
  if (total === 0) return 0;
  return (present / total) * 100;
};

/**
 * Format a percentage for display.
 * - If it has no fractional part → "50"
 * - Otherwise → "49.53" (2 decimal places)
 * Never shows raw floating point noise.
 * @param {number} value
 * @returns {string}
 */
export const formatPercentage = (value) => {
  if (typeof value !== 'number' || isNaN(value)) return '0';
  if (value % 1 === 0) return value.toString();
  return value.toFixed(2);
};

/**
 * Calculate comprehensive attendance statistics from an array of records.
 * Uses the official MITRA formula (Present=1, Late=0.5, Absent=0).
 *
 * @param {Array} records  - Array of attendance record objects
 * @param {Array} members  - (unused, kept for API compatibility)
 * @returns {{ total, present, absent, late, percentage, totalRecords, trendData }}
 */
export const calculateAttendanceStats = (records = [], members = []) => {
  const total = records.length;
  const present = records.filter(r => r.status === 'Present').length;
  const absent = records.filter(r => r.status === 'Absent').length;
  const late = records.filter(r => r.status === 'Late').length;

  // Official formula
  const percentage = calculateAttendanceRate(present, late, absent);

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
      rate: calculateAttendanceRate(mPresent, mLate, mAbsent)
    };
  });

  return { total, present, absent, late, percentage, totalRecords: total, trendData };
};

/**
 * Apply filters to an array of attendance records.
 */
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
