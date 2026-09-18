import { collection, getDocs, doc, addDoc, updateDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { startOfDay, endOfDay, isSameDay } from 'date-fns';

// Date is expected to be a string YYYY-MM-DD
export const fetchAttendance = async (teamId = null, userId = null, startDate = null, endDate = null) => {
  let q = collection(db, 'attendance');
  const constraints = [];
  
  if (teamId) constraints.push(where("teamId", "==", teamId));
  if (userId) constraints.push(where("userId", "==", userId));
  if (startDate) constraints.push(where("date", ">=", startDate));
  if (endDate) constraints.push(where("date", "<=", endDate));
  
  if (constraints.length > 0) {
    q = query(q, ...constraints);
  }
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const markAttendance = async (attendanceData) => {
  // attendanceData: { userId, teamId, date, status, markedBy }
  const record = {
    ...attendanceData,
    markedAt: Timestamp.now()
  };
  const docRef = await addDoc(collection(db, 'attendance'), record);
  return { id: docRef.id, ...record };
};

export const editAttendance = async (recordId, newStatus, recordDateString) => {
  // same-day check
  const recordDate = new Date(recordDateString);
  if (!isSameDay(new Date(), recordDate)) {
    throw new Error("Cannot edit past attendance records. Only same-day edits are allowed.");
  }
  
  const recordRef = doc(db, 'attendance', recordId);
  await updateDoc(recordRef, { status: newStatus });
};

// Function to fetch a specific day's records for a team
export const fetchDailyAttendance = async (teamId, dateStr) => {
  const q = query(
    collection(db, 'attendance'),
    where("teamId", "==", teamId),
    where("date", "==", dateStr)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
