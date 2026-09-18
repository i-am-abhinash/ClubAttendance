import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { db } from './firebase';

const secondaryApp = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}, "SecondaryApp");

const secondaryAuth = getAuth(secondaryApp);

export const fetchMembers = async (teamId = undefined) => {
  let q = collection(db, 'users');
  if (teamId !== undefined) {
    q = query(q, where("teamId", "==", teamId));
  }
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const fetchExternalMembers = async () => {
  const q = query(collection(db, 'users'), where("teamId", "==", null));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(u => u.role === 'Member');
};

export const createMember = async (memberData) => {
  const { email, password, name, role } = memberData;
  const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
  const uid = userCredential.user.uid;
  
  const userData = {
    email,
    name,
    role: role || 'Member',
    teamId: null // Explicitly null
  };

  await setDoc(doc(db, 'users', uid), userData);
  await secondaryAuth.signOut();
  
  return { id: uid, ...userData };
};

export const updateMember = async (userId, memberData) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, memberData);
};

export const deleteMember = async (userId) => {
  await deleteDoc(doc(db, 'users', userId));
};
