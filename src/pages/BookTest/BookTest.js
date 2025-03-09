import { Button, message, Select, Card, Divider, Modal, Table, DatePicker, InputNumber, Result } from "antd";
import React, { useState, useEffect, useCallback } from "react";
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
  SyncOutlined,
  ExperimentOutlined,
  CheckOutlined
} from '@ant-design/icons';
import { collection, getDocs, query, where, onSnapshot } from "firebase/firestore";
import firestoredb from "../../firebaseConfig";
import "./BookTest.css"; // Import the CSS file

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
  const [lastRefresh, setLastRefresh] = useState(null);
  const nav = useNavigate();
  const dispatch = useDispatch();

  // Test catalog with details and image paths - now with images
  const testCatalog = [
    {
      id: "cbc",
      name: "Complete Blood Count (CBC)",
      price: 349,
      discountedPrice: 249,
      discount: "29% OFF",
      fastingRequired: true,
      reportTime: 24,
      description: "Basic blood test that checks overall health and detects disorders",
      image: require("../images/blood_count.png") // Path to CBC test image
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
      image: require("../images/liver_function.png") // Path to LFT image
    },
    {
      id: "thyroid",
      name: "Thyroid Profile",
      price: 799,
      discountedPrice: 599,
      discount: "25% OFF",
      fastingRequired: true,
      reportTime: 36,
      description: "Measures thyroid hormone levels to evaluate thyroid function",
      image: require("../images/thyroid.png") // Path to Thyroid test image
    },
    {
      id: "lipid",
      name: "Lipid Profile",
      price: 449,
      discountedPrice: 349,
      discount: "22% OFF",
      fastingRequired: true,
      reportTime: 24,
      description: "Measures blood cholesterol levels and other fatty substances",
      image: require("../images/lipid_profile.png") // Path to Lipid test image
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
      image: require("../images/diabetes_screening.png") // Path to Diabetes test image
    }
  ];

  // Define fetchUserTests as a useCallback function to prevent recreation on each render
  const fetchUserTests = useCallback(async (userId) => {
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
          ...doc.data()
        });
      });
      
      // Sort in memory instead of using orderBy in the query
      tests.sort((a, b) => b.dateTimestamp.toMillis() - a.dateTimestamp.toMillis());
      
      // Limit to 10 most recent after sorting
      const recentTests = tests.slice(0, 10);
      
      dispatch(ShowLoader(false));
      setLoading(false);
      setUserTests(recentTests);
      setLastRefresh(new Date());
    } catch (error) {
      dispatch(ShowLoader(false));
      setLoading(false);
      message.error("Failed to fetch your tests. Please try again.");
    }
  }, [dispatch]);

  // Set up real-time listener for updates to lab tests collection
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?.id) return;
    if(user.role === "guest"){
      message.error("Please register before accessing");
      nav('/');
      return;
    }

    // Create a query against the collection
    const q = query(
      collection(firestoredb, "labTests"), 
      where("userId", "==", user.id)
    );

    // Set up the snapshot listener
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const tests = [];
      querySnapshot.forEach((doc) => {
        tests.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Sort by date timestamp
      tests.sort((a, b) => b.dateTimestamp.toMillis() - a.dateTimestamp.toMillis());
      
      // Limit to 10 most recent
      const recentTests = tests.slice(0, 10);
      
      setUserTests(recentTests);
      setLastRefresh(new Date());
    }, (error) => {
      console.error("Error in snapshot listener:", error);
      message.error("Failed to update test status. Please refresh the page.");
    });

    // Clean up the listener when component unmounts
    return () => unsubscribe();
  }, [nav]);

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
        // Use the imported CheckProfileCompletion function
        const result = await CheckProfileCompletion(user.id);
        dispatch(ShowLoader(false));
        
        if (result.success) {
          if (!result.profileComplete) {
            message.warning("Please complete your profile before booking a test.");
            nav("/profile");
          } else {
            // Initial fetch of tests
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
  }, [nav, dispatch, fetchUserTests]);

  const getAvailableSlots = async (selectedDate) => {
    try {
      dispatch(ShowLoader(true));
      const response = await CheckAvailability(selectedDate);
      dispatch(ShowLoader(false));
      
      if (response.success) {
        setAvailableSlots(response.data || []);
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
      const testDetails = testCatalog.find(test => test.id === selectedTest);
      
      const payload = {
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
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
        dateTimestamp: new Date(), // Important: add this to ensure proper sorting
        totalPrice: testDetails.discountedPrice * numPatients, // Add calculated total price
        testImage: testDetails.image // Save the image path for future reference
      };

      const response = await BookLabTest(payload);
      dispatch(ShowLoader(false));
      
      if (response.success) {
        setIsModalVisible(false);
        message.success({
          content: "Test booked successfully!",
          duration: 5,
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
        });
        setBookingComplete(true);
        
        // Refresh user tests - not strictly needed with real-time listener, but good as a fallback
        fetchUserTests(user.id);
      } else {
        message.error({
          content: response.message,
          duration: 5,
          icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
        });
      }
    } catch (error) {
      dispatch(ShowLoader(false));
      message.error({
        content: "Failed to book test. Please try again.",
        duration: 5,
        icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
      });
    }
  };

  // Manually refresh tests
  const handleManualRefresh = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.id) {
      fetchUserTests(user.id);
      message.info("Refreshing your tests...");
    }
  };

  // Generate time slots for selection - FIXED VERSION
  const generateTimeSlots = () => {
    const slots = ["07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", 
                   "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", 
                   "05:00 PM", "06:00 PM"];
    
    // Fix: Handle the case when availableSlots is undefined
    const bookedSlots = availableSlots || [];
    
    return slots.map(slot => {
      // Fix: Check if the slot exists in bookedSlots
      const isBooked = bookedSlots.some(
        bookedSlot => bookedSlot.slot === slot && bookedSlot.status !== "cancelled"
      );
      
      // Check if the slot is in the past for the current date
      const isCurrentDate = moment(date, "YYYY-MM-DD").isSame(moment(), "day");
      const slotTime = moment(slot, "hh:mm A");
      const currentTime = moment();
      const isPastSlot = isCurrentDate && slotTime.isBefore(currentTime);

      const disabled = isBooked || isPastSlot;
      
      return (
        <Option 
          key={slot} 
          value={slot} 
          disabled={disabled}
        >
          {slot} {disabled ? "(Unavailable)" : ""}
        </Option>
      );
    });
  };

  // Table columns for user tests
  const testColumns = [
    {
      title: 'Test Name',
      dataIndex: 'testName',
      key: 'testName',
      render: (testName, record) => (
        <div className="test-name-with-icon">
          {record.testImage ? (
            <img 
              src={record.testImage} 
              alt={testName} 
              className="test-table-icon"
              onError={(e) => {
                e.target.onerror = null; 
                e.target.src = "/images/lab-tests/default-test.jpg";
              }}
            />
          ) : (
            <ExperimentOutlined className="test-table-icon-fallback" />
          )}
          <span>{testName}</span>
        </div>
      )
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => moment(date, "YYYY-MM-DD").format('DD MMM YYYY')
    },
    {
      title: 'Time',
      dataIndex: 'timeSlot',
      key: 'timeSlot',
    },
    {
      title: 'Patients',
      dataIndex: 'numPatients',
      key: 'numPatients',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span className={`status-${status}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      )
    },
    {
      title: 'Total Price',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (price, record) => {
        // Use totalPrice if it exists, otherwise calculate it
        const totalPrice = price || (record.price * record.numPatients);
        return `₹${totalPrice}`;
      }
    }
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

  // Function to get the selected test details
  const getSelectedTestDetails = () => {
    return testCatalog.find(test => test.id === selectedTest) || {};
  };

  return (
    <div className="lab-container">
      <h1 className="lab-title">
        <ExperimentOutlined className="lab-title-icon" />
        <span className="Title">Book Your Lab Test</span>
      </h1>
      
      {bookingComplete ? (
        <Result
          status="success"
          title="Test Booked Successfully!"
          subTitle="Your lab test has been booked. You will receive a confirmation shortly."
          extra={[
            <Button type="primary" key="console" onClick={handleBookAnother} className="book-button">
              View My Tests
            </Button>,
            <Button key="buy" onClick={handleBookAnother}>Book Another Test</Button>,
          ]}
          className="success-result"
        />
      ) : (
        <div className="lab-grid">
          {/* User's tests table */}
          {userTests.length > 0 && (
            <Card 
              title={
                <div className="card-title-with-icon">
                  <ClockCircleOutlined className="card-title-icon" />
                  <span>Your Recent Tests</span>
                </div>
              }
              className="recent-tests-card"
              extra={
                <div className="refresh-container">
                  <Button 
                    icon={<SyncOutlined />} 
                    onClick={handleManualRefresh} 
                    size="small"
                    className="refresh-button"
                  >
                    Refresh
                  </Button>
                  {lastRefresh && (
                    <span className="refresh-time">
                      Last updated: {moment(lastRefresh).format('hh:mm:ss A')}
                    </span>
                  )}
                </div>
              }
            >
              <Table 
                dataSource={userTests} 
                columns={testColumns} 
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 5 }}
                className="lab-table"
              />
            </Card>
          )}
          
          {/* Test catalog header */}
          <div className="catalog-header">
            <h2>
              <MedicineBoxOutlined className="catalog-header-icon" />
              Available Tests
            </h2>
            <p>Select a test from our comprehensive catalog to book your appointment</p>
          </div>
          
          {/* Test catalog */}
          <div className="lab-catalog">
            {testCatalog.map((test) => (
              <Card 
                key={test.id}
                className="test-card"
                hoverable
                cover={
                  <div className="test-image-container">
                    <img 
                      alt={test.name}
                      src={test.image}
                      className="test-image"
                      onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = "/images/lab-tests/default-test.jpg";
                      }}
                    />
                    {test.fastingRequired && (
                      <div className="fasting-badge">
                        <CheckOutlined /> Fasting Required
                      </div>
                    )}
                  </div>
                }
              >
                <div className="test-card-content">
                  <h2 className="test-name">{test.name}</h2>
                  <p className="test-description">{test.description}</p>
                  
                  <Divider className="test-divider" />
                  
                  <div className="price-container">
                    <div className="price-display">
                      <DollarOutlined style={{ marginRight: 4 }} />
                      <span className="price-current">₹{test.discountedPrice}</span>
                      <span className="price-original">₹{test.price}</span>
                    </div>
                    <span className="price-discount">{test.discount}</span>
                  </div>
                  
                  <div className="test-info">
                    <div className="fasting-info">
                      {test.fastingRequired ? (
                        <>
                          <CheckOutlined style={{ color: '#16a34a', marginRight: 4 }} />
                          <span className="fasting-required">Yes, fasting required</span>
                        </>
                      ) : (
                        <>
                          <CheckCircleOutlined style={{ color: '#2ecc71', marginRight: 4 }} />
                          <span className="fasting-not-required">No fasting required</span>
                        </>
                      )}
                    </div>
                    <div className="report-time">
                      <ClockCircleOutlined style={{ marginRight: 4 }} />
                      <span>Reports in {test.reportTime} Hrs</span>
                    </div>
                  </div>

                  <Button 
                    type="primary"
                    className="book-button"
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
        bodyStyle={{ maxHeight: 'calc(80vh - 110px)', overflow: 'auto' }}
        title={
          <div className="modal-title">
            <ExperimentOutlined className="modal-title-icon" />
            <span>Book {getSelectedTestDetails().name}</span>
          </div>
        }
        open={isModalVisible}
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
            className="book-button"
          >
            Book Now
          </Button>,
        ]}
        width={700}
        centered
        className="booking-modal" // This class name is important for our styling
      >
        {selectedTest && (
          <div className="modal-test-preview">
            <img 
              src={getSelectedTestDetails().image} 
              alt={getSelectedTestDetails().name} 
              className="modal-test-image"
              onError={(e) => {
                e.target.onerror = null; 
                e.target.src = "/images/lab-tests/default-test.jpg";
              }}
            />
            <div className="modal-test-details">
              <h3 className="modal-test-name">{getSelectedTestDetails().name}</h3>
              <p className="modal-test-description">{getSelectedTestDetails().description}</p>
            </div>
          </div>
        )}

        <div className="info-alert">
          <FileTextOutlined />
          <span className="info-text">
            {selectedTest && getSelectedTestDetails().fastingRequired ? (
              <strong className="fasting-alert-required">
                <CheckOutlined style={{ marginRight: 4 }} /> Yes, fasting required
              </strong>
            ) : (
              <strong className="fasting-alert-not-required">No fasting required</strong>
            )}
            {selectedTest && " for this test. Reports will be available in " + getSelectedTestDetails().reportTime + " hours."}
          </span>
        </div>

        <div className="booking-form">
          {/* Left column - Date and patients */}
          <div>
            <div className="form-group">
              <label className="form-label">
                <CalendarOutlined />
                Select Date
              </label>
              <DatePicker 
                className="custom-date-picker" 
                onChange={handleDateChange}
                disabledDate={(current) => {
                  // Can't select days before today
                  return current && current < moment().startOf('day');
                }}
                placeholder="Select date"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">
                <UserOutlined />
                Number of Patients
              </label>
              <InputNumber
                min={1}
                max={5}
                defaultValue={1}
                onChange={value => setNumPatients(value)}
                className="custom-input-number"
              />
            </div>
          </div>
          
          {/* Right column - Time slot and notes */}
          <div>
            <div className="form-group">
              <label className="form-label">
                <ClockCircleOutlined />
                Select Time Slot
              </label>
              <Select
                className="custom-select"
                placeholder="Select time slot"
                value={timeSlot}
                onChange={(value) => setTimeSlot(value)}
                disabled={!date}
              >
                {generateTimeSlots()}
              </Select>
            </div>
            
            <div className="form-group">
              <label className="form-label">
                <FileTextOutlined />
                Additional Notes (Optional)
              </label>
              <TextArea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any specific requirements or medical conditions"
                className="custom-textarea"
              />
            </div>
          </div>
        </div>
        
        {/* Price summary */}
        {selectedTest && (
          <div className="price-summary">
            <h3 className="price-summary-title">Price Summary</h3>
            <div className="price-item">
              <span>{getSelectedTestDetails().name}</span>
              <span>₹{getSelectedTestDetails().discountedPrice} x {numPatients}</span>
            </div>
            <Divider className="price-divider" />
            <div className="price-total">
              <span>Total Amount</span>
              <span>₹{getSelectedTestDetails().discountedPrice * numPatients}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default BookTest;