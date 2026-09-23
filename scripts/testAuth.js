import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const auth = getAuth(initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID
}));

signInWithEmailAndPassword(auth, process.env.TEST_EMAIL, process.env.TEST_PASSWORD)
  .then(() => console.log('SUCCESS'))
  .catch(e => console.log('FAILED:', e.message));
