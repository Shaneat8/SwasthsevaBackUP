import { message, Table, Tabs, Modal, Form, DatePicker, Select, Input, Button, Tooltip, Badge, Card } from "antd";
import React, { useCallback, useEffect, useState } from "react";
import {
  GetDoctorAppointments,
  GetUserAppointments,
  UpdateAppointmentStatus,
  GetDocAppointmentsOnDate,
} from "../../apicalls/appointment";
import { useDispatch } from "react-redux";
import { ShowLoader } from "../../redux/loaderSlice";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { 
  CalendarOutlined, 
  ClockCircleOutlined, 
  MedicineBoxOutlined, 
  UserOutlined,
  ScheduleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  SearchOutlined
} from "@ant-design/icons";
import DoctorLeaveModal from "../DoctorForm/DoctorLeaveModal";
import './Appointments.css'; // This imports the CSS file

function AppointmentManagement() {
  const navigate = useNavigate();
  
  return (
    <div className="apt-container">
      <div className="container">
        <div className="appointment-container">
          <h1 className="appointment-title">
            <MedicineBoxOutlined className="appointment-title-icon" />
            <span className="Title">Appointment Management</span>
          </h1>
          
          {/* Improved booking grid with better responsiveness */}
          <div className="booking-section">
            <h2 className="booking-section-title">
              <CalendarOutlined className="section-title-icon" />
              Quick Booking Options
            </h2>
            
            <div className="booking-grid-improved">
              <Card 
                title={
                  <div className="card-title-with-icon">
                    <CalendarOutlined className="card-title-icon" />
                    <span>Book Doctor Appointment</span>
                  </div>
                }
                className="booking-card-improved"
                hoverable
                onClick={() => navigate("/")}
              >
                <div className="booking-card-content-improved">
                  <p className="booking-description-improved">Schedule an appointment with one of our qualified doctors</p>
                  <Button type="primary" className="book-button-improved">Book Now</Button>
                </div>
              </Card>
              
              <Card 
                title={
                  <div className="card-title-with-icon">
                    <MedicineBoxOutlined className="card-title-icon" />
                    <span>Book Lab Test</span>
                  </div>
                }
                className="booking-card-improved"
                hoverable
                onClick={() => navigate("/profile?tab=booktest")}
              >
                <div className="booking-card-content-improved">
                  <p className="booking-description-improved">Schedule laboratory tests and diagnostics</p>
                  <Button type="primary" className="book-button-improved">Book Lab Test</Button>
                </div>
              </Card>
            </div>
          </div>
          
          <div className="appointments-header compact">
            <h2 className="section-title">
              <ScheduleOutlined className="section-title-icon" />
              Your Upcoming Appointments
            </h2>
          </div>
          
          {/* Keep the Appointments component unchanged */}
          <Appointments compact={true} />
        </div>
      </div>
    </div>
  );
}
function Appointments({ compact = false }) {
  const [appointments, setAppointments] = useState([]);
  const [currentDayAppointments, setCurrentDayAppointments] = useState([]);
  const [isRescheduleModalVisible, setIsRescheduleModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [form] = Form.useForm();
  const [leaveModalVisible, setLeaveModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const user = JSON.parse(localStorage.getItem("user"));
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const timeSlots = [
    "09:00 AM - 10:00 AM",
    "10:00 AM - 11:00 AM",
    "11:00 AM - 12:00 PM",
    "12:00 PM - 01:00 PM",
    "02:00 PM - 03:00 PM",
    "03:00 PM - 04:00 PM",
    "04:00 PM - 05:00 PM",
  ];

  const showLeaveModal = () => {
    setLeaveModalVisible(true);
  };

  const handleLeaveModalCancel = () => {
    setLeaveModalVisible(false);
  };

  const getData = useCallback(async () => {
    try {
      setLoading(true);
      dispatch(ShowLoader(true));
      let response;
      
      if (user.role === "doctor") {
        response = await GetDoctorAppointments(user.id);
      } else {
        response = await GetUserAppointments(user.id);
      }
      
      if (response.success) {
        const sortedData = response.data.sort((a, b) => {
          const dateA = moment(a.date + " " + a.timeSlot.split(" - ")[0], "YYYY-MM-DD hh:mm A");
          const dateB = moment(b.date + " " + b.timeSlot.split(" - ")[0], "YYYY-MM-DD hh:mm A");
          return dateA - dateB;
        });
        
        setAppointments(sortedData);
        setFilteredAppointments(sortedData);
        filterCurrentDayAppointments(sortedData);
        setLastRefresh(new Date());
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
      dispatch(ShowLoader(false));
    }
  }, [user.id, user.role, dispatch]);

  const filterCurrentDayAppointments = (data) => {
    const today = moment().startOf('day');
    const now = moment();

    const currentDayAppointments = data.filter((appointment) => {
      const appointmentDate = moment(appointment.date).startOf('day');
      const startTime = appointment.timeSlot.split(' - ')[0];
      const appointmentTime = moment(startTime, "hh:mm A");
      const isToday = appointmentDate.isSame(today, 'day');
      const isFutureTime = appointmentTime.isAfter(now);
      return isToday && (isFutureTime || appointment.status === 'approved');
    });

    setCurrentDayAppointments(currentDayAppointments);
  };

  const onUpdate = async (id, status, data = {}) => {
    try {
      dispatch(ShowLoader(true));
      const response = await UpdateAppointmentStatus(id, status, data);
      
      if (response.success) {
        message.success({
          content: response.message,
          duration: 5,
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
        });
        getData();
        setIsRescheduleModalVisible(false);
        form.resetFields();
      } else {
        message.error({
          content: response.message,
          duration: 5,
          icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
        });
      }
    } catch (error) {
      message.error({
        content: error.message,
        duration: 5,
        icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
      });
    } finally {
      dispatch(ShowLoader(false));
      setSelectedAppointment(null);
    }
  };

  const handleCancel = (record) => {
    setSelectedAppointment(record);
    setIsRescheduleModalVisible(true);
  };

  const handleRescheduleSubmit = async (values) => {
    const { reason, newDate, newTimeSlot } = values;
    
    try {
      dispatch(ShowLoader(true));
      const response = await GetDocAppointmentsOnDate(
        selectedAppointment.doctorId,
        moment(newDate).format('YYYY-MM-DD')
      );
      
      if (response.success) {
        const isSlotTaken = response.data.some(
          app => app.timeSlot === newTimeSlot && app.status !== 'cancelled'
        );
        
        if (isSlotTaken) {
          message.error({
            content: 'This time slot is already booked. Please select another time.',
            duration: 5,
            icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
          });
          return;
        }
        
        await onUpdate(selectedAppointment.id, "cancelled", {
          reason,
          newDate: moment(newDate).format('YYYY-MM-DD'),
          newTimeSlot
        });
      }
    } catch (error) {
      message.error({
        content: error.message,
        duration: 5,
        icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
      });
    } finally {
      dispatch(ShowLoader(false));
    }
  };

  const handleViewAppointment = (record) => {
    navigate(`/appointment/${record.id}`, {
      state: {
        appointmentDetails: record,
        mode: record.status === 'seen' ? 'view' : 'edit'
      },
    });
  };

  const getStatusColor = (status, rescheduleStatus) => {
    if (status === "seen") return "purple";
    if (status === "approved") return "green";
    if (status === "pending") return "blue";
    if (status === "cancelled") {
      if (rescheduleStatus === "pending") return "gold";
      return "red";
    }
    return "default";
  };

  const getStatusIcon = (status, rescheduleStatus) => {
    if (status === "seen") return <CheckCircleOutlined />;
    if (status === "approved") return <ClockCircleOutlined />;
    if (status === "pending") return <SyncOutlined spin />;
    if (status === "cancelled") {
      if (rescheduleStatus === "pending") return <ScheduleOutlined />;
      return <CloseCircleOutlined />;
    }
    return null;
  };

  const handleSearch = (value) => {
    setSearchText(value);
    
    const filtered = appointments.filter(item => {
      const searchVal = value.toLowerCase();
      const patientName = item.userName ? item.userName.toLowerCase() : '';
      const doctorName = item.doctorName ? item.doctorName.toLowerCase() : '';
      const problem = item.problem ? item.problem.toLowerCase() : '';
      
      return patientName.includes(searchVal) || 
             doctorName.includes(searchVal) || 
             problem.includes(searchVal);
    });
    
    setFilteredAppointments(filtered);
  };

  // Manually refresh appointments
  const handleManualRefresh = () => {
    getData();
    message.info({
      content: "Refreshing your appointments...",
      icon: <SyncOutlined spin />
    });
  };

  const getColumns = () => {
    const columns = [
      {
        title: "Date",
        dataIndex: "date",
        render: (text) => (
          <div className="date-column">
            <CalendarOutlined className="column-icon" />
            <span>{moment(text).format("DD MMM YYYY")}</span>
          </div>
        ),
      },
      {
        title: "Time",
        dataIndex: "timeSlot",
        render: (text) => (
          <div className="time-column">
            <ClockCircleOutlined className="column-icon" />
            <span>{text}</span>
          </div>
        ),
      },
      {
        title: user.role === "doctor" ? "Patient" : "Doctor",
        dataIndex: user.role === "doctor" ? "userName" : "doctorName",
        render: (text) => (
          <div className="name-column">
            <UserOutlined className="column-icon" />
            <span>{text}</span>
          </div>
        ),
      },
      {
        title: "Problem",
        dataIndex: "problem",
        render: (text) => (
          <Tooltip title={text}>
            <div className="problem-column">
              <MedicineBoxOutlined className="column-icon" />
              <div className="problem-text">{text}</div>
            </div>
          </Tooltip>
        ),
      },
      {
        title: "Status",
        render: (text, record) => {
          let statusText = record.status.charAt(0).toUpperCase() + record.status.slice(1);
          if (record.rescheduleStatus === 'pending') {
            statusText += ' (Reschedule Pending)';
          }
          return (
            <div className="status-column">
              <Badge 
                status={getStatusColor(record.status, record.rescheduleStatus)} 
                text={
                  <span className={`status-${record.status}`}>
                    {getStatusIcon(record.status, record.rescheduleStatus)}
                    <span style={{ marginLeft: '5px' }}>{statusText}</span>
                  </span>
                }
              />
            </div>
          );
        },
      },
    ];

    if (user.role === "doctor") {
      columns.push({
        title: "Action",
        render: (text, record) => {
          if (record.status === "pending") {
            return (
              <div className="action-buttons">
                <Button
                  type="primary"
                  className="approve-button"
                  icon={<CheckCircleOutlined />}
                  onClick={() => onUpdate(record.id, "approved")}
                  size={compact ? "small" : "middle"}
                >
                  Approve
                </Button>
                <Button
                  type="default"
                  danger
                  className="cancel-button"
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleCancel(record)}
                  size={compact ? "small" : "middle"}
                >
                  Cancel
                </Button>
              </div>
            );
          }
          
          if (record.status === "approved" || record.status === "seen") {
            return (
              <div className="action-buttons">
                <Button
                  type="primary"
                  className="view-button"
                  icon={<FileTextOutlined />}
                  onClick={() => handleViewAppointment(record)}
                  size={compact ? "small" : "middle"}
                >
                  {record.status === "seen" ? "View" : "Start"}
                </Button>
                {record.status === "approved" && !record.rescheduleStatus && (
                  <Button
                    type="default"
                    danger
                    className="reschedule-button"
                    icon={<ScheduleOutlined />}
                    onClick={() => handleCancel(record)}
                    size={compact ? "small" : "middle"}
                  >
                    Reschedule
                  </Button>
                )}
              </div>
            );
          }
          return null;
        },
      });
    }

    return columns;
  };

  useEffect(() => {
    if(user.role === "guest"){
      message.error("Please register before accessing");
      navigate('/');
      return;
    }
    getData();
  }, [getData, navigate, user.role]);

  return (
    <div className="apt-container">
    <div className={`appointments-container ${compact ? 'compact' : ''}`}>
      <div className="appointments-header">
        <div className="title-section">
          <MedicineBoxOutlined className="title-icon" />
          <h1 className="page-title">Appointments</h1>
        </div>
        
        <div className="header-actions">
          {user.role === "doctor" && (
            <Button 
              type="primary" 
              icon={<CalendarOutlined />} 
              className="leave-button"
              onClick={showLeaveModal}
              size={compact ? "small" : "middle"}
            >
              Request Leave
            </Button>
          )}
          
          <Button 
            icon={<SyncOutlined />} 
            onClick={handleManualRefresh} 
            className="refresh-button"
            size={compact ? "small" : "middle"}
          >
            Refresh
          </Button>
          
          {lastRefresh && (
            <span className="refresh-time">
              {moment(lastRefresh).format('hh:mm A')}
            </span>
          )}
        </div>
      </div>
      
      <div className="search-section">
        <Input
          placeholder={`Search ${user.role === "doctor" ? "patients" : "appointments"}...`}
          prefix={<SearchOutlined />}
          onChange={(e) => handleSearch(e.target.value)}
          value={searchText}
          className="search-input"
          allowClear
          size={ "large"}
        />
      </div>
      
      <div className="info-card">
        <InfoCircleOutlined className="info-icon" />
        <div className="info-text">
          <strong>Appointments Information</strong>
          {user.role === "doctor" 
            ? "Manage your patient appointments and schedule."
            : "View and manage your scheduled appointments."
          }
        </div>
      </div>
      
      {user.role === "doctor" ? (
        <div className="tabs-container">
          <Tabs 
            defaultActiveKey="1"
            type="card"
            className="custom-tabs"
            size={compact ? "small" : "middle"}
          >
            <Tabs.TabPane 
              tab={
                <span className="tab-label">
                  <ClockCircleOutlined />
                  Today
                  <Badge 
                    count={currentDayAppointments.length} 
                    className="tab-badge"
                    style={{ backgroundColor: '#0284c7' }}
                  />
                </span>
              } 
              key="1"
            >
              {currentDayAppointments.length > 0 ? (
                <Table 
                  columns={getColumns()} 
                  dataSource={currentDayAppointments}
                  rowKey="id"
                  className="appointments-table"
                  scroll={{ x: true }}
                  pagination={{ 
                    pageSize: compact ? 5 : 10,
                    showTotal: (total) => `Total: ${total}`,
                    size: compact ? "small" : "default"
                  }}
                  loading={loading}
                  size={compact ? "small" : "middle"}
                />
              ) : (
                <div className="empty-state">
                  <CalendarOutlined className="empty-icon" />
                  <h3>No Appointments Today</h3>
                  <p>You don't have any appointments scheduled for today.</p>
                </div>
              )}
            </Tabs.TabPane>
            <Tabs.TabPane 
              tab={
                <span className="tab-label">
                  <ScheduleOutlined />
                  All Appointments
                </span>
              } 
              key="2"
            >
              <Table 
                columns={getColumns()} 
                dataSource={filteredAppointments}
                rowKey="id"
                className="appointments-table"
                scroll={{ x: true }}
                pagination={{ 
                  pageSize: compact ? 5 : 10,
                  showTotal: (total) => `Total: ${total}`,
                  size: compact ? "small" : "default"
                }}
                loading={loading}
                size={compact ? "small" : "middle"}
              />
            </Tabs.TabPane>
          </Tabs>
        </div>
      ) : (
        <div className="table-container">
          <Card 
            title={
              <div className="card-title-with-icon">
                <ScheduleOutlined className="card-title-icon" />
                <span>Your Appointments</span>
              </div>
            }
            className="appointments-card"
            size={compact ? "small" : "default"}
          >
            {filteredAppointments.length > 0 ? (
              <Table 
                columns={getColumns()} 
                dataSource={filteredAppointments}
                rowKey="id"
                className="appointments-table"
                scroll={{ x: true }}
                pagination={{ 
                  pageSize: compact ? 5 : 10,
                  showTotal: (total) => `Total: ${total}`,
                  size: compact ? "small" : "default"
                }}
                loading={loading}
                size={compact ? "small" : "middle"}
              />
            ) : (
              <div className="empty-state">
                <CalendarOutlined className="empty-icon" />
                <h3>No Appointments Found</h3>
                <p>You don't have any appointments scheduled yet.</p>
              </div>
            )}
          </Card>
        </div>
      )}

      <Modal
        title={
          <div className="modal-title">
            <ScheduleOutlined className="modal-icon" />
            <span>Reschedule Appointment</span>
          </div>
        }
        open={isRescheduleModalVisible}
        onCancel={() => {
          setIsRescheduleModalVisible(false);
          setSelectedAppointment(null);
          form.resetFields();
        }}
        footer={null}
        width={compact ? 600 : 700}
        centered
        bodyStyle={{ maxHeight: 'calc(80vh - 110px)', overflow: 'auto' }}
        className="reschedule-modal"
      >
        {selectedAppointment && (
          <div className="appointment-preview">
            <div className="modal-appointment-preview">
              <div className="preview-item">
                <CalendarOutlined className="preview-icon" />
                <div className="preview-detail">
                  <span className="preview-label">Current Date</span>
                  <span className="preview-value">{moment(selectedAppointment.date).format("DD MMM YYYY")}</span>
                </div>
              </div>
              <div className="preview-item">
                <ClockCircleOutlined className="preview-icon" />
                <div className="preview-detail">
                  <span className="preview-label">Current Time</span>
                  <span className="preview-value">{selectedAppointment.timeSlot}</span>
                </div>
              </div>
              <div className="preview-item">
                <UserOutlined className="preview-icon" />
                <div className="preview-detail">
                  <span className="preview-label">
                    {user.role === "doctor" ? "Patient" : "Doctor"}
                  </span>
                  <span className="preview-value">
                    {user.role === "doctor" ? selectedAppointment.userName : selectedAppointment.doctorName}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <Form 
          form={form} 
          onFinish={handleRescheduleSubmit} 
          layout="vertical"
          className="reschedule-form"
        >
          <Form.Item
            name="reason"
            label="Reason for Rescheduling"
            rules={[{ required: true, message: 'Please provide a reason' }]}
          >
            <Input.TextArea rows={3} placeholder="Please explain why you need to reschedule" className="custom-textarea" />
          </Form.Item>

          <div className="booking-form">
            <Form.Item
              name="newDate"
              label={
                <span className="form-label">
                  <CalendarOutlined /> New Date
                </span>
              }
              rules={[{ required: true, message: 'Please select a date' }]}
            >
              <DatePicker
                className="custom-date-picker"
                disabledDate={(current) => {
                  return current && current < moment().startOf('day');
                }}
                placeholder="Select date"
                size={compact ? "small" : "middle"}
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item
              name="newTimeSlot"
              label={
                <span className="form-label">
                  <ClockCircleOutlined /> New Time
                </span>
              }
              rules={[{ required: true, message: 'Please select a time slot' }]}
            >
              <Select 
                placeholder="Select time slot" 
                className="custom-select" 
                size={compact ? "small" : "middle"}
              >
                {timeSlots.map((slot) => (
                  <Select.Option key={slot} value={slot}>{slot}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <div className="note-box">
            <InfoCircleOutlined className="note-icon" />
            <div className="note-text">
              Patient will be notified and needs to confirm the new appointment time.
            </div>
          </div>

          <div className="form-buttons">
            <Button 
              onClick={() => {
                setIsRescheduleModalVisible(false);
                setSelectedAppointment(null);
                form.resetFields();
              }} 
              className="cancel-form-button"
              size={compact ? "small" : "middle"}
            >
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              className="submit-form-button"
              size={compact ? "small" : "middle"}
            >
              Reschedule
            </Button>
          </div>
        </Form>
      </Modal>

      <DoctorLeaveModal
        visible={leaveModalVisible}
        onCancel={handleLeaveModalCancel}
        doctorId={user.id}
        doctorName={user.name || ""}
        doctorEmail={user.email || ""}
      />
    </div>
    </div>
  );
}

export { AppointmentManagement, Appointments };
export default Appointments;