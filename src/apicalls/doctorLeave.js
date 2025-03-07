import firestoredb from "../firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
  Timestamp,
  serverTimestamp,
  collectionGroup
} from "firebase/firestore";
import { HandleAppointmentsForDoctorLeave } from "./appointment";

// Add a new leave request
export const AddDoctorLeave = async (leaveData) => {
  try {
    if (!leaveData.doctorId || !leaveData.startDate || !leaveData.endDate || !leaveData.reason) {
      return { 
        success: false, 
        message: 'Missing required fields for leave request' 
      };
    }

    // Prepare leave data with timestamps
    const formattedLeaveData = {
      ...leaveData,
      doctorEmail: leaveData.doctorEmail,
      startDate: Timestamp.fromDate(new Date(leaveData.startDate)),
      endDate: Timestamp.fromDate(new Date(leaveData.endDate)),
      reason: leaveData.reason,
      status: leaveData.status || 'approved',
      createdAt: serverTimestamp()
    };
    
    // Get reference to the doctor's leaves subcollection
    const leavesRef = collection(firestoredb, "doctorLeaves", leaveData.doctorId, "leaves");
    const docRef = await addDoc(leavesRef, formattedLeaveData);
    
    // Update doctor's status to indicate they're on leave
    await updateDoc(doc(firestoredb, "doctors", leaveData.doctorId), {
      onLeave: true,
      leaveStartDate: formattedLeaveData.startDate,
      leaveEndDate: formattedLeaveData.endDate,
      leaveReason: leaveData.reason,
      currentLeaveId: docRef.id // Store reference to current leave document
    });
    
    // Handle existing appointments during the leave period
    const appointmentsResult = await HandleAppointmentsForDoctorLeave(
      leaveData.doctorId, 
      leaveData.startDate, 
      leaveData.endDate, 
      leaveData.reason
    );
    
    return { 
      success: true, 
      message: 'Leave request added successfully', 
      data: docRef.id,
      appointmentsAffected: appointmentsResult.affectedCount || 0
    };
  } catch (error) {
    console.error('Error adding leave request:', error);
    return { 
      success: false, 
      message: error.message 
    };
  }
};

// Cancel a leave request
export const CancelDoctorLeave = async (leaveId, doctorId) => {
  try {
    // Update the leave record status to cancelled
    await updateDoc(doc(firestoredb, "doctorLeaves", doctorId, "leaves", leaveId), {
      status: 'cancelled',
      updatedAt: serverTimestamp()
    });
    
    // Get doctor document to check if this is the current leave
    const doctorDoc = await getDoc(doc(firestoredb, "doctors", doctorId));
    const doctorData = doctorDoc.data();
    
    // Only update doctor's leave status if this is the currently active leave
    if (doctorData.currentLeaveId === leaveId) {
      await updateDoc(doc(firestoredb, "doctors", doctorId), {
        onLeave: false,
        leaveStartDate: null,
        leaveEndDate: null,
        leaveReason: '',
        currentLeaveId: null
      });
    }
    
    return { 
      success: true, 
      message: 'Leave request cancelled successfully' 
    };
  } catch (error) {
    console.error('Error cancelling leave request:', error);
    return { 
      success: false, 
      message: error.message 
    };
  }
};

// Get all leave requests for a specific doctor
export const GetDoctorLeaves = async (doctorId) => {
  try {
    const leavesRef = collection(firestoredb, "doctorLeaves", doctorId, "leaves");
    const leavesSnapshot = await getDocs(leavesRef);
    
    const leaves = [];
    leavesSnapshot.forEach(doc => {
      const data = doc.data();
      leaves.push({
        id: doc.id,
        ...data,
        // Convert Firestore timestamps to JavaScript dates for easier handling in UI
        startDate: data.startDate.toDate(),
        endDate: data.endDate.toDate(),
        createdAt: data.createdAt?.toDate() || new Date()
      });
    });
    
    // Sort leaves by start date (newest first)
    leaves.sort((a, b) => b.startDate - a.startDate);
    
    return { 
      success: true, 
      data: leaves 
    };
  } catch (error) {
    console.error('Error fetching doctor leaves:', error);
    return { 
      success: false, 
      message: error.message 
    };
  }
};

// Check if a doctor is on leave on a specific date
export const CheckDoctorOnLeave = async (doctorId, date) => {
  try {
    const doctorDoc = await getDoc(doc(firestoredb, "doctors", doctorId));
    
    if (!doctorDoc.exists()) {
      return { 
        success: false, 
        message: 'Doctor not found' 
      };
    }
    
    const doctorData = doctorDoc.data();
    
    // If doctor is not on leave, return false immediately
    if (!doctorData.onLeave) {
      return { 
        success: true, 
        data: { onLeave: false } 
      };
    }
    
    // Check if the specified date falls within the leave period
    const checkDate = date ? new Date(date) : new Date();
    const startDate = doctorData.leaveStartDate.toDate();
    const endDate = doctorData.leaveEndDate.toDate();
    
    const isOnLeave = checkDate >= startDate && checkDate <= endDate;
    
    // If the doctor is on leave, get the current leave details
    let leaveDetails = null;
    if (isOnLeave && doctorData.currentLeaveId) {
      const leaveDoc = await getDoc(
        doc(firestoredb, "doctorLeaves", doctorId, "leaves", doctorData.currentLeaveId)
      );
      if (leaveDoc.exists()) {
        leaveDetails = leaveDoc.data();
      }
    }
    
    return { 
      success: true, 
      data: { 
        onLeave: isOnLeave,
        startDate,
        endDate,
        reason: doctorData.leaveReason,
        leaveDetails
      }
    };
  } catch (error) {
    console.error('Error checking doctor leave status:', error);
    return { 
      success: false, 
      message: error.message 
    };
  }
};

// Get all doctors currently on leave
export const GetDoctorsOnLeave = async () => {
  try {
    const doctorsQuery = query(
      collection(firestoredb, "doctors"),
      where("onLeave", "==", true)
    );
    
    const doctorsSnapshot = await getDocs(doctorsQuery);
    
    const doctors = [];
    doctorsSnapshot.forEach(doc => {
      const data = doc.data();
      doctors.push({
        id: doc.id,
        ...data,
        leaveStartDate: data.leaveStartDate?.toDate(),
        leaveEndDate: data.leaveEndDate?.toDate()
      });
    });
    
    return { 
      success: true, 
      data: doctors 
    };
  } catch (error) {
    console.error('Error fetching doctors on leave:', error);
    return { 
      success: false, 
      message: error.message 
    };
  }
};

// Automatically update doctor leave status based on current date
export const UpdateLeaveStatuses = async () => {
  try {
    const doctorsQuery = query(
      collection(firestoredb, "doctors"),
      where("onLeave", "==", true)
    );
    
    const doctorsSnapshot = await getDocs(doctorsQuery);
    const currentDate = new Date();
    let updateCount = 0;
    
    // Update each doctor's leave status if leave period has ended
    const promises = [];
    for (const docSnapshot of doctorsSnapshot.docs) {
      const doctorData = docSnapshot.data();
      const endDate = doctorData.leaveEndDate.toDate();
      
      // If leave end date has passed, update doctor's leave status
      if (currentDate > endDate) {
        // Update the leave status in the subcollection if currentLeaveId exists
        if (doctorData.currentLeaveId) {
          promises.push(
            updateDoc(
              doc(firestoredb, "doctorLeaves", docSnapshot.id, "leaves", doctorData.currentLeaveId),
              { status: 'completed', updatedAt: serverTimestamp() }
            )
          );
        }

        // Update doctor document
        promises.push(
          updateDoc(doc(firestoredb, "doctors", docSnapshot.id), {
            onLeave: false,
            leaveStartDate: null,
            leaveEndDate: null,
            leaveReason: '',
            currentLeaveId: null
          })
        );
        updateCount++;
      }
    }
    
    await Promise.all(promises);
    
    return { 
      success: true, 
      message: `Updated leave status for ${updateCount} doctors` 
    };
  } catch (error) {
    console.error('Error updating leave statuses:', error);
    return { 
      success: false, 
      message: error.message 
    };
  }
};

// Query all leaves across all doctors (for admin views)
export const GetAllDoctorLeaves = async () => {
  try {
    // Use collectionGroup to query all "leaves" subcollections regardless of parent
    const leavesQuery = query(collectionGroup(firestoredb, "leaves"));
    const leavesSnapshot = await getDocs(leavesQuery);
    
    const leaves = [];
    leavesSnapshot.forEach(doc => {
      const data = doc.data();
      // Get doctorId from the reference path
      const pathSegments = doc.ref.path.split('/');
      const doctorId = pathSegments[1]; // "doctorLeaves/doctorId/leaves/leaveId"
      
      leaves.push({
        id: doc.id,
        doctorId,
        ...data,
        startDate: data.startDate.toDate(),
        endDate: data.endDate.toDate(),
        createdAt: data.createdAt?.toDate() || new Date()
      });
    });
    
    // Sort leaves by creation date (newest first)
    leaves.sort((a, b) => b.createdAt - a.createdAt);
    
    return { 
      success: true, 
      data: leaves 
    };
  } catch (error) {
    console.error('Error fetching all doctor leaves:', error);
    return { 
      success: false, 
      message: error.message 
    };
  }
};

// Export the CheckDoctorOnLeave function with an alternate name to match what's used in appointmentApiCalls
export const CheckDoctorLeaveStatus = async (doctorId, date) => {
  const result = await CheckDoctorOnLeave(doctorId, date);
  
  if (!result.success) {
    return {
      isOnLeave: false,
      leaveReason: ""
    };
  }
  
  return {
    isOnLeave: result.data.onLeave,
    leaveReason: result.data.reason || ""
  };
};