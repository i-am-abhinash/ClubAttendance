export const calculateAttendanceStats = (records, members = []) => {
  const total = records.length;
  const present = records.filter(r => r.status === 'Present').length;
  const absent = records.filter(r => r.status === 'Absent').length;
  const late = records.filter(r => r.status === 'Late').length;
  
  const percentage = total === 0 ? 0 : Math.round(((present + (late * 0.5)) / total) * 100);

  // Group by member
  const memberStats = {};
  if (members.length > 0) {
    members.forEach(m => {
      memberStats[m.id] = { name: m.name, total: 0, present: 0, absent: 0, late: 0 };
    });
  }

  records.forEach(r => {
    if (!memberStats[r.userId]) {
      memberStats[r.userId] = { name: 'Unknown', total: 0, present: 0, absent: 0, late: 0 };
    }
    memberStats[r.userId].total += 1;
    if (r.status === 'Present') memberStats[r.userId].present += 1;
    if (r.status === 'Absent') memberStats[r.userId].absent += 1;
    if (r.status === 'Late') memberStats[r.userId].late += 1;
  });

  const memberChartData = Object.values(memberStats).map(stat => ({
    name: stat.name,
    Present: stat.present,
    Absent: stat.absent,
    Late: stat.late,
    AttendanceRate: stat.total === 0 ? 0 : Math.round(((stat.present + (stat.late * 0.5)) / stat.total) * 100)
  }));

  // Group by Date for trend
  const dateMap = {};
  records.forEach(r => {
    if (!dateMap[r.date]) {
      dateMap[r.date] = { date: r.date, present: 0, absent: 0, late: 0, total: 0 };
    }
    dateMap[r.date].total += 1;
    if (r.status === 'Present') dateMap[r.date].present += 1;
    if (r.status === 'Absent') dateMap[r.date].absent += 1;
    if (r.status === 'Late') dateMap[r.date].late += 1;
  });
  
  const trendData = Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date));

  return { total, present, absent, late, percentage, memberChartData, trendData };
};
