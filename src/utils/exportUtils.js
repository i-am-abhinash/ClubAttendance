import * as xlsx from 'xlsx';
import { calculateAttendanceRate, formatPercentage } from './analyticsUtils';

/**
 * Export attendance data for a list of members to an .xlsx file.
 *
 * @param {Array} members   - Array of member objects
 * @param {Array} records   - Array of ALL attendance records (will be filtered per member)
 * @param {string} filename - Output filename (without .xlsx)
 */
export const exportAttendanceToExcel = (members = [], records = [], filename = 'Attendance_Report') => {
  if (!members || members.length === 0) {
    alert('No members to export.');
    return;
  }

  // Collect all unique dates across the provided records
  const dateSet = new Set();
  records.forEach(r => {
    if (r.date) dateSet.add(r.date);
  });
  const sortedDates = Array.from(dateSet).sort((a, b) => new Date(a) - new Date(b));

  const exportData = members.map(member => {
    const memberRecords = records.filter(r => r.userId === member.id);
    const present = memberRecords.filter(r => r.status === 'Present').length;
    const late    = memberRecords.filter(r => r.status === 'Late').length;
    const absent  = memberRecords.filter(r => r.status === 'Absent').length;

    // Official MITRA formula
    const percentage = calculateAttendanceRate(present, late, absent);

    const row = {
      'Name': member.name || 'Unknown',
      'Regd No': member.regdNo || 'N/A',
      'Email': member.email || 'N/A',
      'Branch': member.branch || 'N/A',
      'Team': member.teamId || 'External',
      'Role': member.role || 'Member',
    };

    // Per-date columns
    sortedDates.forEach(date => {
      const record = memberRecords.find(r => r.date === date);
      if (record) {
        row[date] = record.status; // 'Present', 'Late', or 'Absent'
      } else {
        row[date] = ''; // Blank if not marked
      }
    });

    row['Total Present'] = present;
    row['Total Late']    = late;
    row['Total Absent']  = absent;
    row['Attendance %']  = `${formatPercentage(percentage)}%`;

    return row;
  });

  const worksheet = xlsx.utils.json_to_sheet(exportData);
  const workbook  = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Attendance Report');

  xlsx.writeFile(workbook, `${filename}.xlsx`);
};
