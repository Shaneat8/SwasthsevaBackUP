import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  Form,
  DatePicker,
  Input,
  Button,
  message,
  Table,
  Tag,
  Space,
  Typography,
  Divider,
  Alert,
  Popconfirm
} from "antd";
import { 
  CalendarOutlined, 
  ClockCircleOutlined, 
  FileTextOutlined,
  ExclamationCircleOutlined,
  DeleteOutlined
} from "@ant-design/icons";
import moment from "moment";
import { AddDoctorLeave, GetDoctorLeaves, CancelDoctorLeave } from "../../apicalls/doctorLeave";
import { HandleAppointmentsForDoctorLeave } from "../../apicalls/appointment";

const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Text } = Typography;

const DoctorLeaveModal = ({ visible, onCancel, doctorId, doctorName, doctorEmail }) => {
  const [form] = Form.useForm();
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tabKey, setTabKey] = useState("request"); // 'request' or 'history'
  const [affectedAppointments, setAffectedAppointments] = useState([]);
  const [showAffectedWarning, setShowAffectedWarning] = useState(false);

  // Define fetchLeaveHistory with useCallback before using it in useEffect
  const fetchLeaveHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await GetDoctorLeaves(doctorId);
      if (response.success) {
        setLeaveHistory(response.data);
      } else {
        message.error(response.message || "Failed to load leave history");
      }
    } catch (error) {
      message.error("An error occurred while fetching leave history");
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    if (visible && doctorId) {
      fetchLeaveHistory();
    }
  }, [visible, doctorId, fetchLeaveHistory]);

  // New function to check for affected appointments when date range changes
  const checkAffectedAppointments = async (dateRange) => {
    if (!dateRange || dateRange.length !== 2) {
      setAffectedAppointments([]);
      setShowAffectedWarning(false);
      return;
    }

    try {
      const startDate = dateRange[0].format("YYYY-MM-DD");
      const endDate = dateRange[1].format("YYYY-MM-DD");
      
      // We're just checking to display a warning, not actually cancelling yet
      const response = await HandleAppointmentsForDoctorLeave(
        doctorId, 
        startDate, 
        endDate, 
        "Preliminary check",
        true // New parameter to indicate this is just a check
      );
      
      if (response.success && response.affectedCount > 0) {
        setAffectedAppointments(response.affectedAppointments || []);
        setShowAffectedWarning(true);
      } else {
        setAffectedAppointments([]);
        setShowAffectedWarning(false);
      }
    } catch (error) {
      console.error("Error checking affected appointments:", error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
  
      const dateRange = values.dateRange;
      const leaveData = {
        doctorId,
        doctorName,
        doctorEmail: doctorEmail || null, // Add null as fallback
        startDate: dateRange[0].format("YYYY-MM-DD"),
        endDate: dateRange[1].format("YYYY-MM-DD"),
        reason: values.reason,
        status: "approved",
      };
  
      console.log("Leave data before submission:", leaveData); // Add this for debugging
  
      const response = await AddDoctorLeave(leaveData);
      
      if (response.success) {
        // Now handle any affected appointments
        const appointmentsResponse = await HandleAppointmentsForDoctorLeave(
          doctorId,
          leaveData.startDate,
          leaveData.endDate,
          leaveData.reason
        );
        
        let successMessage = "Leave request submitted successfully";
        if (appointmentsResponse.success && appointmentsResponse.affectedCount > 0) {
          successMessage += `. ${appointmentsResponse.affectedCount} appointments have been automatically cancelled and patients notified.`;
        }
        
        message.success(successMessage);
        form.resetFields();
        fetchLeaveHistory(); // Refresh the history
        setTabKey("history"); // Switch to history tab
        setShowAffectedWarning(false);
        setAffectedAppointments([]);
      } else {
        message.error(response.message || "Failed to submit leave request");
      }
    } catch (error) {
      if (error.errorFields) {
        message.error("Please fill all required fields");
      } else {
        message.error("An error occurred while submitting the request");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelLeave = async (leaveId) => {
    try {
      setLoading(true);
      const response = await CancelDoctorLeave(leaveId, doctorId);
      
      if (response.success) {
        message.success("Leave request cancelled successfully");
        fetchLeaveHistory(); // Refresh the history
      } else {
        message.error(response.message || "Failed to cancel leave request");
      }
    } catch (error) {
      message.error("An error occurred while cancelling the request");
    } finally {
      setLoading(false);
    }
  };

  const disabledDate = (current) => {
    // Disable dates before today
    return current && current < moment().startOf('day');
  };

  const columns = [
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
      render: (date) => moment(date).format("DD MMM YYYY"),
      width: "12%",
    },
    {
      title: "End Date",
      dataIndex: "endDate",
      key: "endDate",
      render: (date) => moment(date).format("DD MMM YYYY"),
      width: "12%",
    },
    {
      title: "Duration",
      key: "duration",
      render: (_, record) => {
        const start = moment(record.startDate);
        const end = moment(record.endDate);
        const days = end.diff(start, 'days') + 1;
        return `${days} day${days > 1 ? 's' : ''}`;
      },
      width: "10%",
    },
    {
      title: "Reason",
      dataIndex: "reason",
      key: "reason",
      ellipsis: true,
      width: "20%",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color = "blue";
        if (status === "approved") color = "green";
        if (status === "rejected") color = "red";
        if (status === "cancelled") color = "gray";
        
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
      width: "12%",
    },
    {
      title: "Affected Appointments",
      dataIndex: "affectedAppointments",
      key: "affectedAppointments",
      render: (appointments) => {
        const count = appointments ? appointments.length : 0;
        return count > 0 ? (
          <Tag color="orange">{count} appointment{count !== 1 ? 's' : ''} affected</Tag>
        ) : (
          <Tag color="green">No appointments affected</Tag>
        );
      },
      width: "18%",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => {
        // Modified condition: Show cancel button for all non-cancelled leaves where the start date is in the future
        const isFutureLeave = moment(record.startDate).isAfter(moment());
        const isNotCancelled = record.status !== "cancelled";
        
        return (isNotCancelled && isFutureLeave) ? (
          <Popconfirm
            title="Cancel this leave request?"
            description="This will cancel your leave and notify the administration."
            onConfirm={() => handleCancelLeave(record.id)}
            okText="Yes, Cancel Leave"
            cancelText="No"
            placement="left"
          >
            <Button 
              type="primary" 
              danger
              icon={<DeleteOutlined />}
            >
              Cancel Leave
            </Button>
          </Popconfirm>
        ) : (
          <Tag color="gray">No actions available</Tag>
        );
      },
      width: "16%",
      align: "center",
    },
  ];

  const renderRequestForm = () => (
    <Form
      form={form}
      layout="vertical"
      name="leave_request_form"
    >
      <Form.Item
        name="dateRange"
        label="Leave Period"
        rules={[{ required: true, message: "Please select your leave dates" }]}
      >
        <RangePicker 
          style={{ width: "100%" }}
          disabledDate={disabledDate}
          format="DD/MM/YYYY"
          placeholder={["Start Date", "End Date"]}
          onChange={(dates) => {
            if (dates && dates.length === 2) {
              checkAffectedAppointments(dates);
            } else {
              setShowAffectedWarning(false);
            }
          }}
        />
      </Form.Item>
      
      {showAffectedWarning && (
        <Alert
          message="Appointments Will Be Affected"
          description={`Your leave request will affect ${affectedAppointments.length} existing appointment${affectedAppointments.length !== 1 ? 's' : ''}. These will be automatically cancelled, and patients will be notified of the cancellation with your leave reason.`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      
      <Form.Item
        name="reason"
        label="Reason for Leave"
        rules={[{ required: true, message: "Please provide a reason for your leave" }]}
        extra={showAffectedWarning ? "This reason will be shared with patients whose appointments are affected." : null}
      >
        <TextArea 
          rows={4}
          placeholder="Please explain why you are requesting leave"
          maxLength={500}
          showCount
        />
      </Form.Item>
      
      <div className="leave-request-note">
        <Text type="secondary">
          <ExclamationCircleOutlined /> Note: Patients will be notified about your unavailability 
          during this period. Any scheduled appointments will be automatically cancelled.
        </Text>
      </div>
    </Form>
  );

  const renderHistory = () => (
    <div className="leave-history">
      <Table
        columns={columns}
        dataSource={leaveHistory}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 5 }}
        locale={{ emptyText: "No leave history found" }}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center" }}>
          <CalendarOutlined style={{ marginRight: 8 }} />
          <span>Doctor Leave Management</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      width={1000} // Increased from 800 to 1000
      style={{ top: 20 }} // Position the modal higher on the screen
      footer={
        tabKey === "request" ? [
          <Button key="back" onClick={onCancel}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={loading} 
            onClick={handleSubmit}
          >
            Submit Request
          </Button>
        ] : [
          <Button key="back" onClick={onCancel}>
            Close
          </Button>,
          <Button 
            key="new" 
            type="primary" 
            onClick={() => {
              setTabKey("request");
              form.resetFields();
              setShowAffectedWarning(false);
              setAffectedAppointments([]);
            }}
          >
            New Request
          </Button>
        ]
      }
    >
      <div className="leave-tabs">
        <div className="tab-header" style={{ marginBottom: 20 }}>
          <Space size="middle">
            <Button 
              type={tabKey === "request" ? "primary" : "default"}
              onClick={() => setTabKey("request")}
              icon={<FileTextOutlined />}
            >
              Request Leave
            </Button>
            <Button 
              type={tabKey === "history" ? "primary" : "default"}
              onClick={() => setTabKey("history")}
              icon={<ClockCircleOutlined />}
            >
              Leave History
            </Button>
          </Space>
        </div>
        
        <Divider style={{ margin: "12px 0" }} />
        
        {tabKey === "request" ? renderRequestForm() : renderHistory()}
      </div>
    </Modal>
  );
};

export default DoctorLeaveModal;