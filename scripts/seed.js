import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, setDoc, doc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse .env manually to avoid installing dotenv
const envPath = path.resolve(__dirname, '../.env');
const envFile = fs.readFileSync(envPath, 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) env[key.trim()] = value.join('=').trim();
});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

// Create a secondary app for creating users without logging out
const seedApp = initializeApp(firebaseConfig, "SeedApp");
const auth = getAuth(seedApp);
const db = getFirestore(seedApp);

const teamsData = [
  { name: 'AI' },
  { name: 'Vibe Coding' },
  { name: 'Marketing' }
];

const seed = async () => {
  console.log("Starting database seed...");
  
  try {
    for (const t of teamsData) {
      console.log(`Creating team: ${t.name}...`);
      const teamRef = await addDoc(collection(db, 'teams'), { name: t.name });
      const teamId = teamRef.id;

      // Create Team Leader
      const leaderEmail = `leader.${t.name.toLowerCase().replace(' ', '')}@club.com`;
      console.log(`  Creating Leader: ${leaderEmail}`);
      const leaderCred = await createUserWithEmailAndPassword(auth, leaderEmail, 'password123');
      await setDoc(doc(db, 'users', leaderCred.user.uid), {
        name: `${t.name} Leader`,
        email: leaderEmail,
        role: 'Team Leader',
        teamId: teamId
      });
      await signOut(auth); // Sign out the newly created user

      // Create 3 Members
      for (let i = 1; i <= 3; i++) {
        const memberEmail = `member${i}.${t.name.toLowerCase().replace(' ', '')}@club.com`;
        console.log(`  Creating Member: ${memberEmail}`);
        const memberCred = await createUserWithEmailAndPassword(auth, memberEmail, 'password123');
        await setDoc(doc(db, 'users', memberCred.user.uid), {
          name: `${t.name} Member ${i}`,
          email: memberEmail,
          role: 'Member',
          teamId: teamId
        });
        await signOut(auth);
      }
    }
    console.log("Database seed complete! All users have the password: password123");
    process.exit(0);
  } catch (error) {
    console.error("Error during seed:", error);
    process.exit(1);
  }
};

seed();
