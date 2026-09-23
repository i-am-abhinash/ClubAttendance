import * as xlsx from 'xlsx';
import { calculateRate, formatPercentage } from './analyticsUtils';

export const exportAttendanceToExcel = (members, records, filename) => {
  // We need to shape the data: 
  // Regd No | Name | Branch | Team | Role | Date1 | Date2 ... | Present | Absent | Attendance Percentage
  
  // Extract all unique dates from records
  const dateSet = new Set();
  records.forEach(r => {
    if (r.date) dateSet.add(r.date);
  });
  
  const sortedDates = Array.from(dateSet).sort((a, b) => new Date(a) - new Date(b));
  
  const exportData = members.map(member => {
    const memberRecords = records.filter(r => r.userId === member.id);
    const present = memberRecords.filter(r => r.status === 'Present').length;
    const absent = memberRecords.filter(r => r.status === 'Absent').length;
    
    // Using the established calculation methodology
    const percentage = calculateRate(present, absent);
    
    const row = {
      'Regd No': member.regdNo || 'N/A',
      'Name': member.name,
      'Branch': member.branch || 'N/A',
      'Team': member.teamId || 'External',
      'Role': member.role
    };

    sortedDates.forEach(date => {
      const record = memberRecords.find(r => r.date === date);
      if (record) {
        row[date] = record.status === 'Present' ? 'TRUE' : 'FALSE';
      } else {
        row[date] = ''; // Blank if no record for that date
      }
    });

    row['Total Present'] = present;
    row['Total Absent'] = absent;
    row['Attendance Percentage'] = `${formatPercentage(percentage)}%`;

    return row;
  });

  const worksheet = xlsx.utils.json_to_sheet(exportData);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Attendance Report');
  
  xlsx.writeFile(workbook, `${filename}.xlsx`);
};
