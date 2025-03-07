import axios from "axios";

const sendAppointmentEmail = async (recipientEmail, type, appointmentData) => {
  console.log("sendAppointmentEmail called with:", {
    recipientEmail,
    type,
    appointmentData,
  });

  if (!recipientEmail || !recipientEmail.includes("@")) {
    console.error("Invalid email address:", recipientEmail);
    return false;
  }

  const apiKey = process.env.REACT_APP_RESCHEDULE_API_KEY;

  const getEmailContent = () => {
    switch (type) {
      case "NEW_APPOINTMENT":
        return {
          subject: "New Appointment Request",
          content: `
            <html>
              <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="padding: 20px; text-align: center;">
                      <h2 style="color: #2992d6; margin: 0;">Swasthya Seva</h2>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px;">
                      <h3 style="color: #333;">New Appointment Request</h3>
                      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <p style="font-size: 16px; color: #555; margin: 5px 0;">
                          <strong>Patient:</strong> ${
                            appointmentData.patientName
                          }
                        </p>
                        <p style="font-size: 16px; color: #555; margin: 5px 0;">
                          <strong>Date:</strong> ${appointmentData.date}
                        </p>
                        <p style="font-size: 16px; color: #555; margin: 5px 0;">
                          <strong>Time:</strong> ${appointmentData.timeSlot}
                        </p>
                        <p style="font-size: 16px; color: #555; margin: 5px 0;">
                          <strong>Problem:</strong> ${appointmentData.problem}
                        </p>
                      </div>
                      <p style="font-size: 14px; color: #888; margin-top: 30px;">
                        Please login to approve or reschedule this appointment.
                      </p>
                      <p style="font-size: 14px; color: #888; margin-top: 30px;">
                        Best regards,<br>
                        The Swasthya Seva Team
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 20px; background-color: #f4f4f4; text-align: center; color: #888; font-size: 12px; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                      <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Swasthya Seva. All rights reserved.</p>
                    </td>
                  </tr>
                </table>
              </body>
            </html>`,
        };

      case "APPOINTMENT_APPROVED":
        return {
          subject: "Appointment Confirmed",
          content: `
            <html>
              <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="padding: 20px; text-align: center;">
                      <h2 style="color: #2992d6; margin: 0;">Swasthya Seva</h2>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px;">
                      <h3 style="color: #333;">Your Appointment is Confirmed</h3>
                      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <p style="font-size: 16px; color: #555; margin: 5px 0;">
                          <strong>Doctor:</strong> ${appointmentData.doctorName}
                        </p>
                        <p style="font-size: 16px; color: #555; margin: 5px 0;">
                          <strong>Date:</strong> ${appointmentData.date}
                        </p>
                        <p style="font-size: 16px; color: #555; margin: 5px 0;">
                          <strong>Time:</strong> ${appointmentData.timeSlot}
                        </p>
                      </div>
                      <p style="font-size: 16px; color: #555;">
                        Please arrive 10 minutes before your scheduled time.
                      </p>
                      <p style="font-size: 14px; color: #888; margin-top: 30px;">
                        Best regards,<br>
                        The Swasthya Seva Team
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 20px; background-color: #f4f4f4; text-align: center; color: #888; font-size: 12px; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                      <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Swasthya Seva. All rights reserved.</p>
                    </td>
                  </tr>
                </table>
              </body>
            </html>`,
        };

      case "RESCHEDULE_REQUEST":
        return {
          subject: "Appointment Reschedule Request",
          content: `
            <html>
              <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="padding: 20px; text-align: center;">
                      <h2 style="color: #2992d6; margin: 0;">Swasthya Seva</h2>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px;">
                      <h3 style="color: #333;">Appointment Reschedule Request</h3>
                      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <p style="font-size: 16px; color: #555; margin: 5px 0;">
                          <strong>Doctor:</strong> ${appointmentData.doctorName}
                        </p>
                        <p style="font-size: 16px; color: #555; margin: 5px 0;">
                          <strong>Original Date:</strong> ${
                            appointmentData.originalDate
                          }
                        </p>
                        <p style="font-size: 16px; color: #555; margin: 5px 0;">
                          <strong>Original Time:</strong> ${
                            appointmentData.originalTime
                          }
                        </p>
                        <p style="font-size: 16px; color: #555; margin: 5px 0;">
                          <strong>Suggested New Date:</strong> ${
                            appointmentData.newDate
                          }
                        </p>
                        <p style="font-size: 16px; color: #555; margin: 5px 0;">
                          <strong>Suggested New Time:</strong> ${
                            appointmentData.newTime
                          }
                        </p>
                        <p style="font-size: 16px; color: #555; margin: 5px 0;">
                          <strong>Reason:</strong> ${appointmentData.reason}
                        </p>
                      </div>
                      <div style="margin-top: 20px; text-align: center;">
                        <a href="${process.env.REACT_APP_BASE_URL}reschedule/${
            appointmentData.appointmentId
          }/accept" 
                           style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px; display: inline-block; margin-bottom: 10px;">
                          Accept New Schedule
                        </a>
                        <a href="${process.env.REACT_APP_BASE_URL}reschedule/${
            appointmentData.appointmentId
          }/reject" 
                           style="background-color: #f44336; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                          Reject & Cancel
                        </a>
                      </div>
                      <p style="font-size: 14px; color: #888; margin-top: 30px;">
                        Best regards,<br>
                        The Swasthya Seva Team
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 20px; background-color: #f4f4f4; text-align: center; color: #888; font-size: 12px; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                      <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Swasthya Seva. All rights reserved.</p>
                    </td>
                  </tr>
                </table>
              </body>
            </html>`,
        };
        
      case "APPOINTMENT_CANCELLED_BY_LEAVE":
          return {
            subject: "Action Required: Appointment Affected by Doctor's Leave",
            content: `
              <html>
                <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                  <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
                    <tr>
                      <td style="padding: 20px; text-align: center;">
                        <h2 style="color: #2992d6; margin: 0;">Swasthya Seva</h2>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 20px;">
                        <h3 style="color: #333;">Your Appointment Needs Attention</h3>
                        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                          <p style="font-size: 16px; color: #555; margin: 5px 0;">
                            <strong>Patient:</strong> ${appointmentData.patientName}
                          </p>
                          <p style="font-size: 16px; color: #555; margin: 5px 0;">
                            <strong>Doctor:</strong> ${appointmentData.doctorName}
                          </p>
                          <p style="font-size: 16px; color: #555; margin: 5px 0;">
                            <strong>Original Date:</strong> ${appointmentData.date}
                          </p>
                          <p style="font-size: 16px; color: #555; margin: 5px 0;">
                            <strong>Original Time:</strong> ${appointmentData.timeSlot}
                          </p>
                          <p style="font-size: 16px; color: #555; margin: 5px 0;">
                            <strong>Reason:</strong> ${appointmentData.leaveReason}
                          </p>
                        </div>
                        <p style="font-size: 16px; color: #555;">
                          Your appointment with Dr. ${appointmentData.doctorName} needs to be changed because the doctor will be unavailable on the scheduled date. 
                          Please choose one of the following options:
                        </p>
                        <div style="margin-top: 20px; text-align: center;">
                          <a href="${process.env.REACT_APP_BASE_URL}reschedule-leave/${appointmentData.appointmentId}/reschedule" 
                            style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px; display: inline-block; margin-bottom: 10px;">
                            Reschedule Appointment
                          </a>
                          <a href="${process.env.REACT_APP_BASE_URL}reschedule-leave/${appointmentData.appointmentId}/cancel" 
                            style="background-color: #f44336; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Cancel Appointment
                          </a>
                        </div>
                        <p style="font-size: 14px; color: #888; margin-top: 30px;">
                          Best regards,<br>
                          The Swasthya Seva Team
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 20px; background-color: #f4f4f4; text-align: center; color: #888; font-size: 12px; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                        <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Swasthya Seva. All rights reserved.</p>
                      </td>
                    </tr>
                  </table>
                </body>
              </html>`,
          };
      case "DOCTOR_ACCEPT":
        return {
          subject: "Patient Accepted Rescheduled Appointment",
          content: `
            <html>
              <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="padding: 20px; text-align: center;">
                      <h2 style="color: #2992d6; margin: 0;">Swasthya Seva</h2>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px;">
                      <h3 style="color: #333;">Rescheduled Appointment Accepted</h3>
                      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <p style="font-size: 16px; color: #555; margin: 5px 0;">
                          <strong>Patient:</strong> ${appointmentData.userName}
                        </p>
                        <p style="font-size: 16px; color: #555; margin: 5px 0;">
                          <strong>New Date:</strong> ${appointmentData.newDate}
                        </p>
                        <p style="font-size: 16px; color: #555; margin: 5px 0;">
                          <strong>New Time:</strong> ${appointmentData.newTime}
                        </p>
                      </div>
                      <p style="font-size: 14px; color: #888; margin-top: 30px;">
                        Best regards,<br>
                        The Swasthya Seva Team
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 20px; background-color: #f4f4f4; text-align: center; color: #888; font-size: 12px; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                      <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Swasthya Seva. All rights reserved.</p>
                    </td>
                  </tr>
                </table>
              </body>
            </html>`,
        };
      case "DOCTOR_REJECT":
        return {
          subject: "Patient Rejected Rescheduled Appointment",
          content: `
                        <html>
                            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                                <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
                                    <tr>
                                        <td style="padding: 20px; text-align: center;">
                                            <h2 style="color: #2992d6; margin: 0;">Swasthya Seva</h2>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 20px;">
                                            <h3 style="color: #333;">Rescheduled Appointment Rejected</h3>
                                            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                                                <p style="font-size: 16px; color: #555; margin: 5px 0;">
                                                    <strong>Patient:</strong> ${
                                                      appointmentData.userName
                                                    }
                                                </p>
                                                <p style="font-size: 16px; color: #555; margin: 5px 0;">
                                                    <strong>Original Date:</strong> ${
                                                      appointmentData.originalDate
                                                    }
                                                </p>
                                                <p style="font-size: 16px; color: #555; margin: 5px 0;">
                                                    <strong>Original Time:</strong> ${
                                                      appointmentData.originalTime
                                                    }
                                                </p>
                                            </div>
                                            <p style="font-size: 16px; color: #555;">
                                                Please contact the patient to arrange a new appointment if needed.
                                            </p>
                                            <p style="font-size: 14px; color: #888; margin-top: 30px;">
                                                Best regards,<br>
                                                The Swasthya Seva Team
                                            </p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 20px; background-color: #f4f4f4; text-align: center; color: #888; font-size: 12px; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                                            <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Swasthya Seva. All rights reserved.</p>
                                        </td>
                                    </tr>
                                </table>
                            </body>
                        </html>`,
        };
      case "PATIENT_ACCEPT":
        return {
          subject: "Appointment Rescheduling Confirmed",
          content: `
                        <html>
                            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                                <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
                                    <tr>
                                        <td style="padding: 20px; text-align: center;">
                                            <h2 style="color: #2992d6; margin: 0;">Swasthya Seva</h2>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 20px;">
                                            <h3 style="color: #333;">Your Rescheduled Appointment is Confirmed</h3>
                                            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                                                <p style="font-size: 16px; color: #555; margin: 5px 0;">
                                                    <strong>Doctor:</strong> ${
                                                      appointmentData.doctorName
                                                    }
                                                </p>
                                                <p style="font-size: 16px; color: #555; margin: 5px 0;">
                                                    <strong>New Date:</strong> ${
                                                      appointmentData.newDate
                                                    }
                                                </p>
                                                <p style="font-size: 16px; color: #555; margin: 5px 0;">
                                                    <strong>New Time:</strong> ${
                                                      appointmentData.newTime
                                                    }
                                                </p>
                                            </div>
                                            <p style="font-size: 16px; color: #555;">
                                                Please arrive 10 minutes before your scheduled time.
                                            </p>
                                            <p style="font-size: 14px; color: #888; margin-top: 30px;">
                                                Best regards,<br>
                                                The Swasthya Seva Team
                                            </p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 20px; background-color: #f4f4f4; text-align: center; color: #888; font-size: 12px; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                                            <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Swasthya Seva. All rights reserved.</p>
                                        </td>
                                    </tr>
                                </table>
                            </body>
                        </html>`,
        };
      case "PATIENT_REJECT":
        return {
          subject: "Appointment Cancellation Confirmed",
          content: `
                        <html>
                            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                                <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
                                    <tr>
                                        <td style="padding: 20px; text-align: center;">
                                            <h2 style="color: #2992d6; margin: 0;">Swasthya Seva</h2>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 20px;">
                                            <h3 style="color: #333;">Appointment Cancellation Confirmed</h3>
                                            <p style="font-size: 16px; color: #555;">
                                                Your appointment has been cancelled. Please book a new appointment at your convenience.
                                            </p>
                                            <p style="font-size: 14px; color: #888; margin-top: 30px;">
                                                Best regards,<br>
                                                The Swasthya Seva Team
                                            </p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 20px; background-color: #f4f4f4; text-align: center; color: #888; font-size: 12px; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                                            <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Swasthya Seva. All rights reserved.</p>
                                        </td>
                                    </tr>
                                </table>
                            </body>
                        </html>`,
        };

      default:
        throw new Error("Invalid email type");
    }
  };

  const { subject, content } = getEmailContent();

  const emailData = {
    sender: {
      name: "Swasthya Seva",
      email: "swasthyasevawovv@gmail.com",
    },
    to: [
      {
        email: recipientEmail,
      },
    ],
    subject: subject,
    htmlContent: content,
  };

  console.log("Email Data:", emailData);

  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      emailData,
      {
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
        },
      }
    );
    console.log("Email sent successfully!", response.data);
    return true;
  } catch (error) {
    console.error("Error sending email:", error.response?.data || error);
    return false;
  }
};

export default sendAppointmentEmail;
