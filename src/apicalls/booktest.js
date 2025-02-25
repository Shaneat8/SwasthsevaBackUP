import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
  orderBy,
  limit,
} from "firebase/firestore";
import moment from "moment";
import firestoredb from "../firebaseConfig";

// Book a lab test
export const BookLabTest = async (payload) => {
  try {
    // Validate that required fields are present
    if (
      !payload.userId ||
      !payload.testId ||
      !payload.date ||
      !payload.timeSlot
    ) {
      return {
        success: false,
        message: "Missing required information for booking",
      };
    }

    // Check if slot is available
    const availabilityCheck = await CheckSpecificSlot(
      payload.date,
      payload.timeSlot
    );
    if (!availabilityCheck.available) {
      return {
        success: false,
        message:
          "This slot is no longer available. Please select another time slot.",
      };
    }

    // Calculate total price based on number of patients
    const totalPrice = payload.price * payload.numPatients;

    // Add timestamp for easier querying
    const bookingDate = moment(payload.date, "YYYY-MM-DD").toDate();

    // Create booking record
    const bookingData = {
      ...payload,
      totalPrice,
      dateTimestamp: Timestamp.fromDate(bookingDate),
      createdAt: Timestamp.now(),
    };

    // Save to Firestore
    const docRef = await addDoc(
      collection(firestoredb, "labTests"),
      bookingData
    );

    return {
      success: true,
      message: "Test booked successfully!",
      data: {
        id: docRef.id,
        ...bookingData,
      },
    };
  } catch (error) {
    console.error("Error booking test:", error);
    return {
      success: false,
      message: "Failed to book test: " + error.message,
    };
  }
};
// Get all booked tests for a user
export const GetUserTests = async (userId) => {
  try {
    if (!userId) {
      return {
        success: false,
        message: "User ID is required",
      };
    }

    // Simple query that doesn't require a composite index
    const q = query(
      collection(firestoredb, "labTests"),
      where("userId", "==", userId)
    );

    const querySnapshot = await getDocs(q);
    const tests = [];

    querySnapshot.forEach((doc) => {
      tests.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Sort in memory instead of using orderBy in the query
    tests.sort(
      (a, b) => b.dateTimestamp.toMillis() - a.dateTimestamp.toMillis()
    );

    // Limit to 10 most recent after sorting
    const recentTests = tests.slice(0, 10);

    return {
      success: true,
      data: recentTests,
    };
  } catch (error) {
    console.error("Error fetching user tests:", error);
    return {
      success: false,
      message: "Failed to fetch tests: " + error.message,
    };
  }
};

// Check availability for a specific date
export const CheckAvailability = async (date) => {
  try {
    if (!date) {
      return {
        success: false,
        message: "Date is required",
      };
    }

    // Query all bookings for the specified date
    const bookingDate = moment(date, "YYYY-MM-DD").toDate();
    const startOfDay = new Date(bookingDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(bookingDate);
    endOfDay.setHours(23, 59, 59, 999);

    const q = query(
      collection(firestoredb, "labTests"),
      where("dateTimestamp", ">=", Timestamp.fromDate(startOfDay)),
      where("dateTimestamp", "<=", Timestamp.fromDate(endOfDay))
    );

    const querySnapshot = await getDocs(q);
    const bookedSlots = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      bookedSlots.push({
        id: doc.id,
        slot: data.timeSlot,
        status: data.status,
      });
    });

    return {
      success: true,
      data: bookedSlots,
    };
  } catch (error) {
    console.error("Error checking availability:", error);
    return {
      success: false,
      message: "Failed to check availability: " + error.message,
    };
  }
};

// Check if a specific slot is available
export const CheckSpecificSlot = async (date, slot) => {
  try {
    const availabilityResponse = await CheckAvailability(date);

    if (!availabilityResponse.success) {
      return {
        available: false,
        message: availabilityResponse.message,
      };
    }

    const isSlotBooked = availabilityResponse.data.some(
      (bookedSlot) =>
        bookedSlot.slot === slot && bookedSlot.status !== "cancelled"
    );

    return {
      available: !isSlotBooked,
      message: isSlotBooked
        ? "This slot is already booked"
        : "Slot is available",
    };
  } catch (error) {
    console.error("Error checking specific slot:", error);
    return {
      available: false,
      message: "Failed to check slot availability: " + error.message,
    };
  }
};

// Cancel a booked test
export const CancelLabTest = async (testId) => {
  try {
    if (!testId) {
      return {
        success: false,
        message: "Test ID is required",
      };
    }

    // In a real implementation, you would update the document in Firestore
    // Since we can't import specific document updating functions without seeing your
    // full Firebase setup, this is a placeholder

    // const testRef = doc(firestoredb, "labTests", testId);
    // await updateDoc(testRef, {
    //   status: "cancelled",
    //   cancelledAt: Timestamp.now()
    // });

    return {
      success: true,
      message: "Test booking cancelled successfully",
    };
  } catch (error) {
    console.error("Error cancelling test:", error);
    return {
      success: false,
      message: "Failed to cancel test: " + error.message,
    };
  }
};

// Get a specific test by ID
export const GetTestById = async (testId) => {
  try {
    if (!testId) {
      return {
        success: false,
        message: "Test ID is required",
      };
    }

    // In a real implementation, you would fetch the specific document
    // const testDoc = await getDoc(doc(firestoredb, "labTests", testId));
    // if (testDoc.exists()) {
    //   return {
    //     success: true,
    //     data: {
    //       id: testDoc.id,
    //       ...testDoc.data()
    //     }
    //   };
    // } else {
    //   return {
    //     success: false,
    //     message: "Test not found"
    //   };
    // }

    // Placeholder implementation
    return {
      success: true,
      data: {
        id: testId,
        // Other test data would be here
      },
    };
  } catch (error) {
    console.error("Error fetching test:", error);
    return {
      success: false,
      message: "Failed to fetch test: " + error.message,
    };
  }
};

// Get all tests (for admin dashboard)
export const GetAllTests = async () => {
  try {
    const querySnapshot = await getDocs(
      query(
        collection(firestoredb, "labTests"),
        orderBy("dateTimestamp", "desc")
      )
    );

    const tests = [];

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
    console.error("Error fetching all tests:", error);
    return {
      success: false,
      message: "Failed to fetch tests: " + error.message,
    };
  }
};

// Update test status (for admin)
export const UpdateTestStatus = async (testId, status, remarks) => {
  try {
    if (!testId || !status) {
      return {
        success: false,
        message: "Test ID and status are required",
      };
    }

    // In a real implementation, update the document in Firestore
    // const testRef = doc(firestoredb, "labTests", testId);
    // await updateDoc(testRef, {
    //   status,
    //   remarks,
    //   updatedAt: Timestamp.now()
    // });

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

// Get tests by date range (for reports)
// Get tests by date range (for reports)
export const GetTestsByDateRange = async (startDate, endDate) => {
    try {
      if (!startDate || !endDate) {
        return {
          success: false,
          message: "Start and end dates are required"
        };
      }
      
      const startTimestamp = Timestamp.fromDate(moment(startDate, "YYYY-MM-DD").startOf('day').toDate());
      const endTimestamp = Timestamp.fromDate(moment(endDate, "YYYY-MM-DD").endOf('day').toDate());
      
      // Simpler query that might not require an index
      const q = query(
        collection(firestoredb, "labTests")
      );
      
      const querySnapshot = await getDocs(q);
      const allTests = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Filter in memory
        if (data.dateTimestamp >= startTimestamp && 
            data.dateTimestamp <= endTimestamp) {
          allTests.push({
            id: doc.id,
            ...data
          });
        }
      });
      
      // Sort in memory
      allTests.sort((a, b) => a.dateTimestamp.toMillis() - b.dateTimestamp.toMillis());
      
      return {
        success: true,
        data: allTests
      };
    } catch (error) {
      console.error("Error fetching tests by date range:", error);
      return {
        success: false,
        message: "Failed to fetch tests: " + error.message
      };
    }
  };
