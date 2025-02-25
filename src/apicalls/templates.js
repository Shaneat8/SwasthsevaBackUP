import { doc, getDoc, Timestamp, updateDoc } from "firebase/firestore";
import firestoredb from "../firebaseConfig";
import labTestTemplates from "../pages/Admin/TestManagement/LabTestTemplates";

// Get all test templates
export const GetAllTestTemplates = async () => {
  try {
    // In a real implementation, you would fetch from Firestore
    // Here we're just using the imported data
    return {
      success: true,
      data: labTestTemplates
    };
  } catch (error) {
    console.error("Error fetching test templates:", error);
    return {
      success: false,
      message: "Failed to fetch test templates: " + error.message
    };
  }
};

// Get a specific test template by ID
export const GetTestTemplateById = async (testId) => {
  try {
    if (!testId) {
      return {
        success: false,
        message: "Test ID is required"
      };
    }

    // Find the template with the matching ID
    const template = labTestTemplates.find(template => template.id === testId);
    
    if (!template) {
      return {
        success: false,
        message: "Template not found for the specified test"
      };
    }

    return {
      success: true,
      data: template
    };
  } catch (error) {
    console.error("Error fetching test template:", error);
    return {
      success: false,
      message: "Failed to fetch test template: " + error.message
    };
  }
};

// Add a new test template (for admin use)
export const AddTestTemplate = async (templateData) => {
  try {
    if (!templateData || !templateData.id || !templateData.name || !templateData.parameters) {
      return {
        success: false,
        message: "Missing required template information"
      };
    }

    // In a real implementation, you would add to Firestore
    // Here we're just returning a success response
    return {
      success: true,
      message: "Test template added successfully",
      data: templateData
    };
  } catch (error) {
    console.error("Error adding test template:", error);
    return {
      success: false,
      message: "Failed to add test template: " + error.message
    };
  }
};

// Update an existing test template (for admin use)
export const UpdateTestTemplate = async (testId, templateData) => {
  try {
    if (!testId || !templateData) {
      return {
        success: false,
        message: "Test ID and template data are required"
      };
    }

    // In a real implementation, you would update in Firestore
    // Here we're just returning a success response
    return {
      success: true,
      message: "Test template updated successfully",
      data: {
        id: testId,
        ...templateData
      }
    };
  } catch (error) {
    console.error("Error updating test template:", error);
    return {
      success: false,
      message: "Failed to update test template: " + error.message
    };
  }
};

// Delete a test template (for admin use)
export const DeleteTestTemplate = async (testId) => {
  try {
    if (!testId) {
      return {
        success: false,
        message: "Test ID is required"
      };
    }

    // In a real implementation, you would delete from Firestore
    // Here we're just returning a success response
    return {
      success: true,
      message: "Test template deleted successfully"
    };
  } catch (error) {
    console.error("Error deleting test template:", error);
    return {
      success: false,
      message: "Failed to delete test template: " + error.message
    };
  }
};

export const UpdateTestStatus = async (testId, status, remarks, results, labId) => {
    try {
      if (!testId || !status) {
        return {
          success: false,
          message: "Test ID and status are required",
        };
      }
  
      // Reference to the test document
      const testRef = doc(firestoredb, "labTests", testId);
      
      // Check if the test exists
      const testDoc = await getDoc(testRef);
      if (!testDoc.exists()) {
        return {
          success: false,
          message: "Test not found",
        };
      }
  
      // Data to update
      const updateData = {
        status,
        updatedAt: Timestamp.now()
      };
  
      // Add optional fields if provided
      if (remarks) updateData.remarks = remarks;
      if (results) updateData.results = results;
      if (labId) updateData.labId = labId;
  
      // Update the document
      await updateDoc(testRef, updateData);
  
      return {
        success: true,
        message: `Test status updated to ${status} successfully`,
      };
    } catch (error) {
      console.error("Error updating test status:", error);
      return {
        success: false,
        message: "Failed to update test status: " + error.message,
      };
    }
  };
  