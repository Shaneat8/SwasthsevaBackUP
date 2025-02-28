import {
  Button,
  message,
  Select,
  Card,
  Divider,
  Modal,
  Table,
  DatePicker,
  InputNumber,
  Result,
} from "antd";
import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ShowLoader } from "../../redux/loaderSlice";
import { BookLabTest, CheckAvailability } from "../../apicalls/booktest";
import moment from "moment";
import TextArea from "antd/es/input/TextArea";
import { CheckProfileCompletion } from "../../apicalls/users";
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CalendarOutlined,
  UserOutlined,
  FileTextOutlined,
  MedicineBoxOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { collection, getDocs, query, where } from "firebase/firestore";
import firestoredb from "../../firebaseConfig";

const { Option } = Select;

function BookTest() {
  const [selectedTest, setSelectedTest] = useState(null);
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [numPatients, setNumPatients] = useState(1);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [userTests, setUserTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const nav = useNavigate();
  const dispatch = useDispatch();

  // Test catalog with details
  const testCatalog = [
    {
      id: "cbc",
      name: "Complete Blood Count (CBC)",
      price: 349,
      discountedPrice: 249,
      discount: "29% OFF",
      fastingRequired: true,
      reportTime: 24,
      description:
        "Basic blood test that checks overall health and detects disorders",
    },
    {
      id: "lft",
      name: "Liver Function Test (LFT)",
      price: 599,
      discountedPrice: 449,
      discount: "25% OFF",
      fastingRequired: true,
      reportTime: 30,
      description: "Evaluates how well your liver is working",
    },
    {
      id: "thyroid",
      name: "Thyroid Profile",
      price: 799,
      discountedPrice: 599,
      discount: "25% OFF",
      fastingRequired: true,
      reportTime: 36,
      description:
        "Measures thyroid hormone levels to evaluate thyroid function",
    },
    {
      id: "lipid",
      name: "Lipid Profile",
      price: 449,
      discountedPrice: 349,
      discount: "22% OFF",
      fastingRequired: true,
      reportTime: 24,
      description:
        "Measures blood cholesterol levels and other fatty substances",
    },
    {
      id: "diabetes",
      name: "Diabetes Screening",
      price: 599,
      discountedPrice: 449,
      discount: "25% OFF",
      fastingRequired: true,
      reportTime: 24,
      description: "Screens for diabetes and pre-diabetes conditions",
    },
  ];

  // Fetch user profile data
  const fetchUserProfile = async (userId) => {
    try {
      dispatch(ShowLoader(true));

      // Get user profile data from Firestore
      const q = query(
        collection(firestoredb, "users"),
        where("userId", "==", userId)
      );

      const querySnapshot = await getDocs(q);
      let userData = null;

      querySnapshot.forEach((doc) => {
        userData = {
          id: doc.id,
          ...doc.data(),
        };
      });

      dispatch(ShowLoader(false));
      return userData;
    } catch (error) {
      dispatch(ShowLoader(false));
      message.error("Failed to fetch user profile. Please try again.");
      return null;
    }
  };

  useEffect(() => {
    const checkProfileCompletion = async () => {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) {
        message.error("Please login to continue");
        nav("/login");
        return;
      }

      try {
        dispatch(ShowLoader(true));
        const result = await CheckProfileCompletion(user.id);

        // Fetch user profile data
        const profile = await fetchUserProfile(user.id);
        setUserData(profile);

        dispatch(ShowLoader(false));

        if (result.success) {
          if (!result.profileComplete) {
            message.warning(
              "Please complete your profile before booking a test."
            );
            nav("/profile");
          } else {
            // Define fetchUserTests inside the useEffect
            const fetchUserTests = async (userId) => {
              try {
                setLoading(true);
                dispatch(ShowLoader(true));

                // Get all tests for the user (modified function to avoid index error)
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
                  (a, b) =>
                    b.dateTimestamp.toMillis() - a.dateTimestamp.toMillis()
                );

                // Limit to 10 most recent after sorting
                const recentTests = tests.slice(0, 10);

                dispatch(ShowLoader(false));
                setLoading(false);
                setUserTests(recentTests);
              } catch (error) {
                dispatch(ShowLoader(false));
                setLoading(false);
                message.error("Failed to fetch your tests. Please try again.");
              }
            };

            // Call the inner function
            fetchUserTests(user.id);
          }
        } else {
          message.error(result.message);
        }
      } catch (error) {
        dispatch(ShowLoader(false));
        message.error("Failed to check profile completion. Please try again.");
      }
    };

    checkProfileCompletion();
  }, [nav, dispatch]);

  // Define fetchUserTests at component level for use in other functions
  const fetchUserTests = async (userId) => {
    try {
      setLoading(true);
      dispatch(ShowLoader(true));

      // Get all tests for the user (modified function to avoid index error)
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

      dispatch(ShowLoader(false));
      setLoading(false);
      setUserTests(recentTests);
    } catch (error) {
      dispatch(ShowLoader(false));
      setLoading(false);
      message.error("Failed to fetch your tests. Please try again.");
    }
  };

  const getAvailableSlots = async (selectedDate) => {
    try {
      dispatch(ShowLoader(true));
      const response = await CheckAvailability(selectedDate);
      dispatch(ShowLoader(false));

      if (response.success) {
        setAvailableSlots(response.data);
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(ShowLoader(false));
      message.error("Failed to fetch available slots. Please try again.");
    }
  };

  const handleDateChange = (date, dateString) => {
    setDate(dateString);
    setTimeSlot("");
    if (dateString) {
      getAvailableSlots(dateString);
    }
  };

  const handleTestSelection = (testId) => {
    setSelectedTest(testId);
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setDate("");
    setTimeSlot("");
    setNotes("");
    setNumPatients(1);
  };

  const handleBookTest = async () => {
    if (!selectedTest) {
      message.error("Please select a test");
      return;
    }

    if (!date) {
      message.error("Please select a date");
      return;
    }

    if (!timeSlot) {
      message.error("Please select a time slot");
      return;
    }

    try {
      dispatch(ShowLoader(true));

      const user = JSON.parse(localStorage.getItem("user"));
      const testDetails = testCatalog.find((test) => test.id === selectedTest);

      // Format full name from FirstName and LastName
      const fullName = userData
        ? `${userData.FirstName || ""} ${userData.LastName || ""}`.trim()
        : user.name;

      // Create payload with user details for admin
      const payload = {
        userId: user.id,
        userEmail: user.email,
        userName: fullName,
        // Add user details for admin
        userGender: userData?.gender || null, // 1=male, 2=female
        userDOB: userData?.DOB || null, // Pass DOB directly to allow age calculation in API
        userPhone: userData?.phone || null,
        userAddress: userData?.address || null,
        userPincode: userData?.pincode || null,
        // Test details
        testId: selectedTest,
        testName: testDetails.name,
        price: testDetails.discountedPrice,
        date,
        timeSlot,
        numPatients,
        notes,
        fastingRequired: testDetails.fastingRequired,
        reportTime: testDetails.reportTime,
        bookedOn: moment().format("DD-MM-YYYY hh:mm A"),
        status: "pending",
        paymentStatus: "pending",
      };

      const response = await BookLabTest(payload);
      dispatch(ShowLoader(false));

      if (response.success) {
        setIsModalVisible(false);
        message.success({
          content: "Test booked successfully!",
          duration: 5,
          icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
        });
        setBookingComplete(true);

        // Refresh user tests
        fetchUserTests(user.id);
      } else {
        message.error({
          content: response.message,
          duration: 5,
          icon: <CloseCircleOutlined style={{ color: "#ff4d4f" }} />,
        });
      }
    } catch (error) {
      dispatch(ShowLoader(false));
      message.error({
        content: "Failed to book test. Please try again.",
        duration: 5,
        icon: <CloseCircleOutlined style={{ color: "#ff4d4f" }} />,
      });
    }
  };

  // Generate time slots for selection
  const generateTimeSlots = () => {
    const slots = [
      "07:00 AM",
      "08:00 AM",
      "09:00 AM",
      "10:00 AM",
      "11:00 AM",
      "12:00 PM",
      "01:00 PM",
      "02:00 PM",
      "03:00 PM",
      "04:00 PM",
      "05:00 PM",
      "06:00 PM",
    ];

    return slots.map((slot) => {
      const isBooked = availableSlots.some(
        (bookedSlot) =>
          bookedSlot.slot === slot && bookedSlot.status !== "cancelled"
      );

      // Check if the slot is in the past for the current date
      const isCurrentDate = moment(date).isSame(moment(), "day");
      const slotTime = moment(slot, "hh:mm A");
      const currentTime = moment();
      const isPastSlot = isCurrentDate && slotTime.isBefore(currentTime);

      const disabled = isBooked || isPastSlot;

      return (
        <Option key={slot} value={slot} disabled={disabled}>
          {slot} {disabled ? "(Unavailable)" : ""}
        </Option>
      );
    });
  };

  // Table columns for user tests
  const testColumns = [
    {
      title: "Test Name",
      dataIndex: "testName",
      key: "testName",
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) => moment(date).format("DD MMM YYYY"),
    },
    {
      title: "Time",
      dataIndex: "timeSlot",
      key: "timeSlot",
    },
    {
      title: "Patients",
      dataIndex: "numPatients",
      key: "numPatients",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <span
          style={{
            color:
              status === "pending"
                ? "#faad14"
                : status === "completed"
                ? "#52c41a"
                : "#ff4d4f",
            fontWeight: "bold",
          }}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      ),
    },
    {
      title: "Total Price",
      dataIndex: "totalPrice",
      key: "totalPrice",
      render: (price) => `₹${price}`,
    },
  ];

  // Reset the booking state
  const handleBookAnother = () => {
    setSelectedTest(null);
    setDate("");
    setTimeSlot("");
    setNotes("");
    setNumPatients(1);
    setBookingComplete(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-6">
        <MedicineBoxOutlined style={{ marginRight: 8 }} />
        Book Your Lab Test
      </h1>

      {bookingComplete ? (
        <Result
          status="success"
          title="Test Booked Successfully!"
          subTitle="Your lab test has been booked. You will receive a confirmation shortly."
          extra={[
            <Button
              type="primary"
              key="console"
              onClick={() => nav("/profile?tab=lab-tests")}
            >
              View My Tests
            </Button>,
            <Button key="buy" onClick={handleBookAnother}>
              Book Another Test
            </Button>,
          ]}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {/* User's tests table */}
          {userTests.length > 0 && (
            <Card title="Your Recent Tests" className="mb-6">
              <Table
                dataSource={userTests}
                columns={testColumns}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 5 }}
              />
            </Card>
          )}

          {/* Test catalog */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testCatalog.map((test) => (
              <Card
                key={test.id}
                className="border rounded-lg shadow-sm hover:shadow-md transition-shadow"
                hoverable
              >
                <div>
                  <h2 className="text-xl font-semibold">{test.name}</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    {test.description}
                  </p>

                  <Divider className="my-3" />

                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <DollarOutlined style={{ marginRight: 4 }} />
                      <span className="text-xl font-bold">
                        ₹{test.discountedPrice}
                      </span>
                      <span className="text-gray-500 line-through ml-2">
                        ₹{test.price}
                      </span>
                    </div>
                    <span className="text-green-600 text-sm">
                      {test.discount}
                    </span>
                  </div>

                  <div className="mt-3 flex justify-between text-sm">
                    <div className="flex items-center">
                      {test.fastingRequired ? (
                        <>
                          <CloseCircleOutlined
                            style={{ color: "#ff4d4f", marginRight: 4 }}
                          />
                          <span className="mr-1">Fasting required</span>
                        </>
                      ) : (
                        <>
                          <CheckCircleOutlined
                            style={{ color: "#52c41a", marginRight: 4 }}
                          />
                          <span className="mr-1">No fasting required</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center">
                      <ClockCircleOutlined style={{ marginRight: 4 }} />
                      <span>Reports in {test.reportTime} Hrs</span>
                    </div>
                  </div>

                  <Button
                    type="primary"
                    className="mt-4 w-full bg-green-500 hover:bg-green-600"
                    onClick={() => handleTestSelection(test.id)}
                  >
                    Book Now
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Comprehensive booking modal */}
      <Modal
        title={`Book ${
          testCatalog.find((test) => test.id === selectedTest)?.name
        }`}
        visible={isModalVisible}
        onCancel={handleModalCancel}
        footer={[
          <Button key="back" onClick={handleModalCancel}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleBookTest}
            disabled={!timeSlot || !date}
          >
            Book Now
          </Button>,
        ]}
        width={700}
      >
        <div className="p-3 mb-4 bg-blue-50 rounded-md">
          <FileTextOutlined style={{ color: "#1890ff", marginRight: 8 }} />
          <span className="text-sm">
            {selectedTest &&
            testCatalog.find((test) => test.id === selectedTest)
              ?.fastingRequired ? (
              <strong className="text-red-500">Fasting is required</strong>
            ) : (
              <strong className="text-green-500">No fasting required</strong>
            )}
            {selectedTest &&
              " for this test. Reports will be available in " +
                testCatalog.find((test) => test.id === selectedTest)
                  ?.reportTime +
                " hours."}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left column - Date and patients */}
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                <CalendarOutlined style={{ marginRight: 8 }} />
                Select Date
              </label>
              <DatePicker
                className="w-full"
                onChange={handleDateChange}
                disabledDate={(current) => {
                  // Can't select days before today
                  return current && current < moment().startOf("day");
                }}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                <UserOutlined style={{ marginRight: 8 }} />
                Number of Patients
              </label>
              <InputNumber
                min={1}
                max={5}
                defaultValue={1}
                onChange={(value) => setNumPatients(value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Right column - Time slot and notes */}
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                <ClockCircleOutlined style={{ marginRight: 8 }} />
                Select Time Slot
              </label>
              <Select
                className="w-full"
                placeholder="Select a time slot"
                value={timeSlot}
                onChange={(value) => setTimeSlot(value)}
                disabled={!date}
              >
                {generateTimeSlots()}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                <FileTextOutlined style={{ marginRight: 8 }} />
                Additional Notes (Optional)
              </label>
              <TextArea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any specific requirements or medical conditions"
              />
            </div>
          </div>
        </div>

        {/* Price summary */}
        {selectedTest && date && timeSlot && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h3 className="font-medium">Price Summary</h3>
            <div className="flex justify-between mt-2">
              <span>
                {testCatalog.find((test) => test.id === selectedTest)?.name}
              </span>
              <span>
                ₹
                {
                  testCatalog.find((test) => test.id === selectedTest)
                    ?.discountedPrice
                }{" "}
                x {numPatients}
              </span>
            </div>
            <Divider className="my-2" />
            <div className="flex justify-between font-bold">
              <span>Total Amount</span>
              <span>
                ₹
                {testCatalog.find((test) => test.id === selectedTest)
                  ?.discountedPrice * numPatients}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default BookTest;
