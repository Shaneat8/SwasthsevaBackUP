import { message, Table, Tabs, Modal, Form, DatePicker, Select, Input, Button } from "antd";
import React, { useCallback, useEffect, useState } from "react";
import {
  GetDoctorAppointments,
  GetUserAppointments,
  UpdateAppointmentStatus,
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
  const nav = useNavigate();

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
        setAppointments(response.data);
        filterAppointments(response.data);
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      dispatch(ShowLoader(false));
    }
  }, [user.id, user.role, dispatch]);

  const filterAppointments = (data) => {
    const today = moment().startOf('day');
    const now = moment();

    const currentDayAppointments = data.filter((appointment) => {
      const appointmentDate = moment(appointment.date).startOf('day');
      const startTime = appointment.timeSlot.split(' - ')[0];
      const appointmentTime = moment(startTime, "hh:mm A");
      const isToday = appointmentDate.isSame(today, 'day');
      const isFutureTime = appointmentTime.isAfter(now);
      return isToday && isFutureTime;
    });

    setCurrentDayAppointments(currentDayAppointments);
  };

  const onUpdate = async (id, status, record) => {
    try {
      dispatch(ShowLoader(true));
      let updateData = { status };
  
      if (status === "cancelled") {
        // Show modal to collect cancellation reason and new appointment details
        const modalData = await new Promise((resolve) => {
          Modal.confirm({
            title: "Cancel Appointment",
            content: (
              <Form layout="vertical">
                <Form.Item label="Reason for Cancellation" name="reason">
                  <Input.TextArea />
                </Form.Item>
                <Form.Item label="Suggest New Date" name="newDate">
                  <DatePicker />
                </Form.Item>
                <Form.Item label="Suggest New Time Slot" name="newTimeSlot">
                  <Select>
                    {timeSlots.map((slot) => (
                      <Select.Option key={slot} value={slot}>
                        {slot}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Form>
            ),
            onOk: (values) => resolve(values),
            onCancel: () => resolve(null),
          });
        });
  
        if (!modalData) return; // User cancelled the modal
        updateData = {
          ...updateData,
          ...modalData,
        };
      }
  
      const response = await UpdateAppointmentStatus(id, status, updateData);
  
      if (response.success) {
        // Send email notification
        const emailData = {
          userEmail: record.userEmail,
          subject: `Appointment ${status === "approved" ? "Confirmed" : "Cancelled"}`,
          htmlContent:
            status === "approved"
              ? `
                <h1>Your appointment has been confirmed!</h1>
                <p>Date: ${record.date}</p>
                <p>Time: ${record.timeSlot}</p>
                <p>Doctor: ${record.doctorName}</p>
              `
              : `
                <h1>Your appointment has been cancelled</h1>
                <p>Reason: ${updateData.reason}</p>
                <h2>Suggested New Appointment</h2>
                <p>Date: ${updateData.newDate}</p>
                <p>Time: ${updateData.newTimeSlot}</p>
                <p>Please click below to accept or reject the new appointment time:</p>
                <a href="${window.location.origin}/respond-reschedule/${id}/accept">Accept</a>
                <a href="${window.location.origin}/respond-reschedule/${id}/reject">Reject</a>
              `,
        };
  
        await sendAppointmentEmail(emailData);
        message.success(response.message);
        getData();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      dispatch(ShowLoader(false));
    }
  };
  const handleCancel = (record) => {
    setSelectedAppointment(record);
    setIsRescheduleModalVisible(true);
  };

  const handleRescheduleSubmit = async (values) => {
    try {
      const { reason, newDate, newTimeSlot } = values;
      await onUpdate(
        selectedAppointment.id,
        'cancelled',
        reason,
        moment(newDate).format('YYYY-MM-DD'),
        newTimeSlot
      );
      setIsRescheduleModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error(error.message);
    }
  };

  const handleViewUser = (record) => {
    nav(`/patient/${record.userId}`, {
      state: {
        appointmentId: record.id,
        appointmentDetails: record,
      },
    });
  };

  const cols = [
    {
      title: "Date",
      dataIndex: "date",
    },
    {
      title: "Time",
      dataIndex: "timeSlot",
    },
    {
      title: "Doctor",
      dataIndex: "doctorName",
    },
    {
      title: "Patient",
      dataIndex: "userName",
    },
    {
      title: "Booked At",
      dataIndex: "bookedOn",
    },
    {
      title: "Problem",
      dataIndex: "problem",
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text, record) => {
        let statusText = text.toUpperCase();
        if (record.rescheduleStatus === 'pending') {
          statusText += ' (Reschedule Pending)';
        }
        return statusText;
      },
    },
  ];

  if (user.role === "doctor") {
    cols.push({
      title: "Action",
      dataIndex: "action",
      render: (text, record) => {
        if (record.status === "pending") {
          return (
            <div className="flex gap-1">
              <span
                className="underline cursor-pointer"
                onClick={() => onUpdate(record.id, "approved")}
              >
                Approve
              </span>
              <span
                className="underline cursor-pointer"
                onClick={() => handleCancel(record)}
              >
                Cancel
              </span>
            </div>
          );
        }
        if (record.status === "approved") {
          return (
            <div className="flex gap-1">
              <span
                className="underline cursor-pointer"
                onClick={() => handleViewUser(record)}
              >
                View
              </span>
              <span
                className="underline cursor-pointer"
                onClick={() => handleCancel(record)}
              >
                Cancel
              </span>
            </div>
          );
        }
      },
    });
  }

  useEffect(() => {
    getData();
  }, [getData]);

  const timeSlots = [
    "09:00 AM - 10:00 AM",
    "10:00 AM - 11:00 AM",
    "11:00 AM - 12:00 PM",
    "12:00 PM - 01:00 PM",
    "02:00 PM - 03:00 PM",
    "03:00 PM - 04:00 PM",
    "04:00 PM - 05:00 PM",
  ];

  return (
    <div>
      {user.role === "doctor" ? (
        <Tabs defaultActiveKey="1">
          <Tabs.TabPane tab="Current Day Appointments" key="1">
            <Table columns={cols} dataSource={currentDayAppointments} rowKey="id" />
          </Tabs.TabPane>
          <Tabs.TabPane tab="All Appointments" key="2">
            <Table columns={cols} dataSource={appointments} rowKey="id" />
          </Tabs.TabPane>
        </Tabs>
      ) : (
        <Table columns={cols} dataSource={appointments} rowKey="id" />
      )}

      <Modal
        title="Cancel and Reschedule Appointment"
        open={isRescheduleModalVisible}
        onCancel={() => {
          setIsRescheduleModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleRescheduleSubmit} layout="vertical">
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
              disabledDate={(current) => current && current < moment().startOf('day')}
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

          <Form.Item className="flex justify-end">
            <Button type="default" onClick={() => {
              setIsRescheduleModalVisible(false);
              form.resetFields();
            }} className="mr-2">
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