import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

dotenv.config();
const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID
});
const db = getFirestore(app);

const wipeDummies = async () => {
  const usersSnap = await getDocs(collection(db, 'users'));
  let deleted = 0;
  for (const d of usersSnap.docs) {
    const data = d.data();
    // Delete if they are not Admin and have no regdNo
    if (data.role !== 'Admin' && !data.regdNo) {
      await fetch(`https://firestore.googleapis.com/v1/projects/${process.env.VITE_FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${d.id}`, {
        method: 'DELETE'
      });
      console.log(`Deleted dummy: ${data.name}`);
      deleted++;
    }
  }
  console.log(`Deleted ${deleted} dummy users.`);
};

wipeDummies();
