import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

export const fetchTeams = async () => {
  const querySnapshot = await getDocs(collection(db, 'teams'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const createTeam = async (teamData) => {
  const docRef = await addDoc(collection(db, 'teams'), teamData);
  return { id: docRef.id, ...teamData };
};

export const updateTeam = async (teamId, teamData) => {
  const teamRef = doc(db, 'teams', teamId);
  await updateDoc(teamRef, teamData);
};

export const deleteTeam = async (teamId) => {
  await deleteDoc(doc(db, 'teams', teamId));
};
