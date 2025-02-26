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

// Fetch user's lab records
export const fetchLabRecords = async (userId) => {
  const labRecordsRef = collection(firestoredb, `patient-records/${userId}/lab-reports`);
  const querySnapshot = await getDocs(labRecordsRef);
  
  // Map the lab records and normalize field names for consistency with user records
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    
    // Create a normalized record structure
    return {
      id: doc.id,
      // If reportUrl exists, use it; otherwise fallback to url
      url: data.reportUrl ? data.reportUrl.trim() : data.url,
      // If no name exists, create one based on testId
      name: data.name || (data.testId ? `Lab_Report_${data.testId}.pdf` : 'Lab Report.pdf'),
      // Map public_id and preserve original fields
      public_id: data.reportPublicId || data.public_id,
      // Preserve original fields as well
      createdAt: data.createdAt,
      testId: data.testId,
      status: data.status,
      reportUrl: data.reportUrl,
      reportPublicId: data.reportPublicId,
      ...data
    };
  });
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

// Add a new lab record
export const addLabRecord = async (userId, recordData) => {
  const labRecordsRef = collection(firestoredb, `patient-records/${userId}/lab-reports`);
  
  // Format the data to match the lab records structure
  const formattedData = {
    ...recordData,
    // Store the URL both in standard format and in lab report format
    reportUrl: recordData.url,
    reportPublicId: recordData.public_id,
    // Add status if not provided
    status: recordData.status || "completed",
    createdAt: serverTimestamp(),
  };
  
  const docRef = await addDoc(labRecordsRef, formattedData);
  return docRef;
};

// Delete a record
export const deleteUserRecord = async (userId, recordId) => {
  await deleteDoc(doc(firestoredb, `patient-records/${userId}/user_records`, recordId));
};

// Delete a lab record
export const deleteLabRecord = async (userId, recordId) => {
  await deleteDoc(doc(firestoredb, `patient-records/${userId}/lab-reports`, recordId));
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