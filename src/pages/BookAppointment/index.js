import { Button, Input, message } from "antd";
import React, { useCallback, useEffect,useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { ShowLoader } from "../../redux/loaderSlice";
import { GetDoctorById } from "../../apicalls/doctors";
import moment from "moment";
import {
  BookDoctorAppointment,
  GetDocAppointmentsOnDate,
} from "../../apicalls/appointment";
import TextArea from "antd/es/input/TextArea";
import { CheckProfileCompletion } from "../../apicalls/users";

function BookAppointment() {
  const [problem = "", setProblem] = React.useState("");
  const [error,setError]=useState("");
  const [date = "", setDate] = React.useState("");
  const [doctor, setDoctor] = React.useState(null);
  const [selectedSlot = "", setSelectedSlot] = React.useState("");
  const nav = useNavigate();
  const { id } = useParams();
  const dispatch = useDispatch();
  const [bookedSlots = [], setBookedSlots] = React.useState([]);

  useEffect(() => {
    const checkProfileCompletion = async () => {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) {
        message.error("Please login to continue");
        nav("/login"); // Redirect to login if user is not logged in
        return;
      }

      try {
        const result = await CheckProfileCompletion(user.id);
        if (result.success) {
          if (!result.profileComplete) {
            message.warning("Please complete your profile before booking an appointment.");
            nav("/profile"); // Redirect to profile if profile is incomplete
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
    const day = moment(date).format("dddd");
    if (!doctor.days.includes(day)) {
      return (
        <h3>Doctor is not available on {moment(date).format("DD-MM-YYYY")}</h3>
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

    return slots.map((slot) => {
      const isBooked = bookedSlots?.find(
        (bookedSlot) =>
          bookedSlot.slot === slot && bookedSlot.status !== "cancelled"
      );

      // Check if the slot is in the past for the current date
      const isCurrentDate = moment(date).isSame(moment(), "day");
      const isPastSlot =
        isCurrentDate && moment(slot, "HH:mm").isBefore(moment(), "HH:mm");

      return (
        <div
          key={slot}
          className="bg-white p-1 cursor-pointer"
          onClick={() => !isPastSlot && setSelectedSlot(slot)}
          style={{
            border:
              selectedSlot === slot ? "2px solid green" : "1px solid gray",
            backgroundColor: isBooked || isPastSlot ? "#d3d4d4" : "white",
            pointerEvents: isBooked || isPastSlot ? "none" : "auto",
            cursor: isBooked || isPastSlot ? "not-allowed" : "pointer",
          }}
        >
          <span>
            {moment(slot, "HH:mm").format("hh:mm A")} -{" "}
            {moment(slot, "HH:mm")
              .add(slotDuration, "minutes")
              .format("hh:mm A")}
          </span>
        </div>
      );
    });
  };

  const onBookAppointment = async () => {
    if (!problem.trim()) {
      message.error('Problem is required');
      setError('Problem is required');
      return; // Prevent booking if the problem is empty
    }
    
    setError(''); // Clear the error if the problem is valid

    try {
      dispatch(ShowLoader(true));

      const user = JSON.parse(localStorage.getItem("user"));

      const payload = {
        doctorId: doctor.id,
        userId: user.id,
        userEmail: user.email,
        date,
        slot: selectedSlot,
        timeSlot: `${moment(selectedSlot, "HH:mm A").format(
          "hh:mm A"
        )} - ${moment(selectedSlot, "HH:mm A")
          .add(60, "minutes")
          .format("hh:mm A")}`,
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
    const currentTime = moment();
    const doctorEndTime = moment(doctor.endTime, "HH:mm");
    return currentTime.isAfter(doctorEndTime);
  };

  return (
    doctor && (
      <div className="bg-white p-2">
        <h1 className="uppercase text-secondary my-1">
          <b>
            {doctor?.firstName} {doctor?.lastName}
          </b>
        </h1>
        <hr />

        <div className="w-half flex flex-column gap-1 my-1">
          <div className="flex justify-between w-full">
            <h4>Speciality :</h4>
            <h4>{doctor.Specialist}</h4>
          </div>

          <div className="flex justify-between w-full">
            <h4>Experience :</h4>
            <h4>{doctor.experience} Years</h4>
          </div>

          <div className="flex justify-between w-full">
            <h4>Email :</h4>
            <h4>{doctor.email}</h4>
          </div>

          <div className="flex justify-between w-full">
            <h4>Phone :</h4>
            <h4>{doctor.phone}</h4>
          </div>

          <div className="flex justify-between w-full">
            <h4>Address :</h4>
            <h4>{doctor.address}</h4>
          </div>

          <div className="flex justify-between w-full">
            <h4>Fees :</h4>
            <h4>Rs. {doctor.Fee} per Session</h4>
          </div>

          <div className="flex justify-between w-full">
            <h4>Days Available :</h4>
            <h4>{doctor.days.join(",")}</h4>
          </div>  
        </div>
        <hr />

        {/* Slots here */}
        <div className="flex flex-column gap-1 my-1">
          <div className="flex gap-2 w-400 items-end">
            <div>
              <span>Select Date : </span>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={isCurrentDateDisabled() ? moment().add(1, "day").format("YYYY-MM-DD") : moment().format("YYYY-MM-DD")}
                disabled={isCurrentDateDisabled() && moment(date).isSame(moment(), "day")}
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              padding: "10px 0",
              maxWidth: "100%",
            }}
          >
            {date && getSlotsData()}
          </div>

          {selectedSlot && (
            <div>
              <TextArea
                style={{ padding: "10px" }}
                placeholder="Enter your problem here"
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                rows="5"
              />
              {error && <div style={{ color: 'red' }}>{error}</div>} 
              <div className="flex gap-2 my-3 justify-center">
                <Button
                  size="large"
                  className="b-rd"
                  onClick={() => {
                    nav("/");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="large"
                  className="b-rd"
                  color="default"
                  variant="solid"
                  onClick={onBookAppointment}
                >
                  Book Appointment
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  );
}

export default BookAppointment;