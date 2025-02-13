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



  export const BookDoctorAppointment = async (payload) => {
    try {
      const docRef = await addDoc(collection(firestoredb, "appointments"), {
        ...payload,
        status: "pending",
        bookedOn: new Date().toISOString(),
        rescheduleStatus: null,
      });

      // Send email notification to doctor about new appointment
      if (payload.doctorEmail) {
        await sendAppointmentEmail(
          payload.doctorEmail,
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
  
      // Handle initial approval
      if (status === "approved" && appointmentData.status === "pending") {
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


  // UpdateRescheduleResponse function modifications
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