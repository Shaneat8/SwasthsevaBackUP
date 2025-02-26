import axios from "axios";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  Timestamp,
  query,
  orderBy,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { message } from "antd";
import { jsPDF } from "jspdf";
import moment from "moment";
import firestoredb from "../firebaseConfig";
import { addPatientUploadedRecord, addUserRecord } from "./recordpdf";

// Base URL for API calls
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export const GetAllLabTestsFirebase = async () => {
  try {
    // Create a query to get all documents from the labTests collection
    // Ordered by dateTimestamp in descending order (newest first)
    const q = query(
      collection(firestoredb, "labTests"),
      orderBy("dateTimestamp", "desc")
    );

    // Execute the query
    const querySnapshot = await getDocs(q);

    // Initialize empty array to store the results
    const tests = [];

    // Iterate through each document and add it to the tests array
    querySnapshot.forEach((doc) => {
      tests.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return {
      success: true,
      data: tests,
    };
  } catch (error) {
    console.error("Error fetching lab tests from Firebase:", error);

    return {
      success: false,
      message: "Failed to fetch lab tests: " + error.message,
    };
  }
};
/**
 * Get lab test by ID
 * @param {string} id - The ID of the lab test to retrieve
 * @returns {Promise} Promise object representing the API response
 */
export const GetLabTestById = async (id) => {
  try {
    // Get auth token from local storage
    const token = localStorage.getItem("token");

    // Make API request with auth header
    const response = await axios.get(`${API_URL}/lab-tests/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Return successful response
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    // Handle errors
    console.error("Error fetching lab test:", error);

    return {
      success: false,
      message: error.response?.data?.message || "Error fetching lab test",
    };
  }
};

/**
 * Get lab tests by user ID
 * @param {string} userId - The user ID to get lab tests for
 * @returns {Promise} Promise object representing the API response
 */
export const GetLabTestsByUserId = async (userId) => {
  try {
    // Get auth token from local storage
    const token = localStorage.getItem("token");

    // Make API request with auth header
    const response = await axios.get(`${API_URL}/lab-tests/user/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Return successful response
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    // Handle errors
    console.error("Error fetching user lab tests:", error);

    return {
      success: false,
      message: error.response?.data?.message || "Error fetching user lab tests",
    };
  }
};

/**
 * Create a new lab test
 * @param {object} labTestData - Object containing lab test data
 * @returns {Promise} Promise object representing the API response
 */
export const CreateLabTest = async (labTestData) => {
  try {
    // Get auth token from local storage
    const token = localStorage.getItem("token");

    // Make API request with auth header
    const response = await axios.post(`${API_URL}/lab-tests`, labTestData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Return successful response
    return {
      success: true,
      data: response.data.data,
      message: "Lab test created successfully",
    };
  } catch (error) {
    // Handle errors
    console.error("Error creating lab test:", error);

    return {
      success: false,
      message: error.response?.data?.message || "Error creating lab test",
    };
  }
};

/**
 * Delete a lab test
 * @param {string} id - The ID of the lab test to delete
 * @returns {Promise} Promise object representing the API response
 */
export const DeleteLabTest = async (id) => {
  try {
    // Get auth token from local storage
    const token = localStorage.getItem("token");

    // Make API request with auth header
    const response = await axios.delete(`${API_URL}/lab-tests/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Return successful response
    return {
      success: true,
      message: "Lab test deleted successfully",
    };
  } catch (error) {
    // Handle errors
    console.error("Error deleting lab test:", error);

    return {
      success: false,
      message: error.response?.data?.message || "Error deleting lab test",
    };
  }
};

/**
 * Update lab test results
 * @param {string} testId - The ID of the lab test to update
 * @param {object} resultData - Object containing test results
 * @returns {Promise} Promise object representing the API response
 */
export const UpdateLabTestResults = async (testId, resultData) => {
  try {
    // Get auth token from local storage
    const token = localStorage.getItem("token");

    // Make API request with auth header
    const response = await axios.put(
      `${API_URL}/lab-tests/${testId}/results`,
      resultData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Return successful response
    return {
      success: true,
      data: response.data.data,
      message: "Test results updated successfully",
    };
  } catch (error) {
    // Handle errors
    console.error("Error updating test results:", error);

    return {
      success: false,
      message: error.response?.data?.message || "Error updating test results",
    };
  }
};

export const UploadTestReport = async (testId, reportFile, userId) => {
  try {
    console.log("Received parameters:", { testId, reportFile, userId });

    if (!testId || !reportFile || !userId) {
      return {
        success: false,
        message: "Test ID, report file, and user ID are required",
      };
    }

    const labTestsRef = collection(firestoredb, "lab-tests");
    const q = query(
      labTestsRef,
      where("testId", "==", testId), // Match the testId field
      where("userId", "==", userId)  // Match the userId field
    );
    const querySnapshot = await getDocs(q);

    console.log("Query Snapshot:", querySnapshot);

    if (querySnapshot.empty) {
      console.log("No matching documents found in Firestore.");
      return {
        success: false,
        message: "Lab test not found",
      };
    }

    const labTest = {
      id: querySnapshot.docs[0].id,
      ...querySnapshot.docs[0].data(),
    };
    console.log("Lab Test Document:", labTest);

    // Rest of the function...
  } catch (error) {
    console.error("Error uploading test report:", error);
    return {
      success: false,
      message: error.message || "Error uploading test report",
    };
  }
};

/**
 * Generate lab test result PDF
 * @param {string} testId - The ID of the lab test
 * @param {string} templateId - The ID of the test template
 * @param {object} resultValues - Object containing test result values
 * @returns {Promise} Promise object representing the API response
 */
export const GenerateLabTestResultPDF = async (
  testId,
  templateId,
  resultValues
) => {
  try {
    if (!testId || !templateId || !resultValues) {
      return {
        success: false,
        message: "Missing required information for generating report",
      };
    }

    // Fetch the lab test record
    const testDoc = await getDoc(doc(firestoredb, "labTests", testId));
    if (!testDoc.exists()) {
      return {
        success: false,
        message: "Test record not found",
      };
    }
    const labTest = { id: testDoc.id, ...testDoc.data() };

    // Fetch the patient information
    const userDoc = await getDoc(doc(firestoredb, "users", labTest.userId));
    if (!userDoc.exists()) {
      return {
        success: false,
        message: "Patient information not found",
      };
    }
    const patientInfo = { id: userDoc.id, ...userDoc.data() };

    // Fetch the test template
    const templateDoc = await getDoc(
      doc(firestoredb, "testTemplates", templateId)
    );
    if (!templateDoc.exists()) {
      return {
        success: false,
        message: "Test template not found",
      };
    }
    const template = { id: templateDoc.id, ...templateDoc.data() };

    // Generate PDF
    const pdf = await createPDF(labTest, patientInfo, template, resultValues);

    // Upload PDF to cloud storage (Cloudinary in this case)
    const pdfUrl = await uploadToCloudinary(pdf, testId, labTest.userId);

    if (!pdfUrl) {
      return {
        success: false,
        message: "Failed to upload report to cloud storage",
      };
    }

    // Update lab test with results and report URL
    await updateDoc(doc(firestoredb, "labTests", testId), {
      status: "completed",
      reportUrl: pdfUrl,
      reportDate: moment().format("YYYY-MM-DD HH:mm:ss"),
      testResults: resultValues,
      updatedAt: Timestamp.now(),
    });

    return {
      success: true,
      message: "Test results uploaded successfully",
      data: {
        reportUrl: pdfUrl,
      },
    };
  } catch (error) {
    console.error("Error generating lab test report:", error);
    return {
      success: false,
      message: "Failed to generate report: " + error.message,
    };
  }
};

// Helper function to create PDF document
const createPDF = async (labTest, patientInfo, template, resultValues) => {
  // Create new PDF document
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 15;

  // Add header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Medical Test Report", pageWidth / 2, yPosition, {
    align: "center",
  });
  yPosition += 10;

  // Add lab info
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Lab: HealthCare Laboratory Services`, 15, yPosition);
  yPosition += 7;
  doc.text(`Report Date: ${moment().format("DD/MM/YYYY")}`, 15, yPosition);
  yPosition += 7;
  doc.text(`Test: ${template.name}`, 15, yPosition);
  yPosition += 7;
  doc.text(`Test ID: ${labTest.id}`, 15, yPosition);
  yPosition += 10;

  // Add patient info
  doc.setFont("helvetica", "bold");
  doc.text("Patient Information", 15, yPosition);
  yPosition += 7;
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${patientInfo.name}`, 15, yPosition);
  yPosition += 7;
  doc.text(
    `Age: ${patientInfo.age || "N/A"} | Gender: ${patientInfo.gender || "N/A"}`,
    15,
    yPosition
  );
  yPosition += 7;
  doc.text(`Patient ID: ${patientInfo.id}`, 15, yPosition);
  yPosition += 7;
  doc.text(
    `Sample Collection: ${labTest.date}, ${labTest.timeSlot}`,
    15,
    yPosition
  );
  yPosition += 15;

  // Add test results
  doc.setFont("helvetica", "bold");
  doc.text("Test Results", 15, yPosition);
  yPosition += 10;

  // Create results table
  doc.setFont("helvetica", "bold");
  doc.text("Parameter", 15, yPosition);
  doc.text("Result", 90, yPosition);
  doc.text("Unit", 130, yPosition);
  doc.text("Reference Range", 160, yPosition);
  yPosition += 7;

  // Add line
  doc.line(15, yPosition - 3, pageWidth - 15, yPosition - 3);

  // Add parameters and results
  doc.setFont("helvetica", "normal");
  template.parameters.forEach((param) => {
    // Check if value is out of reference range
    const value = resultValues[param.name];
    const isOutOfRange = checkIfOutOfRange(value, param.refRange);

    if (isOutOfRange) {
      doc.setTextColor(255, 0, 0); // Red color for out of range values
    } else {
      doc.setTextColor(0, 0, 0); // Reset to black
    }

    doc.text(param.name, 15, yPosition);
    doc.text(value || "N/A", 90, yPosition);
    doc.text(param.unit, 130, yPosition);
    doc.text(param.refRange, 160, yPosition);

    yPosition += 7;
  });

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Add line
  doc.line(15, yPosition, pageWidth - 15, yPosition);
  yPosition += 10;

  // Add notes
  if (resultValues.notes) {
    doc.setFont("helvetica", "bold");
    doc.text("Notes:", 15, yPosition);
    yPosition += 7;
    doc.setFont("helvetica", "normal");

    // Split long notes into multiple lines
    const splitNotes = doc.splitTextToSize(resultValues.notes, pageWidth - 30);
    doc.text(splitNotes, 15, yPosition);
    yPosition += splitNotes.length * 7 + 10;
  }

  // Add signature
  doc.setFont("helvetica", "italic");
  doc.text("Electronically verified report.", 15, yPosition);
  yPosition += 7;
  doc.text(
    "This is a computer-generated report and does not require signature.",
    15,
    yPosition
  );

  // Get blob from PDF
  const pdfBlob = doc.output("blob");

  return pdfBlob;
};

// Check if value is out of reference range
const checkIfOutOfRange = (value, refRange) => {
  if (!refRange || !value) return false;

  // Handle different reference range formats
  // Example: "3.5 - 5.0" or "<200" or ">10"
  try {
    if (refRange.includes(" - ")) {
      const [min, max] = refRange.split(" - ").map(Number);
      const numValue = parseFloat(value);
      return numValue < min || numValue > max;
    } else if (refRange.startsWith("<")) {
      const max = parseFloat(refRange.substring(1));
      return parseFloat(value) >= max;
    } else if (refRange.startsWith(">")) {
      const min = parseFloat(refRange.substring(1));
      return parseFloat(value) <= min;
    }
  } catch (e) {
    return false;
  }

  return false;
};

// Upload PDF to Cloudinary
const uploadToCloudinary = async (pdfBlob, testId, userId) => {
  if (!pdfBlob) return null;

  try {
    const formData = new FormData();
    formData.append("file", pdfBlob, `report_${testId}.pdf`);
    formData.append("upload_preset", "Records"); // Your Cloudinary upload preset
    formData.append("folder", `patient-records/${userId}/test-results`);

    const uploadResponse = await fetch(
      "https://api.cloudinary.com/v1_1/your_cloud_name/raw/upload", // Replace with your Cloudinary cloud name
      {
        method: "POST",
        body: formData,
      }
    );

    const uploadResult = await uploadResponse.json();

    if (!uploadResponse.ok) {
      throw new Error(uploadResult.message || "Upload failed");
    }

    return uploadResult.secure_url;
  } catch (error) {
    console.error("Upload error:", error);
    return null;
  }
};

// Update lab test with results
export const UpdateLabTest = async (testId, updateData) => {
  try {
    if (!testId) {
      return {
        success: false,
        message: "Test ID is required",
      };
    }

    await updateDoc(doc(firestoredb, "labTests", testId), {
      ...updateData,
      updatedAt: Timestamp.now(),
    });

    return {
      success: true,
      message: `Test updated successfully`,
    };
  } catch (error) {
    console.error("Error updating test:", error);
    return {
      success: false,
      message: "Failed to update test: " + error.message,
    };
  }
};
