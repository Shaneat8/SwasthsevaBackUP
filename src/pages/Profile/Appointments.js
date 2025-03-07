import { message, Table, Tabs, Modal, Form, DatePicker, Select, Input, Button, Tag, Tooltip } from "antd";
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

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [currentDayAppointments, setCurrentDayAppointments] = useState([]);
  const [isRescheduleModalVisible, setIsRescheduleModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [form] = Form.useForm();
  
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

  const getData = useCallback(async () => {
    try {
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
        filterCurrentDayAppointments(sortedData);
      }
    } catch (error) {
      message.error(error.message);
    } finally {
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
        message.success(response.message);
        getData();
        setIsRescheduleModalVisible(false);
        form.resetFields();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error(error.message);
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
          message.error('This time slot is already booked. Please select another time.');
          return;
        }
        
        await onUpdate(selectedAppointment.id, "cancelled", {
          reason,
          newDate: moment(newDate).format('YYYY-MM-DD'),
          newTimeSlot
        });
      }
    } catch (error) {
      message.error(error.message);
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
    if (status === "pending") return "orange";
    if (status === "cancelled") {
      if (rescheduleStatus === "pending") return "blue";
      return "red";
    }
    return "default";
  };

  const getColumns = () => {
    const columns = [
      {
        title: "Date",
        dataIndex: "date",
        render: (text) => moment(text).format("DD-MM-YYYY"),
      },
      {
        title: "Time",
        dataIndex: "timeSlot",
      },
      {
        title: user.role === "doctor" ? "Patient" : "Doctor",
        dataIndex: user.role === "doctor" ? "userName" : "doctorName",
      },
      {
        title: "Problem",
        dataIndex: "problem",
        render: (text) => (
          <Tooltip title={text}>
            <div style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {text}
            </div>
          </Tooltip>
        ),
      },
      {
        title: "Status",
        render: (text, record) => {
          let statusText = record.status.toUpperCase();
          if (record.rescheduleStatus === 'pending') {
            statusText += ' (Reschedule Pending)';
          }
          return (
            <Tag color={getStatusColor(record.status, record.rescheduleStatus)}>
              {statusText}
            </Tag>
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
              <div className="flex gap-1">
                <Button
                  type="link"
                  onClick={() => onUpdate(record.id, "approved")}
                >
                  Approve
                </Button>
                <Button
                  type="link"
                  danger
                  onClick={() => handleCancel(record)}
                >
                  Cancel
                </Button>
              </div>
            );
          }
          
          if (record.status === "approved" || record.status === "seen") {
            return (
              <div className="flex gap-1">
                <Button
                  type="link"
                  onClick={() => handleViewAppointment(record)}
                >
                  {record.status === "seen" ? "View/Edit" : "Start Consultation"}
                </Button>
                {record.status === "approved" && !record.rescheduleStatus && (
                  <Button
                    type="link"
                    danger
                    onClick={() => handleCancel(record)}
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
     if(user.role==="guest"){
            message.error("Please register before accessing");
            navigate('/');
            return;
          }
    getData();
  }, [getData,navigate,user.role]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Appointments</h1>
      
      {user.role === "doctor" ? (
        <Tabs defaultActiveKey="1">
          <Tabs.TabPane tab="Today's Appointments" key="1">
            <Table 
              columns={getColumns()} 
              dataSource={currentDayAppointments}
              rowKey="id"
              scroll={{ x: true }}
            />
          </Tabs.TabPane>
          <Tabs.TabPane tab="All Appointments" key="2">
            <Table 
              columns={getColumns()} 
              dataSource={appointments}
              rowKey="id"
              scroll={{ x: true }}
            />
          </Tabs.TabPane>
        </Tabs>
      ) : (
        <Table 
          columns={getColumns()} 
          dataSource={appointments}
          rowKey="id"
          scroll={{ x: true }}
        />
      )}

      <Modal
        title="Cancel and Reschedule Appointment"
        open={isRescheduleModalVisible}
        onCancel={() => {
          setIsRescheduleModalVisible(false);
          setSelectedAppointment(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form 
          form={form} 
          onFinish={handleRescheduleSubmit} 
          layout="vertical"
        >
          <Form.Item
            name="reason"
            label="Cancellation Reason"
            rules={[{ required: true, message: 'Please provide a reason for cancellation' }]}
          >
            <Input.TextArea rows={4} placeholder="Please explain the reason for cancellation" />
          </Form.Item>

          <Form.Item
            name="newDate"
            label="Suggested New Date"
            rules={[{ required: true, message: 'Please select a new date' }]}
          >
            <DatePicker
              className="w-full"
              disabledDate={(current) => {
                return current && current < moment().startOf('day');
              }}
            />
          </Form.Item>

          <Form.Item
            name="newTimeSlot"
            label="Suggested New Time"
            rules={[{ required: true, message: 'Please select a new time slot' }]}
          >
            <Select placeholder="Select a time slot">
              {timeSlots.map((slot) => (
                <Select.Option key={slot} value={slot}>
                  {slot}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item className="flex justify-end mb-0">
            <Button 
              onClick={() => {
                setIsRescheduleModalVisible(false);
                setSelectedAppointment(null);
                form.resetFields();
              }} 
              className="mr-2"
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Appointments;