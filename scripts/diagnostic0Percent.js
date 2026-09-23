import fs from 'fs';
import xlsx from 'xlsx';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const runDiagnostic = async () => {
  const serviceAccountPath = process.argv[2] || 'D:/Mitra/club-attendance-app/mitra-attandance-firebase-adminsdk-fbsvc-8123d6dce1.json';
  const excelFilePath = 'C:/Users/gowri/Downloads/Attendence VIT-MITRA.xlsx';

  initializeApp({ credential: cert(JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))) });
  const db = getFirestore();

  console.log('Running 0% Attendance Diagnostic (READ-ONLY)...');

  // 1. Fetch Users
  const usersSnap = await db.collection('users').get();
  const users = [];
  const usersByRegdNo = {}; // maps regdNo to main user
  const usersById = {};
  const duplicateRegdNos = {}; // regdNo -> array of userIds
  
  usersSnap.forEach(doc => {
    const data = doc.data();
    if (data.regdNo) {
      const u = { id: doc.id, ...data, regdNoNorm: String(data.regdNo).trim().toLowerCase() };
      users.push(u);
      usersById[u.id] = u;
      
      if (!duplicateRegdNos[u.regdNoNorm]) duplicateRegdNos[u.regdNoNorm] = [];
      duplicateRegdNos[u.regdNoNorm].push(u.id);

      if (!usersByRegdNo[u.regdNoNorm]) {
        usersByRegdNo[u.regdNoNorm] = u;
      }
    }
  });

  // 2. Fetch current Attendance
  const attSnap = await db.collection('attendance').get();
  const currentAttendance = {};
  const attendanceByUserId = {};
  let malformedRecords = 0;
  
  users.forEach(u => {
    attendanceByUserId[u.id] = { present: 0, absent: 0, total: 0, records: [] };
  });

  attSnap.forEach(doc => {
    const data = doc.data();
    
    // Check format
    const expectedId = `${data.userId}_${data.date}`;
    if (doc.id !== expectedId || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
      malformedRecords++;
    }

    const key = `${data.userId}_${data.date}`;
    currentAttendance[key] = { id: doc.id, ...data };
    
    if (!attendanceByUserId[data.userId]) {
      attendanceByUserId[data.userId] = { present: 0, absent: 0, total: 0, records: [] };
    }
    attendanceByUserId[data.userId].records.push(data);
    
    if (data.status === 'Present') attendanceByUserId[data.userId].present++;
    if (data.status === 'Absent') attendanceByUserId[data.userId].absent++;
    attendanceByUserId[data.userId].total++;
  });

  // 3. Find 0% Students
  const zeroPercentUsers = [];
  users.forEach(u => {
    const stats = attendanceByUserId[u.id];
    if ((stats.present === 0 && stats.absent > 0) || (stats.present === 0 && stats.absent === 0)) {
      zeroPercentUsers.push(u);
    }
  });

  // 4. Parse Excel
  const workbook = xlsx.readFile(excelFilePath, { cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet, { defval: '' });

  const allHeaders = Object.keys(data[0] || {});
  const excludeHeaders = ['Regd No', 'Name', 'Branch', 'Team', 'regd no', 'Regdno'];
  const dateColumns = allHeaders.filter(h => !excludeHeaders.includes(h) && String(h).trim() !== '');

  let cat1 = 0; // Possible calculation/UI issue
  let cat2 = 0; // Missing attendance records
  let cat3 = 0; // UID mismatch
  let cat4 = 0; // Genuine 0% attendance
  let cat5 = 0; // Only blank Excel data
  let cat6 = 0; // Not found in Excel
  let cat7 = 0; // Date mismatch/malformed

  let missingRecords = 0;
  let uidMismatchesCount = 0;
  
  const reportTable = [];

  for (const user of zeroPercentUsers) {
    const regdNoNorm = user.regdNoNorm;
    
    const stats = attendanceByUserId[user.id];
    const fbPresent = stats.present;
    const fbAbsent = stats.absent;
    const fbTotal = fbPresent + fbAbsent;
    const fbPct = fbTotal === 0 ? 0 : 0; 

    let excelRow = data.find(r => {
      const rVal = r['Regd No'] || r['regd no'] || r['Regdno'];
      return rVal && String(rVal).trim().toLowerCase() === regdNoNorm;
    });

    if (!excelRow) {
      cat6++;
      reportTable.push({ RegdNo: user.regdNo, Name: user.name, UID: user.id, FTotal: fbTotal, FPct: fbPct, EPresent: 0, EAbsent: 0, EPct: 0, Cat: 'Not found in Excel' });
      continue;
    }

    let excelPresent = 0;
    let excelAbsent = 0;
    let excelBlanks = 0;
    
    let hasOtherUidRecords = false;
    if (duplicateRegdNos[regdNoNorm].length > 1) {
       for (const altUid of duplicateRegdNos[regdNoNorm]) {
         if (altUid !== user.id && attendanceByUserId[altUid] && attendanceByUserId[altUid].total > 0) {
           hasOtherUidRecords = true;
           uidMismatchesCount++;
         }
       }
    }

    let hasDateMismatch = false;
    let missingInDb = 0;

    for (const col of dateColumns) {
      const val = excelRow[col];
      if (val === '' || val === null || val === undefined) { excelBlanks++; continue; }

      let excelStatus = '';
      if (String(val).trim().toUpperCase() === 'TRUE') { excelStatus = 'Present'; excelPresent++; }
      else if (String(val).trim().toUpperCase() === 'FALSE') { excelStatus = 'Absent'; excelAbsent++; }
      else continue;

      let dateStr = col;
      try {
        const d = new Date(col);
        if (!isNaN(d.getTime())) dateStr = d.toISOString().split('T')[0];
      } catch (e) {}

      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        hasDateMismatch = true;
      }

      const expectedKey = `${user.id}_${dateStr}`;
      const existing = currentAttendance[expectedKey];
      if (!existing) missingInDb++;
    }

    const excelTotal = excelPresent + excelAbsent;
    const excelPct = excelTotal === 0 ? 0 : Number(((excelPresent / excelTotal) * 100).toFixed(2));

    let category = '';
    if (hasOtherUidRecords) { category = 'UID mismatch'; cat3++; }
    else if (hasDateMismatch) { category = 'Date/data-format issue'; cat7++; }
    else if (excelTotal > 0 && missingInDb > 0) { category = 'Missing attendance records'; cat2++; missingRecords += missingInDb; }
    else if (excelTotal > 0 && missingInDb === 0) { category = 'Possible UI/calculation issue'; cat1++; }
    else if (excelAbsent > 0 && excelPresent === 0) { category = 'Genuine 0%'; cat4++; }
    else if (excelTotal === 0 && excelBlanks > 0) { category = 'Only blank Excel data'; cat5++; }
    else { category = 'Other'; }

    reportTable.push({
      RegdNo: user.regdNo,
      Name: user.name,
      UID: user.id,
      FTotal: fbTotal,
      FPct: fbPct,
      EPresent: excelPresent,
      EAbsent: excelAbsent,
      EPct: excelPct,
      Cat: category
    });
  }

  console.log('---DIAGNOSTIC REPORT---');
  console.log('Total users checked:', users.length);
  console.log('Total students displaying 0%:', zeroPercentUsers.length);
  console.log('');
  console.log('0% breakdown:');
  console.log('No attendance records (in Excel, but DB missing):', cat2);
  console.log('UID mismatch:', cat3);
  console.log('Genuine 0%:', cat4);
  console.log('Only blank Excel data:', cat5);
  console.log('Not found in Excel:', cat6);
  console.log('Date/data-format issue:', cat7);
  console.log('Possible UI/calculation issue:', cat1);
  console.log('');
  console.log('Total missing records for 0% students:', missingRecords);
  console.log('Total UID mismatches:', uidMismatchesCount);
  console.log('Total malformed/date mismatch records:', malformedRecords);
  console.log('');
  
  console.log('Detailed 0% Students Table:');
  console.table(reportTable);
};

runDiagnostic().then(() => process.exit(0)).catch(console.error);
