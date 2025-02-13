import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import firestoredb from "../firebaseConfig";

// Fetch user's records
export const fetchUserRecords = async (userId) => {
  const userRecordsRef = collection(firestoredb, `patient-records/${userId}/user_records`);
  const querySnapshot = await getDocs(userRecordsRef);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// Add a new record
export const addUserRecord = async (userId, recordData) => {
  const userRecordsRef = collection(firestoredb, `patient-records/${userId}/user_records`);
  const docRef = await addDoc(userRecordsRef, {
    ...recordData,
    createdAt: serverTimestamp(),
  });
  return docRef;
};

// Delete a record
export const deleteUserRecord = async (userId, recordId) => {
  await deleteDoc(doc(firestoredb, `patient-records/${userId}/user_records`, recordId));
};