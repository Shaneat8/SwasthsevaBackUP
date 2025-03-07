import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import firestoredb from "../firebaseConfig";
import sendAppointmentEmail from "./reschedule_app";
import { CheckDoctorLeaveStatus } from "./doctorLeave";

export const BookDoctorAppointment = async (payload) => {
  try {
    // Check if the doctor is on leave for the requested date
    const leaveStatus = await CheckDoctorLeaveStatus(payload.doctorId, payload.date);
    
    if (leaveStatus.isOnLeave) {
      return {
        success: false,
        message: `The doctor is on leave on ${payload.date}. Reason: ${leaveStatus.leaveReason}`,
        isOnLeave: true,
        leaveReason: leaveStatus.leaveReason
      };
    }
    
    const docRef = await addDoc(collection(firestoredb, "appointments"), {
      ...payload,
      status: "pending",
      bookedOn: new Date().toISOString(),
      rescheduleStatus: null,
    });

    // Send email notification to patient about new appointment
    if (payload.userEmail) {
      await sendAppointmentEmail(
        payload.userEmail,
        'NEW_APPOINTMENT',
        {
          patientName: payload.userName,
          date: payload.date,
          timeSlot: payload.timeSlot,
          problem: payload.problem
        }
      );
    }

    return {
      success: true,
      message: "Appointment Booked Successfully",
      appointmentId: docRef.id
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

// Get appointments for a specific doctor on a specific date
export const GetDocAppointmentsOnDate = async (doctorId, date) => {
  try {
    // First check if doctor is on leave
    const leaveStatus = await CheckDoctorLeaveStatus(doctorId, date);
    
    const queryCheck = await getDocs(
      query(
        collection(firestoredb, "appointments"),
        where("doctorId", "==", doctorId),
        where("date", "==", date)
      )
    );
    const data = [];
    queryCheck.forEach((doc) => {
      data.push({
        ...doc.data(),
        id: doc.id
      });
    });
    return {
      success: true,
      data,
      isOnLeave: leaveStatus.isOnLeave,
      leaveReason: leaveStatus.leaveReason
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const GetDoctorAppointments = async (doctorId) => {
  try {
    const queryCheck = await getDocs(
      query(
        collection(firestoredb, "appointments"),
        where("doctorId", "==", doctorId)
      )
    );
    const data = [];
    queryCheck.forEach((doc) => {
      data.push({
        ...doc.data(),
        id: doc.id,
      });
    });
    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const GetUserAppointments = async (userId) => {
  try {
    const queryCheck = await getDocs(
      query(
        collection(firestoredb, "appointments"),
        where("userId", "==", userId)
      )
    );
    const data = [];
    queryCheck.forEach((doc) => {
      data.push({
        ...doc.data(),
        id: doc.id,
      });
    });
    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

// Update appointment status (approve/cancel/reschedule) added seen status
export const UpdateAppointmentStatus = async (id, status, data = {}) => {
  try {
    const appointmentRef = doc(firestoredb, "appointments", id);
    const appointmentSnap = await getDoc(appointmentRef);
    
    if (!appointmentSnap.exists()) {
      throw new Error("Appointment not found");
    }

    const appointmentData = appointmentSnap.data();
    let updateData = { status };

    // Check if doctor is on leave for the appointment date before approving
    if (status === "approved" && appointmentData.status === "pending") {
      const leaveStatus = await CheckDoctorLeaveStatus(
        appointmentData.doctorId, 
        appointmentData.date
      );
      
      if (leaveStatus.isOnLeave) {
        return {
          success: false,
          message: `Cannot approve appointment. You are on leave on ${appointmentData.date}. Reason: ${leaveStatus.leaveReason}`,
          isOnLeave: true,
          leaveReason: leaveStatus.leaveReason
        };
      }
      
      if (appointmentData.userEmail) {
        await sendAppointmentEmail(
          appointmentData.userEmail,
          'APPOINTMENT_APPROVED',
          {
            doctorName: appointmentData.doctorName,
            date: appointmentData.date,
            timeSlot: appointmentData.timeSlot
          }
        );
      }
    }

    // Handle marking appointment as seen
    if (status === "seen") {
      updateData = {
        ...updateData,
        seenAt: new Date().toISOString(),
        lastModifiedAt: new Date().toISOString(),
      };
    }

    // Handle cancellation with reschedule
    if (status === "cancelled") {
      if (!data.reason || !data.newDate || !data.newTimeSlot) {
        throw new Error(
          "Cancellation reason, new date, and new time slot are required."
        );
      }
      
      // Check if doctor is on leave for the new suggested date
      const leaveStatus = await CheckDoctorLeaveStatus(
        appointmentData.doctorId, 
        data.newDate
      );
      
      if (leaveStatus.isOnLeave) {
        return {
          success: false,
          message: `Cannot reschedule to ${data.newDate}. You are on leave on this date. Reason: ${leaveStatus.leaveReason}`,
          isOnLeave: true,
          leaveReason: leaveStatus.leaveReason
        };
      }

      updateData = {
        ...updateData,
        cancellationReason: data.reason,
        suggestedNewDate: data.newDate,
        suggestedNewTimeSlot: data.newTimeSlot,
        rescheduleStatus: "pending",
      };

      if (appointmentData.userEmail) {
        await sendAppointmentEmail(
          appointmentData.userEmail,
          'RESCHEDULE_REQUEST',
          {
            doctorName: appointmentData.doctorName,
            originalDate: appointmentData.date,
            originalTime: appointmentData.timeSlot,
            newDate: data.newDate,
            newTime: data.newTimeSlot,
            reason: data.reason,
            appointmentId: id
          }
        );
      }
    }

    await updateDoc(appointmentRef, updateData);
    return {
      success: true,
      message: getStatusMessage(status),
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const HandleLeaveResponse = async (appointmentId, action) => {
  try {
    const appointmentRef = doc(firestoredb, "appointments", appointmentId);
    const appointmentSnap = await getDoc(appointmentRef);

    if (!appointmentSnap.exists()) {
      return {
        success: false,
        message: "Appointment not found",
      };
    }

    const appointmentData = appointmentSnap.data();
    
    // Verify the appointment is affected by leave
    if (appointmentData.status !== "affected-by-leave") {
      return {
        success: false,
        message: "This appointment is not affected by a doctor's leave",
      };
    }

    // Handle different actions
    if (action === "cancel") {
      // Cancel the appointment
      await updateDoc(appointmentRef, {
        status: "cancelled",
        cancellationReason: "Cancelled due to doctor's leave",
        cancelledOn: new Date().toISOString(),
        leaveResponseAction: "cancelled"
      });

      // Send cancellation confirmation email to patient
      if (appointmentData.userEmail) {
        await sendAppointmentEmail(
          appointmentData.userEmail,
          'PATIENT_REJECT', // Reuse the rejection email template
          {
            doctorName: appointmentData.doctorName
          }
        );
      }

      return {
        success: true,
        message: "Appointment cancelled successfully",
        action: "cancel"
      };
      
    } else if (action === "reschedule") {
      // Don't actually reschedule here - just mark that the patient wants to reschedule
      // and return data to help populate the booking form
      
      return {
        success: true,
        message: "Ready to reschedule appointment",
        action: "reschedule",
        appointmentData: {
          doctorId: appointmentData.doctorId,
          doctorName: appointmentData.doctorName,
          userId: appointmentData.userId,
          userName: appointmentData.userName,
          userEmail: appointmentData.userEmail,
          problem: appointmentData.problem,
          originalDate: appointmentData.date,
          originalTimeSlot: appointmentData.timeSlot,
          leaveStartDate: appointmentData.leaveStartDate,
          leaveEndDate: appointmentData.leaveEndDate
        }
      };
    } else {
      return {
        success: false,
        message: "Invalid action. Please choose 'cancel' or 'reschedule'",
      };
    }
  } catch (error) {
    console.error("Error handling leave response:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

// New function to automatically cancel/reschedule appointments when doctor takes leave
// Update the HandleAppointmentsForDoctorLeave function to handle the new approach

export const HandleAppointmentsForDoctorLeave = async (doctorId, startDate, endDate, leaveReason, isCheckOnly = false) => {
  try {
    // Get all appointments for this doctor in the date range
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    // Format dates to match how they're stored in Firestore
    const formattedDates = [];
    const currentDate = new Date(startDateObj);
    
    while (currentDate <= endDateObj) {
      formattedDates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Can't use date range in Firestore query, so we'll get all appointments and filter
    const queryCheck = await getDocs(
      query(
        collection(firestoredb, "appointments"),
        where("doctorId", "==", doctorId),
        where("status", "in", ["pending", "approved"])
      )
    );
    
    const affectedAppointments = [];
    queryCheck.forEach((doc) => {
      const appointmentData = doc.data();
      if (formattedDates.includes(appointmentData.date)) {
        affectedAppointments.push({
          ...appointmentData,
          id: doc.id
        });
      }
    });
    
    // No appointments affected
    if (affectedAppointments.length === 0) {
      return {
        success: true,
        message: "No appointments affected by this leave",
        affectedCount: 0
      };
    }
    
    // If this is just a check (not actually marking), return the affected appointments
    if (isCheckOnly) {
      return {
        success: true,
        message: `${affectedAppointments.length} appointments would be affected by this leave`,
        affectedCount: affectedAppointments.length,
        affectedAppointments: affectedAppointments
      };
    }
    
    // Process each affected appointment
    const updatePromises = affectedAppointments.map(async (appointment) => {
      const appointmentRef = doc(firestoredb, "appointments", appointment.id);
      
      // Update the appointment status to affected-by-leave instead of cancelled
      await updateDoc(appointmentRef, {
        status: "affected-by-leave",
        leaveReason: leaveReason,
        leaveStartDate: startDate,
        leaveEndDate: endDate,
        affectedByLeaveOn: new Date().toISOString(),
        responseDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days to respond
      });
      
      // Send notification to patient with options to reschedule or cancel
      if (appointment.userEmail) {
        await sendAppointmentEmail(
          appointment.userEmail,
          'APPOINTMENT_CANCELLED_BY_LEAVE',
          {
            patientName: appointment.userName || "Patient",
            doctorName: appointment.doctorName || "Your doctor",
            date: appointment.date,
            timeSlot: appointment.timeSlot,
            leaveReason: leaveReason,
            appointmentId: appointment.id
          }
        );
      }
      
      return appointment.id;
    });
    
    await Promise.all(updatePromises);
    
    return {
      success: true,
      message: `${affectedAppointments.length} appointments affected by doctor leave, notifications sent to patients`,
      affectedCount: affectedAppointments.length,
      affectedAppointments: affectedAppointments.map(a => ({ id: a.id, patientName: a.userName, date: a.date, timeSlot: a.timeSlot }))
    };
    
  } catch (error) {
    console.error("Error handling appointments for doctor leave:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

const getStatusMessage = (status) => {
  switch (status) {
    case "approved":
      return "Appointment Approved";
    case "seen":
      return "Appointment marked as seen";
    case "cancelled":
      return "Reschedule Request Sent";
    default:
      return "Appointment status updated";
  }
};

export const GetAppointmentById = async (appointmentId) => {
  try {
    const appointmentRef = doc(firestoredb, "appointments", appointmentId);
    const appointmentSnap = await getDoc(appointmentRef);

    if (!appointmentSnap.exists()) {
      return {
        success: false,
        message: "Appointment not found",
      };
    }

    return {
      success: true,
      data: {
        ...appointmentSnap.data(),
        id: appointmentSnap.id,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

// Handle patient's response to reschedule request
export const UpdateRescheduleResponse = async (appointmentId, response) => {
  try {
    const appointmentRef = doc(firestoredb, "appointments", appointmentId);
    const appointmentSnap = await getDoc(appointmentRef);

    if (!appointmentSnap.exists()) {
      return {
        success: false,
        message: "Appointment not found",
      };
    }

    const appointmentData = appointmentSnap.data();
    const updateData = {};

    // Check if the appointment is actually pending reschedule
    if (appointmentData.rescheduleStatus !== "pending") {
      return {
        success: false,
        message: "No pending reschedule request found",
      };
    }

    const isAccepting = response === 'accept';

    if (isAccepting) {
      // Check if doctor is on leave for the new suggested date before accepting
      const leaveStatus = await CheckDoctorLeaveStatus(
        appointmentData.doctorId, 
        appointmentData.suggestedNewDate
      );
      
      if (leaveStatus.isOnLeave) {
        return {
          success: false,
          message: `Cannot reschedule to ${appointmentData.suggestedNewDate}. The doctor is on leave on this date. Reason: ${leaveStatus.leaveReason}`,
          isOnLeave: true,
          leaveReason: leaveStatus.leaveReason
        };
      }
        
      // Update appointment with new schedule
      updateData.date = appointmentData.suggestedNewDate;
      updateData.timeSlot = appointmentData.suggestedNewTimeSlot;
      updateData.status = "approved";
      updateData.rescheduleStatus = "accepted";
    } else {
      // Mark as cancelled if rejected
      updateData.status = "cancelled";
      updateData.rescheduleStatus = "rejected";
    }

    // Clear the suggested fields
    updateData.suggestedNewDate = null;
    updateData.suggestedNewTimeSlot = null;
    updateData.cancellationReason = null;

    // Update the appointment
    await updateDoc(appointmentRef, updateData);

    // Send email notifications
    try {
      // Notify doctor
      if (appointmentData.doctorEmail) {
        await sendAppointmentEmail(
          appointmentData.doctorEmail,
          isAccepting ? 'DOCTOR_ACCEPT' : 'DOCTOR_REJECT',
          {
            userName: appointmentData.userName,
            newDate: appointmentData.suggestedNewDate,
            newTime: appointmentData.suggestedNewTimeSlot,
            originalDate: appointmentData.date,
            originalTime: appointmentData.timeSlot
          }
        );
      }

      // Notify patient
      if (appointmentData.userEmail) {
        await sendAppointmentEmail(
          appointmentData.userEmail,
          isAccepting ? 'PATIENT_ACCEPT' : 'PATIENT_REJECT',
          {
            doctorName: appointmentData.doctorName,
            newDate: appointmentData.suggestedNewDate,
            newTime: appointmentData.suggestedNewTimeSlot
          }
        );
      }
    } catch (emailError) {
      console.error('Error sending notification emails:', emailError);
      // Continue with the function even if email fails
    }

    return {
      success: true,
      message: isAccepting
        ? "Appointment rescheduled successfully"
        : "Appointment cancelled successfully",
    };
  } catch (error) {
    console.error("Error in UpdateRescheduleResponse:", error);
    return {
      success: false,
      message: error.message || "Failed to update appointment",
    };
  }
};

export const GetDoctorAppointmentsByDoctorId = async (doctorId) => {
  if (!doctorId) {
    return {
      success: false,
      message: "Doctor ID is required",
    };
  }

  try {
    const appointmentsQuery = query(
      collection(firestoredb, "appointments"),
      where("doctorId", "==", doctorId)
    );

    const querySnapshot = await getDocs(appointmentsQuery);
    const appointments = [];

    querySnapshot.forEach((doc) => {
      appointments.push({
        ...doc.data(),
        id: doc.id,
      });
    });

    console.log("Appointments fetched:", appointments);

    return {
      success: true,
      data: appointments,
    };
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};