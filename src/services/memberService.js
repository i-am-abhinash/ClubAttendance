import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { db } from './firebase';

// Create a secondary app instance to handle user creation without logging out the admin
const secondaryApp = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}, "SecondaryApp");

const secondaryAuth = getAuth(secondaryApp);

export const fetchMembers = async (teamId = null) => {
  let q = collection(db, 'users');
  if (teamId) {
    q = query(q, where("teamId", "==", teamId));
  }
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const createMember = async (memberData) => {
  // memberData needs email, password, name, role, teamId
  const { email, password, ...rest } = memberData;
  const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
  const uid = userCredential.user.uid;
  
  await setDoc(doc(db, 'users', uid), {
    email,
    ...rest
  });
  
  // secondaryAuth will sign in the new user on the secondary instance.
  await secondaryAuth.signOut();
  
  return { id: uid, email, ...rest };
};

export const updateMember = async (userId, memberData) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, memberData);
};

export const deleteMember = async (userId) => {
  await deleteDoc(doc(db, 'users', userId));
  // Note: this only deletes the firestore doc, not the Auth user. 
  // Deleting Auth users from client requires them to be signed in or requires Cloud Functions.
};
