import { collection, getDocs, doc, setDoc, updateDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

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
  // Deterministic ID prevents duplicate records for same user+date
  const recordId = `${attendanceData.userId}_${attendanceData.date}`;
  const record = {
    ...attendanceData,
    markedAt: Timestamp.now()
  };
  const docRef = doc(db, 'attendance', recordId);
  await setDoc(docRef, record, { merge: true });
  return { id: recordId, ...record };
};

export const editAttendance = async (recordId, newStatus) => {
  const recordRef = doc(db, 'attendance', recordId);
  await updateDoc(recordRef, { status: newStatus, markedAt: Timestamp.now() });
};

export const fetchDailyAttendance = async (teamId, dateStr) => {
  const q = query(
    collection(db, 'attendance'),
    where("teamId", "==", teamId),
    where("date", "==", dateStr)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
