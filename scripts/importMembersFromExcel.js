import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const TEAM_MAP = {
  'AI': 'AI Team',
  'VC': 'Vibe Coding',
  'IC': 'Industrial Connect',
  'MK': 'Marketing'
};

const runImport = async () => {
  const serviceAccountPath = process.argv[2] || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const excelFilePath = process.argv[3] || 'teams allocation.xlsx';

  if (!serviceAccountPath) {
    console.error("Usage: node scripts/importMembersFromExcel.js <pathToServiceAccountJson> [pathToExcel]");
    process.exit(1);
  }

  if (!fs.existsSync(serviceAccountPath)) {
    console.error(`Service account file not found: ${serviceAccountPath}`);
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  const db = admin.firestore();
  const auth = admin.auth();

  console.log(`Reading Excel file: ${excelFilePath}`);
  let data = [];
  try {
    const workbook = xlsx.readFile(excelFilePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    data = xlsx.utils.sheet_to_json(sheet);
  } catch (error) {
    console.error("Failed to read Excel file:", error.message);
    process.exit(1);
  }

  console.log(`Found ${data.length} rows in Excel.`);

  console.log("Fetching existing teams...");
  const teamsSnap = await db.collection('teams').get();
  const existingTeams = {};
  teamsSnap.docs.forEach(d => {
    existingTeams[d.data().name] = { id: d.id, ...d.data() };
  });

  // Ensure canonical teams exist
  const teamIdMap = {}; // Maps 'AI' -> 'team_doc_id'
  for (const [code, fullName] of Object.entries(TEAM_MAP)) {
    if (existingTeams[fullName]) {
      teamIdMap[code] = existingTeams[fullName].id;
    } else {
      console.log(`Creating missing team: ${fullName}`);
      const newTeamRef = await db.collection('teams').add({ name: fullName });
      teamIdMap[code] = newTeamRef.id;
      existingTeams[fullName] = { id: newTeamRef.id, name: fullName };
    }
  }

  console.log("Fetching existing members...");
  const usersSnap = await db.collection('users').get();
  const existingMembersByRegdNo = {};
  usersSnap.docs.forEach(d => {
    const u = d.data();
    if (u.regdNo) {
      existingMembersByRegdNo[u.regdNo] = { id: d.id, ...u };
    }
  });

  const report = {
    totalRows: data.length,
    newMembers: 0,
    updatedMembers: 0,
    aiCount: 0,
    vcCount: 0,
    icCount: 0,
    mkCount: 0,
    externalCount: 0,
    skipped: 0,
    errors: 0,
    conflicts: [],
    errorDetails: []
  };

  for (const row of data) {
    const regdNoRaw = row['Regd No'];
    const nameRaw = row['Name'];
    const branchRaw = row['Branch'];
    const teamRaw = row['Team'];

    if (!regdNoRaw || String(regdNoRaw).trim() === '') {
      report.errors++;
      report.errorDetails.push(`Missing Regd No for Name: ${nameRaw}`);
      continue;
    }

    if (!nameRaw || String(nameRaw).trim() === '') {
      report.errors++;
      report.errorDetails.push(`Missing Name for Regd No: ${regdNoRaw}`);
      continue;
    }

    const regdNo = String(regdNoRaw).trim();
    const name = String(nameRaw).trim();
    const branch = branchRaw ? String(branchRaw).trim() : '';
    const teamCodeStr = teamRaw ? String(teamRaw).trim().toUpperCase() : '';

    let teamId = null;
    if (teamCodeStr !== '') {
      if (TEAM_MAP[teamCodeStr]) {
        teamId = teamIdMap[teamCodeStr];
        
        if (teamCodeStr === 'AI') report.aiCount++;
        else if (teamCodeStr === 'VC') report.vcCount++;
        else if (teamCodeStr === 'IC') report.icCount++;
        else if (teamCodeStr === 'MK') report.mkCount++;
        
      } else {
        report.errors++;
        report.errorDetails.push(`Invalid Team code '${teamRaw}' for Regd No: ${regdNo}`);
        continue;
      }
    } else {
      report.externalCount++;
    }

    const existingMember = existingMembersByRegdNo[regdNo];

    if (existingMember) {
      // Handle Conflict and Update
      let roleToSet = existingMember.role || 'Member';
      let mustChangePasswordToSet = existingMember.mustChangePassword !== undefined ? existingMember.mustChangePassword : true;

      if (existingMember.role === 'Team Leader') {
        if (existingMember.teamId !== teamId) {
          report.conflicts.push(`Team Leader ${name} (${regdNo}) is currently assigned to ${existingMember.teamId} but Excel lists team ${teamCodeStr || 'External'}. Role NOT downgraded, team NOT changed.`);
          report.skipped++;
          continue; 
        }
      }

      try {
        await db.collection('users').doc(existingMember.id).set({
          name,
          regdNo,
          branch,
          teamId,
          role: roleToSet,
          email: existingMember.email, 
          mustChangePassword: mustChangePasswordToSet
        }, { merge: true });
        report.updatedMembers++;
      } catch (err) {
        report.errors++;
        report.errorDetails.push(`Failed to update ${regdNo}: ${err.message}`);
      }

    } else {
      // Create new user
      const internalEmail = `${regdNo.toLowerCase()}@vishnu.edu.in`;
      const initialPassword = regdNo;

      let userRecord;
      try {
        userRecord = await auth.createUser({
          email: internalEmail,
          password: initialPassword,
          displayName: name,
        });
      } catch (err) {
        if (err.code === 'auth/email-already-exists') {
          report.errors++;
          report.errorDetails.push(`Email already exists for ${regdNo} (${internalEmail})`);
        } else {
          report.errors++;
          report.errorDetails.push(`Failed to create Auth account for ${regdNo}: ${err.message}`);
        }
        continue;
      }

      try {
        await db.collection('users').doc(userRecord.uid).set({
          name,
          regdNo,
          branch,
          teamId,
          role: 'Member',
          email: internalEmail,
          mustChangePassword: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        report.newMembers++;
      } catch (dbErr) {
        report.errors++;
        report.errorDetails.push(`Failed to create Firestore record for ${regdNo}: ${dbErr.message}`);
        try {
          await auth.deleteUser(userRecord.uid);
        } catch (rollbackErr) {
          report.errorDetails.push(`Failed to rollback Auth for ${regdNo}: ${rollbackErr.message}`);
        }
      }
    }
  }

  console.log("\n============================================================");
  console.log("IMPORT REPORT");
  console.log("============================================================");
  console.log(`Total rows:                 ${report.totalRows}`);
  console.log(`New members:                ${report.newMembers}`);
  console.log(`Existing members updated:   ${report.updatedMembers}`);
  console.log(`Skipped rows:               ${report.skipped}`);
  console.log(`Errors:                     ${report.errors}`);
  console.log(`Conflicts:                  ${report.conflicts.length}`);
  console.log("------------------------------------------------------------");
  console.log(`AI:                         ${report.aiCount}`);
  console.log(`VC:                         ${report.vcCount}`);
  console.log(`IC:                         ${report.icCount}`);
  console.log(`MK:                         ${report.mkCount}`);
  console.log(`External:                   ${report.externalCount}`);
  
  if (report.conflicts.length > 0) {
    console.log("\nConflicts requiring manual review:");
    report.conflicts.forEach(c => console.log(`- ${c}`));
  }

  if (report.errorDetails.length > 0) {
    console.log("\nErrors:");
    report.errorDetails.forEach(e => console.log(`- ${e}`));
  }
  console.log("============================================================\n");
  process.exit(0);
};

runImport();
