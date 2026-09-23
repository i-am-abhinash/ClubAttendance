import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID
});
const db = getFirestore(app);
const auth = getAuth(app);

const wipeDummies = async () => {
  try {
    await signInWithEmailAndPassword(auth, process.env.TEST_EMAIL, process.env.TEST_PASSWORD);
    const usersSnap = await getDocs(collection(db, 'users'));
    let deleted = 0;
    for (const d of usersSnap.docs) {
      const data = d.data();
      if (data.role !== 'Admin' && !data.regdNo) {
        await deleteDoc(doc(db, 'users', d.id));
        console.log(`Deleted dummy: ${data.name || d.id}`);
        deleted++;
      }
    }
    console.log(`Deleted ${deleted} dummy users.`);
    process.exit(0);
  } catch (error) {
    console.error("Error wiping dummies:", error);
    process.exit(1);
  }
};

wipeDummies();
