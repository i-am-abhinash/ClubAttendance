import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export const checkAdminExists = async () => {
  try {
    const statusDoc = await getDoc(doc(db, 'club', 'status'));
    return statusDoc.exists() && statusDoc.data().adminExists === true;
  } catch (error) {
    if (error.code !== 'permission-denied') {
      console.error("Error checking admin status:", error);
    }
    throw error;
  }
};

export const setAdminExists = async () => {
  try {
    await setDoc(doc(db, 'club', 'status'), { adminExists: true });
  } catch (error) {
    console.error("Error setting admin status:", error);
    throw error;
  }
};
