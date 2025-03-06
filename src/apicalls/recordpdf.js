import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import firestoredb from "../firebaseConfig";

// Fetch user's records
// Memoize fetchUserRecords to prevent unnecessary calls
export const fetchUserRecords = async (userId, forceRefresh = false) => {
  try {
    // Only log if it's a forced refresh
    if (forceRefresh) {
      console.log("Fetching User Records", new Date().toISOString());
    }
    
    const userRecordsRef = collection(
      firestoredb,
      `patient-records/${userId}/user_records`
    );
    const querySnapshot = await getDocs(userRecordsRef);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      uploadedBy: doc.data().uploadedBy || "doctor",
    }));
  } catch (error) {
    console.error("Error fetching patient records:", error);
    throw new Error("Error fetching patient records: " + error.message);
  }
};

// Fetch user's lab records
export const fetchLabRecords = async (userId, forceRefresh = false) => {
  try {
    // Only log if it's a forced refresh
    if (forceRefresh) {
      console.log("Fetching Lab Records", new Date().toISOString());
    }
    
    const labRecordsRef = collection(
      firestoredb,
      `patient-records/${userId}/lab-reports`
    );
    const querySnapshot = await getDocs(labRecordsRef);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        url: data.reportUrl ? data.reportUrl.trim() : data.url,
        name: data.name || (data.testId ? `Lab_Report_${data.testId}.pdf` : "Lab Report.pdf"),
        public_id: data.reportPublicId || data.public_id,
        uploadedBy: data.uploadedBy || "doctor",
        createdAt: data.createdAt,
        testId: data.testId,
        status: data.status,
        reportUrl: data.reportUrl,
        reportPublicId: data.reportPublicId,
        ...data,
      };
    });
  } catch (error) {
    console.error("Error fetching patient Lab records:", error);
    throw new Error("Error fetching patient Lab records: " + error.message);
  }
};

// Fetch patient-uploaded records
export const fetchPatientUploadedRecords = async (userId, forceRefresh = false) => {
  try {
    // Only log if it's a forced refresh
    if (forceRefresh) {
      console.log("Fetching Patient Uploaded Records", new Date().toISOString());
    }
    
    const recordsRef = collection(firestoredb, "patientUploads");
    const q = query(recordsRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      uploadedBy: "user",
    }));
  } catch (error) {
    console.error("Error fetching patient uploaded records:", error);
    throw new Error("Error fetching patient uploaded records: " + error.message);
  }
};

// Add a new record
export const addUserRecord = async (userId, recordData) => {
  const userRecordsRef = collection(
    firestoredb,
    `patient-records/${userId}/user_records`
  );
  const docRef = await addDoc(userRecordsRef, {
    ...recordData,
    // Ensure uploadedBy field exists, default to 'user' if not specified
    uploadedBy: recordData.uploadedBy || "user",
    createdAt: serverTimestamp(),
  });
  return docRef;
};

// Add a new lab record
export const addLabRecord = async (userId, recordData) => {
  const labRecordsRef = collection(
    firestoredb,
    `patient-records/${userId}/lab-reports`
  );

  // Format the data to match the lab records structure
  const formattedData = {
    ...recordData,
    // Store the URL both in standard format and in lab report format
    reportUrl: recordData.url,
    reportPublicId: recordData.public_id,
    // Add status if not provided
    status: recordData.status || "completed",
    // Ensure uploadedBy field exists, default to 'user' if not specified
    uploadedBy: recordData.uploadedBy || "user",
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(labRecordsRef, formattedData);
  return docRef;
};

// Function to add patient-uploaded record
export const addPatientUploadedRecord = async (record) => {
  try {
    const recordsRef = collection(firestoredb, "patientUploads");
    const docRef = await addDoc(recordsRef, {
      ...record,
      // Always set uploadedBy to 'user' for patient uploads
      uploadedBy: "user",
      createdAt: new Date(),
      source: "patient",
    });
    return docRef.id;
  } catch (error) {
    throw new Error("Error adding patient uploaded record: " + error.message);
  }
};

// Delete a record
export const deleteUserRecord = async (userId, recordId) => {
  await deleteDoc(
    doc(firestoredb, `patient-records/${userId}/user_records`, recordId)
  );
};

// Delete a lab record
export const deleteLabRecord = async (userId, recordId) => {
  await deleteDoc(
    doc(firestoredb, `patient-records/${userId}/lab-reports`, recordId)
  );
};
