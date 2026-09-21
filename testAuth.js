import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import dotenv from 'dotenv';
dotenv.config();
const auth = getAuth(initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID
}));
signInWithEmailAndPassword(auth, 'abhinash@gmail.com', 'password123')
  .then(() => console.log('SUCCESS'))
  .catch(e => console.log('FAILED:', e.message));
