import { Button, Input, message, Card, Tag, Typography, Divider, Alert } from "antd";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { ShowLoader } from "../../redux/loaderSlice";
import { GetDoctorById } from "../../apicalls/doctors";
import moment from "moment";
import { BookDoctorAppointment, GetDocAppointmentsOnDate } from "../../apicalls/appointment";
import { 
  CalendarOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  EnvironmentOutlined, 
  DollarOutlined, 
  ClockCircleOutlined, 
  MedicineBoxOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined
} from "@ant-design/icons";
import TextArea from "antd/es/input/TextArea";
import { CheckProfileCompletion } from "../../apicalls/users";
import { motion } from "framer-motion";

import './bookdoctor.css';

const { Title, Text } = Typography;

function BookAppointment() {
  const [problem, setProblem] = useState("");
  const [error, setError] = useState("");
  const [date, setDate] = useState("");
  const [doctor, setDoctor] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [bookedSlots, setBookedSlots] = useState([]);
  const [isLeaveDay, setIsLeaveDay] = useState(false);
  const [leaveReason, setLeaveReason] = useState("");
  const nav = useNavigate();
  const { id } = useParams();
  const dispatch = useDispatch();
  
  
  // Handle back button click
  const handleBack = () => {
    nav("/book-doctor");
  };

  useEffect(() => {
    const checkProfileCompletion = async () => {
      const user = JSON.parse(localStorage.getItem("user"));
      if(user.role==="guest"){
        message.error("Please register before accessing");
        nav('/');
        return;
      }
      if (!user?.id) {
        message.error("Please login to continue");
        nav("/login");
        return;
      }

      try {
        const result = await CheckProfileCompletion(user.id);
        if (result.success) {
          if (!result.profileComplete) {
            message.warning("Please complete your profile before booking an appointment.");
            nav("/profile");
          }
        } else {
          message.error(result.message);
        }
      } catch (error) {
        message.error("Failed to check profile completion. Please try again.");
      }
    };

    checkProfileCompletion();
  }, [nav]);

  const getData = useCallback(async () => {
    try {
      dispatch(ShowLoader(true));
      const response = await GetDoctorById(id);
      dispatch(ShowLoader(false));
      if (response.success) {
        setDoctor(response.data);
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error(error.message);
      dispatch(ShowLoader(false));
    }
  }, [dispatch, id]);

  const getSlotsData = () => {
    // If the doctor is on leave, display a clear message
    if (isLeaveDay) {
      return (
        <div className="leave-notification">
          <Alert
            message="Doctor Unavailable"
            description={`Dr. ${doctor.firstName} ${doctor.lastName} is on leave on ${moment(date).format("dddd, MMMM Do YYYY")}. Reason: ${leaveReason}`}
            type="warning"
            showIcon
            icon={<WarningOutlined />}
          />
        </div>
      );
    }
    
    const day = moment(date).format("dddd");
    if (!doctor.days.includes(day)) {
      return (
        <div className="unavailable-notification">
          <InfoCircleOutlined style={{ fontSize: "20px", marginRight: "10px" }} />
          <Text type="warning" style={{ fontSize: "16px" }}>
            Dr. {doctor.firstName} {doctor.lastName} is not available on {moment(date).format("dddd, MMMM Do YYYY")}
          </Text>
        </div>
      );
    }

    let startTime = moment(doctor.startTime, "HH:mm");
    let endTime = moment(doctor.endTime, "HH:mm");
    let slotDuration = 60; // in minutes
    const slots = [];

    while (startTime < endTime) {
      slots.push(startTime.format("HH:mm"));
      startTime.add(slotDuration, "minutes");
    }

    return (
      <div className="time-slots-grid">
        {slots.map((slot) => {
          const isBooked = bookedSlots?.find(
            (bookedSlot) => bookedSlot.slot === slot && bookedSlot.status !== "cancelled"
          );

          // Check if the slot is in the past for the current date
          const isCurrentDate = moment(date).isSame(moment(), "day");
          const isPastSlot = isCurrentDate && moment(slot, "HH:mm").isBefore(moment(), "HH:mm");
          const isDisabled = isBooked || isPastSlot;

          return (
            <motion.div
              key={slot}
              className={`time-slot-item ${selectedSlot === slot ? "selected" : ""} ${isDisabled ? "disabled" : ""}`}
              onClick={() => !isDisabled && setSelectedSlot(slot)}
              whileHover={!isDisabled ? { scale: 1.03 } : {}}
              whileTap={!isDisabled ? { scale: 0.98 } : {}}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="slot-time-display">
                <ClockCircleOutlined style={{ marginRight: 8 }} />
                {moment(slot, "HH:mm").format("h:mm A")} - {" "}
                {moment(slot, "HH:mm").add(slotDuration, "minutes").format("h:mm A")}
              </div>
              {isBooked && <Tag color="red">Booked</Tag>}
              {isPastSlot && !isBooked && <Tag color="orange">Past</Tag>}
              {!isDisabled && <Tag color="green">Available</Tag>}
            </motion.div>
          );
        })}
      </div>
    );
  };

  const onBookAppointment = async () => {
    if (!problem.trim()) {
      message.error("Problem is required");
      setError("Problem is required");
      return;
    }
    
    setError("");

    // Double-check if the doctor is on leave before processing
    if (isLeaveDay) {
      message.error(`Cannot book appointment. Dr. ${doctor.firstName} ${doctor.lastName} is on leave on ${date}. Reason: ${leaveReason}`);
      return;
    }

    try {
      dispatch(ShowLoader(true));

      const user = JSON.parse(localStorage.getItem("user"));

      const payload = {
        doctorId: doctor.id,
        userId: user.id,
        userEmail: user.email,
        date,
        slot: selectedSlot,
        timeSlot: `${moment(selectedSlot, "HH:mm A").format("h:mm A")} - ${moment(selectedSlot, "HH:mm A")
          .add(60, "minutes")
          .format("h:mm A")}`,
        doctorName: `${doctor.firstName} ${doctor.lastName}`,
        userName: JSON.parse(localStorage.getItem("user")).name,
        bookedOn: moment().format("DD-MM-YYYY hh:mm A"),
        problem,
        status: "pending",
      };
      const response = await BookDoctorAppointment(payload);
      dispatch(ShowLoader(false));
      if (response.success) {
        message.success(response.message);
         // Check profile completion status after booking
          const profileCheck = await CheckProfileCompletion(payload.userId);
          if (profileCheck.success) {
            if (profileCheck.profileComplete) {
              // Redirect to Appointments panel if profile is complete
              nav("/profile?tab=appointments");
            } else {
              // Redirect to Profile panel if profile is incomplete
              nav("/profile?tab=profile");
            }
          } else {
            message.error(profileCheck.message);
          }
      } else {
        // Handle leave-specific error message
        if (response.isOnLeave) {
          setIsLeaveDay(true);
          setLeaveReason(response.leaveReason);
          setSelectedSlot("");
        }
        message.error(response.message);
      }
    } catch (error) {
      message.error(error.message);
      dispatch(ShowLoader(false));
    }
  };

  const getBookedSlots = useCallback(async () => {
    try {
      dispatch(ShowLoader(true));
      const response = await GetDocAppointmentsOnDate(id, date);
      dispatch(ShowLoader(false));
      if (response.success) {
        setBookedSlots(response.data);
        
        // Check if the doctor is on leave based on the response
        if (response.isOnLeave) {
          setIsLeaveDay(true);
          setLeaveReason(response.leaveReason);
          setSelectedSlot(""); // Clear any selected slot
        } else {
          setIsLeaveDay(false);
          setLeaveReason("");
        }
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(ShowLoader(false));
      message.error(error.message);
    }
  }, [dispatch, date, id]);

  useEffect(() => {
    getData();
  }, [getData, id]);

  useEffect(() => {
    if (date) {
      getBookedSlots();
    }
  }, [getBookedSlots, date]);

  // Disable current date if the time frame has passed
  const isCurrentDateDisabled = () => {
    if (!doctor) return false;
    const currentTime = moment();
    const doctorEndTime = moment(doctor.endTime, "HH:mm");
    return currentTime.isAfter(doctorEndTime);
  };

  return (
    doctor && (
      <div className="appointment-booking-container">
        {/* Back Button */}
        <div className="navigation-header">
          <Button className="navigation-button" onClick={handleBack}>
            <ArrowLeftOutlined style={{ marginRight: 8 }} /> Go Back
          </Button>
        </div>

        <Card 
          className="appointment-card"
          title={
            <div className="physician-header">
              <div className="physician-avatar">
                {doctor.firstName.charAt(0)}{doctor.lastName.charAt(0)}
              </div>
              <div className="physician-title">
                <Title level={2}>
                  Dr. {doctor.firstName} {doctor.lastName}
                </Title>
                <Tag color="blue" icon={<MedicineBoxOutlined />}>{doctor.Specialist}</Tag>
                <Tag color="green" icon={<UserOutlined />}>{doctor.experience} Years Experience</Tag>
              </div>
            </div>
          }
        >

        <div className="physician-details-section">
          <div className="section-heading">
            <InfoCircleOutlined /> Doctor Information
          </div>
          <div className="details-grid">
            {/* First row: Email, Phone, Address */}
            <div>
              <div className="detail-item">
                <MailOutlined className="detail-icon" />
                <div>
                  <Text type="secondary">Email:</Text>
                  <Text strong>{doctor.email}</Text>
                </div>
              </div>
              <div className="detail-item">
                <PhoneOutlined className="detail-icon phone-icon" />
                <div>
                  <Text type="secondary">Phone:</Text>
                  <Text strong>{doctor.phone}</Text>
                </div>
              </div>
              <div className="detail-item">
                <EnvironmentOutlined className="detail-icon" />
                <div>
                  <Text type="secondary" style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>Address:</Text>
                  <Text strong style={{height:'auto'}}>{doctor.address}</Text>
                </div>
              </div>
            </div>
            
            {/* Second row: Fee and Days Available */}
            <div>
              <div className="detail-item availability-item">
                <DollarOutlined className="detail-icon" />
                <div>
                  <Text type="secondary">Fee:</Text>
                  <Text strong>Rs. {doctor.Fee} per Session</Text>
                </div>
              </div>
              <div className="detail-item availability-item">
                <CalendarOutlined className="detail-icon" />
                <div>
                  <Text type="secondary">Days Available:</Text>
                  <div className="availability-tags">
                    {doctor.days.map(day => (
                      <Tag key={day} color="processing">{day}</Tag>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

          <Divider orientation="left" className="section-divider">
            <Text strong style={{ fontSize: '16px' }}>Book an Appointment</Text>
          </Divider>

          <div className="appointment-form-section">
            <div className="section-heading">
              <CalendarOutlined /> Select Appointment Details
            </div>
            
            <div className="date-selector">
              <Text strong>Select Date:</Text>
              <Input
                prefix={<CalendarOutlined />}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={isCurrentDateDisabled() ? moment().add(1, "day").format("YYYY-MM-DD") : moment().format("YYYY-MM-DD")}
                disabled={isCurrentDateDisabled() && moment(date).isSame(moment(), "day")}
                className="date-picker"
              />
            </div>

            {date && (
              <motion.div 
                className="time-slots-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Text strong>Available Time Slots:</Text>
                {getSlotsData()}
              </motion.div>
            )}

            {selectedSlot && !isLeaveDay && (
              <motion.div 
                className="medical-problem-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="appointment-summary">
                  <Text strong>
                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                    Selected Appointment: {moment(date).format("dddd, MMMM Do YYYY")} at {moment(selectedSlot, "HH:mm").format("h:mm A")}
                  </Text>
                </div>
                
                <Text strong>Describe your medical concern:</Text>
                <TextArea
                  placeholder="Please provide details about your medical condition or reason for consultation"
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  rows="5"
                  className="medical-problem-input"
                />
                {error && <Text type="danger">{error}</Text>}
                
                <div className="appointment-actions">
                  <Button 
                    size="large"
                    onClick={handleBack}
                    className="cancel-action"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    onClick={onBookAppointment}
                    className="confirm-action"
                  >
                    Book Appointment
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </Card>
      </div>
    )
  );
}

export default BookAppointment;