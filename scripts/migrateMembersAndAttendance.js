import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const runMigration = async () => {
  const serviceAccountPath = process.argv[2] || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const excelFilePath = process.argv[3] || 'C:/Users/gowri/Downloads/Attendence VIT-MITRA.xlsx';

  if (!serviceAccountPath) {
    console.error('Usage: node scripts/migrateMembersAndAttendance.js <pathToServiceAccountJson> [pathToExcel]');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  initializeApp({
    credential: cert(serviceAccount)
  });

  const db = getFirestore();
  const auth = getAuth();

  console.log('--- 1. MIGRATING MEMBER EMAILS ---');
  let migratedCount = 0;
  let emailErrors = 0;
  
  const usersSnap = await db.collection('users').get();
  const usersByRegdNo = {};
  
  for (const userDoc of usersSnap.docs) {
    const u = userDoc.data();
    if (u.regdNo) {
      usersByRegdNo[u.regdNo] = { uid: userDoc.id, ...u };
      if (u.email && u.email.endsWith('@mitra.local')) {
        const newEmail = `${u.regdNo.toLowerCase()}@vishnu.edu.in`;
        try {
          await auth.updateUser(userDoc.id, { email: newEmail });
          await db.collection('users').doc(userDoc.id).update({ email: newEmail });
          migratedCount++;
        } catch (err) {
          console.error(`Failed to migrate ${u.regdNo}:`, err.message);
          emailErrors++;
        }
      }
    }
  }
  console.log(`Migrated ${migratedCount} emails to @vishnu.edu.in. Errors: ${emailErrors}`);

  console.log('\n--- 2. IMPORTING ATTENDANCE ---');
  if (!fs.existsSync(excelFilePath)) {
    console.error(`Excel file not found at ${excelFilePath}`);
    process.exit(1);
  }

  const workbook = xlsx.readFile(excelFilePath, { cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet, { defval: '' });

  const report = {
    totalExcelStudents: data.length,
    matchedStudents: 0,
    missingStudents: 0,
    newRecords: 0,
    updatedRecords: 0,
    presentRecords: 0,
    absentRecords: 0,
    skippedRecords: 0,
    invalidDates: 0,
    errors: 0,
    missingRegdNos: []
  };

  const existingAttendanceSnap = await db.collection('attendance').get();
  const existingAttendance = new Set(existingAttendanceSnap.docs.map(d => d.id));

  const allHeaders = Object.keys(data[0] || {});
  const excludeHeaders = ['Regd No', 'Name', 'Branch', 'Team', 'regd no', 'Regdno'];
  const dateColumns = allHeaders.filter(h => !excludeHeaders.includes(h) && String(h).trim() !== '');

  for (const row of data) {
    const rawRegd = row['Regd No'] || row['regd no'] || row['Regdno'];
    if (!rawRegd) continue;
    const regdNo = String(rawRegd).trim();
    
    const user = usersByRegdNo[regdNo];
    if (!user) {
      report.missingStudents++;
      report.missingRegdNos.push(regdNo);
      console.log(`Missing user: ${regdNo}`);
      continue;
    }
    report.matchedStudents++;

    for (const col of dateColumns) {
      const val = row[col];
      if (val === '' || val === null || val === undefined) {
        report.skippedRecords++;
        continue;
      }
      
      let status = '';
      if (String(val).trim().toUpperCase() === 'TRUE') status = 'Present';
      else if (String(val).trim().toUpperCase() === 'FALSE') status = 'Absent';
      else {
        report.skippedRecords++;
        continue;
      }
      
      let dateStr = col;
      try {
        const d = new Date(col);
        if (!isNaN(d.getTime())) {
          dateStr = d.toISOString().split('T')[0];
        }
      } catch (e) {
        report.invalidDates++;
        continue;
      }
      
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        report.invalidDates++;
        continue;
      }

      if (status === 'Present') report.presentRecords++;
      if (status === 'Absent') report.absentRecords++;

      const recordId = `${user.uid}_${dateStr}`;
      const record = {
        userId: user.uid,
        teamId: user.teamId || '',
        date: dateStr,
        status,
        markedBy: 'excel-import',
        markedAt: FieldValue.serverTimestamp()
      };

      try {
        if (existingAttendance.has(recordId)) {
          await db.collection('attendance').doc(recordId).update({
             status: status,
             markedBy: 'excel-import',
             markedAt: FieldValue.serverTimestamp()
          });
          report.updatedRecords++;
        } else {
          await db.collection('attendance').doc(recordId).set(record);
          existingAttendance.add(recordId);
          report.newRecords++;
        }
      } catch (err) {
        console.error(`Failed to save attendance for ${recordId}: ${err.message}`);
        report.errors++;
      }
    }
  }

  console.log('\n============================================================');
  console.log('MIGRATION SUMMARY');
  console.log('============================================================');
  console.log(`Email Migrations (mitra.local -> vishnu.edu.in): ${migratedCount}`);
  console.log(`Email Migration Errors: ${emailErrors}`);
  console.log('\n============================================================');
  console.log('ATTENDANCE IMPORT SUMMARY');
  console.log('============================================================');
  console.log(`Total Excel students: ${report.totalExcelStudents}`);
  console.log(`Matched students: ${report.matchedStudents}`);
  console.log(`Missing students: ${report.missingStudents}`);
  console.log(`New attendance records: ${report.newRecords}`);
  console.log(`Updated attendance records: ${report.updatedRecords}`);
  console.log(`Present records: ${report.presentRecords}`);
  console.log(`Absent records: ${report.absentRecords}`);
  console.log(`Blank/skipped records: ${report.skippedRecords}`);
  console.log(`Invalid dates: ${report.invalidDates}`);
  console.log(`Errors: ${report.errors}`);
  
  if (report.missingRegdNos.length > 0) {
    console.log('\nMissing Regd Nos:');
    report.missingRegdNos.forEach(r => console.log(`- ${r}`));
  }
  console.log('============================================================\n');
};

runMigration().then(() => process.exit(0)).catch(console.error);
