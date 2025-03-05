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
export const fetchUserRecords = async (userId) => {
  try {
    console.log("Fetching User Records", new Date().toISOString());
    const userRecordsRef = collection(
      firestoredb,
      `patient-records/${userId}/user_records`
    );
    const querySnapshot = await getDocs(userRecordsRef);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      // If uploadedBy is not specified, assume it's from a doctor
      uploadedBy: doc.data().uploadedBy || "doctor",
    }));
  } catch (error) {
    throw new Error("Error fetching patientrecords: " + error.message);
  }
};

// Fetch user's lab records
export const fetchLabRecords = async (userId) => {
  try {
    console.log("Fetching Lab Records", new Date().toISOString());
    const labRecordsRef = collection(
      firestoredb,
      `patient-records/${userId}/lab-reports`
    );
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
        name:
          data.name ||
          (data.testId ? `Lab_Report_${data.testId}.pdf` : "Lab Report.pdf"),
        // Map public_id and preserve original fields
        public_id: data.reportPublicId || data.public_id,
        // Add uploadedBy field with default value if not present
        uploadedBy: data.uploadedBy || "doctor",
        // Preserve original fields as well
        createdAt: data.createdAt,
        testId: data.testId,
        status: data.status,
        reportUrl: data.reportUrl,
        reportPublicId: data.reportPublicId,
        ...data,
      };
    });
  } catch (error) {
    throw new Error("Error fetching patient Lab records: " + error.message);
  }
};

// Fetch patient-uploaded records
export const fetchPatientUploadedRecords = async (userId) => {
  try {
    console.log("Fetching Patient Uploaded Records", new Date().toISOString());
    const recordsRef = collection(firestoredb, "patientUploads");
    const q = query(recordsRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      // Always set uploadedBy to 'user' for patient uploads
      uploadedBy: "user",
    }));
  } catch (error) {
    throw new Error(
      "Error fetching patient uploaded records: " + error.message
    );
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
