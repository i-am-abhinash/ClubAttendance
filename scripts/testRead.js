import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID
});
const db = getFirestore(app);
const auth = getAuth(app);

const testRead = async () => {
  try {
    await signInWithEmailAndPassword(auth, process.env.TEST_EMAIL, process.env.TEST_PASSWORD);
    const snap = await getDocs(collection(db, 'users'));
    const admins = snap.docs.map(d => d.data()).filter(u => u.role === 'Admin');
    console.log(admins.map(a => a.email));
    process.exit(0);
  } catch (error) {
    console.error("Error reading users:", error);
    process.exit(1);
  }
};
testRead();
