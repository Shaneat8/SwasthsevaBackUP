import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp, query, where } from "firebase/firestore";
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

//Function to fetch patient-uploaded records
export const fetchPatientUploadedRecords = async (userId) => {
  try {
    const recordsRef = collection(firestoredb, 'patientUploads');
    const q = query(recordsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    throw new Error('Error fetching patient uploaded records: ' + error.message);
  }
};

// Function to add patient-uploaded record
export const addPatientUploadedRecord = async (record) => {
  try {
    const recordsRef = collection(firestoredb, 'patientUploads');
    const docRef = await addDoc(recordsRef, {
      ...record,
      createdAt: new Date(),
      source: 'patient'
    });
    return docRef.id;
  } catch (error) {
    throw new Error('Error adding patient uploaded record: ' + error.message);
  }
};