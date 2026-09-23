import fs from 'fs';
import xlsx from 'xlsx';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const runAudit = async () => {
  const serviceAccountPath = process.argv[2];
  const excelFilePath = process.argv[3] || 'C:/Users/gowri/Downloads/Attendence VIT-MITRA.xlsx';
  const execute = process.argv.includes('--execute');

  if (!serviceAccountPath) {
    console.error('Usage: node scripts/auditAndRepairAttendance.js <serviceAccount> [excelPath] [--execute]');
    process.exit(1);
  }

  initializeApp({ credential: cert(JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))) });
  const db = getFirestore();

  console.log(`Running in ${execute ? 'EXECUTE' : 'DRY RUN'} mode...`);

  // 1. Fetch Users
  const usersSnap = await db.collection('users').get();
  const users = [];
  const usersByRegdNo = {};
  usersSnap.forEach(doc => {
    const data = doc.data();
    if (data.regdNo) {
      const u = { id: doc.id, ...data, regdNoNorm: String(data.regdNo).trim().toLowerCase() };
      users.push(u);
      usersByRegdNo[u.regdNoNorm] = u;
    }
  });

  // 2. Fetch current Attendance
  const attSnap = await db.collection('attendance').get();
  const currentAttendance = {};
  const userAttendanceStats = {};
  
  users.forEach(u => {
    userAttendanceStats[u.id] = { present: 0, absent: 0, total: 0 };
  });

  let duplicateCount = 0;

  attSnap.forEach(doc => {
    const data = doc.data();
    const key = `${data.userId}_${data.date}`;
    if (currentAttendance[key]) duplicateCount++; 
    
    currentAttendance[key] = { id: doc.id, ...data };
    
    if (userAttendanceStats[data.userId]) {
      if (data.status === 'Present') userAttendanceStats[data.userId].present++;
      if (data.status === 'Absent') userAttendanceStats[data.userId].absent++;
      userAttendanceStats[data.userId].total++;
    }
  });

  // 3. Find 0% Students
  const zeroPercentStudents = new Set();
  users.forEach(u => {
    const stats = userAttendanceStats[u.id];
    if (stats.total > 0 && stats.present === 0 && stats.absent > 0) {
      zeroPercentStudents.add(u.id);
    }
  });

  // 4. Parse Excel
  const workbook = xlsx.readFile(excelFilePath, { cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet, { defval: '' });

  const allHeaders = Object.keys(data[0] || {});
  const excludeHeaders = ['Regd No', 'Name', 'Branch', 'Team', 'regd no', 'Regdno'];
  const dateColumns = allHeaders.filter(h => !excludeHeaders.includes(h) && String(h).trim() !== '');

  const excelStudents = new Set();
  let studentsMissingFromExcel = 0;
  const studentsMissingFromFirestore = new Set();
  
  let recordsToCreate = [];
  let recordsToUpdate = [];
  let recordsAlreadyCorrect = 0;

  let zeroPercentConfirmed = new Set();
  let zeroPercentRepaired = new Set();

  for (const row of data) {
    const rawRegd = row['Regd No'] || row['regd no'] || row['Regdno'];
    if (!rawRegd) continue;
    const regdNoNorm = String(rawRegd).trim().toLowerCase();
    excelStudents.add(regdNoNorm);

    const user = usersByRegdNo[regdNoNorm];
    if (!user) {
      studentsMissingFromFirestore.add(regdNoNorm);
      continue;
    }

    let excelPresent = 0;
    let excelAbsent = 0;

    for (const col of dateColumns) {
      const val = row[col];
      if (val === '' || val === null || val === undefined) continue;

      let status = '';
      if (String(val).trim().toUpperCase() === 'TRUE') { status = 'Present'; excelPresent++; }
      else if (String(val).trim().toUpperCase() === 'FALSE') { status = 'Absent'; excelAbsent++; }
      else continue;

      let dateStr = col;
      try {
        const d = new Date(col);
        if (!isNaN(d.getTime())) dateStr = d.toISOString().split('T')[0];
      } catch (e) { continue; }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue;

      const recordId = `${user.id}_${dateStr}`;
      const existing = currentAttendance[recordId];

      if (!existing) {
        recordsToCreate.push({
          id: recordId,
          userId: user.id,
          teamId: user.teamId || '',
          date: dateStr,
          status,
          markedBy: 'audit-repair',
        });
        if (zeroPercentStudents.has(user.id) && status === 'Present') zeroPercentRepaired.add(user.id);
      } else {
        if (existing.status !== status) {
          recordsToUpdate.push({
            id: recordId,
            status,
            oldStatus: existing.status
          });
          if (zeroPercentStudents.has(user.id) && status === 'Present') zeroPercentRepaired.add(user.id);
        } else {
          recordsAlreadyCorrect++;
        }
      }
    }

    if (zeroPercentStudents.has(user.id) && !zeroPercentRepaired.has(user.id)) {
       if (excelAbsent > 0 && excelPresent === 0) {
         zeroPercentConfirmed.add(user.id);
       }
    }
  }

  users.forEach(u => {
    if (!excelStudents.has(u.regdNoNorm)) studentsMissingFromExcel++;
  });

  if (execute) {
    const batchArray = [];
    let batch = db.batch();
    let opCount = 0;

    for (const r of recordsToCreate) {
      batch.set(db.collection('attendance').doc(r.id), {
        ...r,
        markedAt: FieldValue.serverTimestamp()
      });
      opCount++;
      if (opCount === 400) { batchArray.push(batch); batch = db.batch(); opCount = 0; }
    }
    for (const r of recordsToUpdate) {
      batch.update(db.collection('attendance').doc(r.id), {
        status: r.status,
        markedBy: 'audit-repair',
        markedAt: FieldValue.serverTimestamp()
      });
      opCount++;
      if (opCount === 400) { batchArray.push(batch); batch = db.batch(); opCount = 0; }
    }
    if (opCount > 0) batchArray.push(batch);
    
    for (const b of batchArray) await b.commit();
    console.log('Database updated successfully.');
  }

  let finalPresent = 0;
  let finalAbsent = 0;
  
  if (execute) {
    const newSnap = await db.collection('attendance').get();
    newSnap.forEach(doc => {
      const s = doc.data().status;
      if (s === 'Present') finalPresent++;
      if (s === 'Absent') finalAbsent++;
    });
  } else {
    finalPresent = Object.values(currentAttendance).filter(r => r.status === 'Present').length;
    finalAbsent = Object.values(currentAttendance).filter(r => r.status === 'Absent').length;
    
    recordsToCreate.forEach(r => {
      if (r.status === 'Present') finalPresent++;
      if (r.status === 'Absent') finalAbsent++;
    });
    recordsToUpdate.forEach(r => {
      if (r.oldStatus === 'Present') finalPresent--;
      if (r.oldStatus === 'Absent') finalAbsent--;
      if (r.status === 'Present') finalPresent++;
      if (r.status === 'Absent') finalAbsent++;
    });
  }

  const finalRate = (finalPresent + finalAbsent) === 0 ? 0 : Number(((finalPresent / (finalPresent + finalAbsent)) * 100).toFixed(2));

  console.log('---RESULTS---');
  console.log(JSON.stringify({
    zeroPercentFound: zeroPercentStudents.size,
    zeroPercentConfirmed: zeroPercentConfirmed.size,
    zeroPercentRepaired: zeroPercentRepaired.size,
    recordsCreated: recordsToCreate.length,
    recordsCorrected: recordsToUpdate.length,
    duplicateRecords: duplicateCount,
    missingFromExcel: studentsMissingFromExcel,
    missingFromFirestore: studentsMissingFromFirestore.size,
    finalOverallRate: finalRate
  }));
};

runAudit().then(() => process.exit(0)).catch(console.error);
