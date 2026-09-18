import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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
        const exists = await checkAdminExists();
        if (!exists) {
          await setAdminExists().catch(e => console.error("Auto-repair failed", e));
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

export const logoutUser = async () => {
  return signOut(auth);
};

export const changeUserPassword = async (currentPassword, newPassword) => {
  const user = auth.currentUser;
  if (!user) throw new Error("No user is signed in.");
  
  // Re-authenticate
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  
  // Update password
  await updatePassword(user, newPassword);
};

export const subscribeToAuthChanges = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          callback({ uid: user.uid, email: user.email, ...userDoc.data() });
        } else {
          callback(null);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        callback(null);
      }
    } else {
      callback(null);
    }
  });
};
