import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, setDoc, doc, addDoc } from 'firebase/firestore';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env in the root directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const TEAM_MAP = {
  'AI': 'AI Team',
  'VC': 'Vibe Coding',
  'IC': 'Industrial Connect',
  'MK': 'Marketing'
};

import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const runImport = async () => {
  let adminEmail = process.argv[2];
  let adminPassword = process.argv[3];
  const excelFilePath = process.argv[4] || 'teams allocation.xlsx';

  if (!adminEmail) {
    adminEmail = await question('Enter Admin Email: ');
  }
  if (!adminPassword) {
    adminPassword = await question('Enter Admin Password: ');
  }
  rl.close();

  console.log("Authenticating as Admin...");
  try {
    await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    console.log("Authenticated successfully.");
  } catch (error) {
    console.error("Failed to authenticate as Admin:", error.message);
    process.exit(1);
  }

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
  const teamsSnap = await getDocs(collection(db, 'teams'));
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
      const newTeamRef = await addDoc(collection(db, 'teams'), { name: fullName });
      teamIdMap[code] = newTeamRef.id;
      existingTeams[fullName] = { id: newTeamRef.id, name: fullName };
    }
  }

  console.log("Fetching existing members...");
  const usersSnap = await getDocs(collection(db, 'users'));
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
      let mustChangePasswordToSet = existingMember.mustChangePassword;

      if (existingMember.role === 'Team Leader') {
        if (existingMember.teamId !== teamId) {
          report.conflicts.push(`Team Leader ${name} (${regdNo}) is currently assigned to ${existingMember.teamId} but Excel lists team ${teamCodeStr || 'External'}. Role NOT downgraded, team NOT changed.`);
          report.skipped++;
          continue; // Skip updating this privileged user automatically
        }
      }

      try {
        await setDoc(doc(db, 'users', existingMember.id), {
          name,
          regdNo,
          branch,
          teamId,
          role: roleToSet,
          email: existingMember.email, // preserve existing
          mustChangePassword: mustChangePasswordToSet
        }, { merge: true });
        report.updatedMembers++;
      } catch (err) {
        report.errors++;
        report.errorDetails.push(`Failed to update ${regdNo}: ${err.message}`);
      }

    } else {
      // Create new user
      const internalEmail = `${regdNo.toLowerCase()}@mitra.local`;
      const initialPassword = regdNo;

      try {
        // Use REST API to create user so Admin is not logged out
        const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: internalEmail,
            password: initialPassword,
            returnSecureToken: true
          })
        });

        const resData = await res.json();

        if (!resData.localId) {
          if (resData.error && resData.error.message === 'EMAIL_EXISTS') {
             report.errors++;
             report.errorDetails.push(`Email already exists for ${regdNo} (${internalEmail})`);
          } else {
             report.errors++;
             report.errorDetails.push(`Failed to create Auth account for ${regdNo}: ${resData.error ? resData.error.message : 'Unknown error'}`);
          }
          continue;
        }

        const uid = resData.localId;

        await setDoc(doc(db, 'users', uid), {
          name,
          regdNo,
          branch,
          teamId,
          role: 'Member',
          email: internalEmail,
          mustChangePassword: true
        });

        report.newMembers++;
      } catch (err) {
        report.errors++;
        report.errorDetails.push(`Failed to create ${regdNo}: ${err.message}`);
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
