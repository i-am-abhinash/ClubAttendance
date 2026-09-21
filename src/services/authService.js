import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  getAuth
} from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { checkAdminExists, setAdminExists } from './configService';

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Fetch user details from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // Auto-repair club/status if Admin logs in and it doesn't exist
      if (userData.role === 'Admin') {
        try {
          const exists = await checkAdminExists();
          if (!exists) {
            await setAdminExists().catch(e => console.error("Auto-repair failed", e));
          }
        } catch (statusError) {
          // Ignore if we get permission-denied here, it just means the rule is strict.
          // Don't let it crash the login process.
        }
      }
      
      return { uid: user.uid, email: user.email, ...userData };
    } else {
      throw new Error('User profile not found in database.');
    }
  } catch (error) {
    throw error;
  }
};

export const registerUser = async (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

// Admin uses this to create users WITHOUT logging themselves out
export const adminCreateUser = async (email, password, userData) => {
  // Use the same config as the main app
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
  
  // Create a secondary app instance
  const secondaryApp = initializeApp(firebaseConfig, 'Secondary' + Date.now());
  const secondaryAuth = getAuth(secondaryApp);
  
  try {
    // Create the user on the secondary auth instance (so main auth is unaffected)
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    
    // Write to Firestore using the MAIN db instance (because Admin is authenticated there)
    await setDoc(doc(db, 'users', userCredential.user.uid), userData);
    
    // Sign out the secondary instance to clean up
    await signOut(secondaryAuth);
    
    return userCredential;
  } catch (error) {
    throw error;
  }
};

export const logoutUser = async () => {
  return signOut(auth);
};

export const changeUserPassword = async (currentPassword, newPassword) => {
  const user = auth.currentUser;
  if (!user) throw new Error("No user is signed in.");
  
  // Re-authenticate
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  
  // Update password in Auth
  await updatePassword(user, newPassword);
  
  // Update flag in Firestore
  await setDoc(doc(db, 'users', user.uid), { mustChangePassword: false }, { merge: true });
};

export const subscribeToAuthChanges = (callback) => {
  let unsubscribeSnapshot = null;

  const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
      unsubscribeSnapshot = null;
    }

    if (user) {
      unsubscribeSnapshot = onSnapshot(doc(db, 'users', user.uid), (userDoc) => {
        if (userDoc.exists()) {
          callback({ uid: user.uid, email: user.email, ...userDoc.data() });
        } else {
          callback(null);
        }
      }, (error) => {
        console.error("Error fetching user data:", error);
        callback(null);
      });
    } else {
      callback(null);
    }
  });

  return () => {
    if (unsubscribeSnapshot) unsubscribeSnapshot();
    unsubscribeAuth();
  };
};
