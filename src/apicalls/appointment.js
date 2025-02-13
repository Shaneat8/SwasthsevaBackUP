import {
  addDoc,
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import firestoredb from "../firebaseConfig";

export const BookDoctorAppointment = async (payload) => {
  try {
    await addDoc(collection(firestoredb, "appointments"), payload);
    return {
      success: true,
      message: "Appointment Booked Successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

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
      data.push(doc.data());
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

// Update your appointment.js API calls
export const UpdateAppointmentStatus = async (id, status, data = {}) => {
  try {
    const appointmentRef = doc(firestoredb, "appointments", id);
    let updateData = { status };

    if (status === "cancelled") {
      updateData = {
        ...updateData,
        cancellationReason: data.reason,
        suggestedNewDate: data.newDate,
        suggestedNewTimeSlot: data.newTimeSlot,
        rescheduleStatus: "pending", // New field to track rescheduling
      };
    }

    await updateDoc(appointmentRef, updateData);
    return {
      success: true,
      message: "Appointment Status updated",
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

// Add new function to handle rescheduling response
export const UpdateRescheduleResponse = async (appointmentId, response) => {
  try {
    // Get the appointment document
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
    let emailSubject = "";
    let emailContent = "";

    if (response === "accept") {
      // Update appointment with the suggested new date and time
      updateData.date = appointmentData.suggestedNewDate;
      updateData.timeSlot = appointmentData.suggestedNewTimeSlot;
      updateData.status = "approved";
      updateData.rescheduleStatus = "accepted";
      updateData.suggestedNewDate = null;
      updateData.suggestedNewTimeSlot = null;

      // Prepare email for doctor
      emailSubject = "Patient Accepted Rescheduled Appointment";
      emailContent = `
        <h1>Rescheduled Appointment Accepted</h1>
        <p>The patient has accepted the rescheduled appointment.</p>
        <p>Patient: ${appointmentData.userName}</p>
        <p>New Date: ${appointmentData.suggestedNewDate}</p>
        <p>New Time: ${appointmentData.suggestedNewTimeSlot}</p>
      `;
    } else {
      // Mark as rejected and cancelled
      updateData.rescheduleStatus = "rejected";
      updateData.status = "cancelled";
      updateData.suggestedNewDate = null;
      updateData.suggestedNewTimeSlot = null;

      // Prepare email for doctor
      emailSubject = "Patient Rejected Rescheduled Appointment";
      emailContent = `
        <h1>Rescheduled Appointment Rejected</h1>
        <p>The patient has rejected the rescheduled appointment.</p>
        <p>Patient: ${appointmentData.userName}</p>
        <p>Original Appointment Date: ${appointmentData.date}</p>
        <p>Time: ${appointmentData.timeSlot}</p>
        <p>Please contact the patient to arrange a new appointment if needed.</p>
      `;
    }

    // Update the appointment
    await updateDoc(appointmentRef, updateData);

    // Send email notification to doctor
    if (appointmentData.doctorEmail) {
      await sendEmailNotification(
        appointmentData.doctorEmail,
        emailSubject,
        emailContent
      );
    }

    // Send confirmation email to patient
    const patientEmailSubject =
      response === "accept"
        ? "Appointment Rescheduling Confirmed"
        : "Appointment Cancellation Confirmed";

    const patientEmailContent =
      response === "accept"
        ? `
        <h1>Your Rescheduled Appointment is Confirmed</h1>
        <p>Your appointment has been successfully rescheduled.</p>
        <p>New Date: ${appointmentData.suggestedNewDate}</p>
        <p>New Time: ${appointmentData.suggestedNewTimeSlot}</p>
        <p>Doctor: ${appointmentData.doctorName}</p>
        <p>Please arrive 10 minutes before your scheduled time.</p>
      `
        : `
        <h1>Appointment Cancellation Confirmed</h1>
        <p>Your appointment has been cancelled.</p>
        <p>Please book a new appointment at your convenience.</p>
      `;

    if (appointmentData.userEmail) {
      await sendEmailNotification(
        appointmentData.userEmail,
        patientEmailSubject,
        patientEmailContent
      );
    }

    return {
      success: true,
      message:
        response === "accept"
          ? "Appointment rescheduled successfully"
          : "Appointment cancelled successfully",
    };
  } catch (error) {
    console.error("Error in UpdateRescheduleResponse:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

const sendEmailNotification = async (to, subject, htmlContent) => {
  const url = "https://api.brevo.com/v3/smtp/email";
  const options = {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": process.env.REACT_APP_BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: "Swasthya Seva", email: "your-sender-email@domain.com" },
      to: [{ email: to }],
      subject: subject,
      htmlContent: htmlContent,
    }),
  };

  try {
    const response = await fetch(url, options);
    return response.ok;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};
