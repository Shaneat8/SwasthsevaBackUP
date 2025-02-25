import React, { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { ShowLoader } from "../../redux/loaderSlice";
import { GetAllDoctors, UpdateDoctor } from "../../apicalls/doctors";
import { GetDoctorAppointmentsByDoctorId } from "../../apicalls/appointment";
import { Card, Table, Modal, Tabs, Button, Tag, message } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  CalendarOutlined,
  TrophyOutlined,
  EyeOutlined,
} from "@ant-design/icons";

const DoctorsList = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorAppointments, setDoctorAppointments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dispatch = useDispatch();

  const getData = useCallback(async () => {
    try {
      dispatch(ShowLoader(true));
      const response = await GetAllDoctors();
      if (response.success) {
        setDoctors(response.data);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      dispatch(ShowLoader(false));
    }
  }, [dispatch]);

  const handleViewDoctor = (doctor) => {
    const doctorData = {
      ...doctor,
      id: doctor.id || doctor.userId,
    };
    setSelectedDoctor(doctorData);
    setIsModalOpen(true);
    getDoctorAppointments(doctorData.id); // Pass doctorId directly
  };

  const getDoctorAppointments = async (doctorId) => {
    if (!doctorId) {
      console.error("Doctor ID is undefined");
      return;
    }

    try {
      dispatch(ShowLoader(true));
      const response = await GetDoctorAppointmentsByDoctorId(doctorId);

      if (response.success) {
        const formattedAppointments = response.data.map((appointment) => ({
          key: appointment.id,
          id: appointment.id,
          userName: appointment.userName,
          date: appointment.date,
          timeSlot: appointment.timeSlot || appointment.slot,
          problem: appointment.problem,
          status: appointment.status,
          bookedOn: new Date(appointment.bookedOn).toLocaleDateString(),
          seenAt: appointment.seenAt
            ? new Date(appointment.seenAt).toLocaleDateString()
            : "-",
          rescheduleStatus: appointment.rescheduleStatus,
          userEmail: appointment.userEmail,
        }));

        setDoctorAppointments(formattedAppointments);
      } else {
        throw new Error(response.message || "Failed to fetch appointments");
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      message.error(error.message);
    } finally {
      dispatch(ShowLoader(false));
    }
  };

  const getStatusTag = (status, rescheduleStatus) => {
    const statusConfig = {
      approved: { color: "success", icon: <CheckCircleOutlined /> },
      pending: { color: "warning", icon: <ExclamationCircleOutlined /> },
      rejected: { color: "error", icon: <CloseCircleOutlined /> },
      blocked: { color: "default", icon: <CloseCircleOutlined /> },
      seen: { color: "success", icon: <CheckCircleOutlined /> },
      unseen: { color: "warning", icon: <ExclamationCircleOutlined /> },
      cancelled: { color: "error", icon: <CloseCircleOutlined /> },
    };

    // If there's a reschedule status, show it alongside the main status
    if (rescheduleStatus) {
      return (
        <div className="space-y-1">
          <Tag
            icon={statusConfig[status].icon}
            color={statusConfig[status].color}
          >
            {status.toUpperCase()}
          </Tag>
          <Tag color="blue">RESCHEDULE {rescheduleStatus.toUpperCase()}</Tag>
        </div>
      );
    }

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Tag icon={config.icon} color={config.color}>
        {status.toUpperCase()}
      </Tag>
    );
  };

  const handleStatusChange = async (doctor, newStatus) => {
    try {
      dispatch(ShowLoader(true));
      const response = await UpdateDoctor({ ...doctor, status: newStatus });
      if (response.success) {
        message.success(`Doctor status updated to ${newStatus}`);
        getData();
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      dispatch(ShowLoader(false));
    }
  };

  useEffect(() => {
    getData();
  }, [getData]);

  const DoctorDetails = ({ doctor }) => (
    <div className="space-y-6">
      <Card
        title={
          <div className="flex items-center gap-2">
            <UserOutlined /> Personal Information
          </div>
        }
      >
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-500">Full Name</p>
            <p className="font-medium">{`${doctor?.firstName} ${doctor?.lastName}`}</p>
          </div>
          <div>
            <p className="text-gray-500">Registration ID</p>
            <p className="font-medium">{doctor?.reg_id}</p>
          </div>
          <div className="flex items-start gap-2">
            <MailOutlined className="mt-1 text-gray-500" />
            <div>
              <p className="text-gray-500">Email</p>
              <p className="font-medium">{doctor?.email}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <PhoneOutlined className="mt-1 text-gray-500" />
            <div>
              <p className="text-gray-500">Phone</p>
              <p className="font-medium">{doctor?.phone}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card
        title={
          <div className="flex items-center gap-2">
            <TrophyOutlined /> Professional Details
          </div>
        }
      >
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-500">Specialization</p>
            <p className="font-medium">{doctor?.Specialist}</p>
          </div>
          <div>
            <p className="text-gray-500">Qualification</p>
            <p className="font-medium">{doctor?.Qualification}</p>
          </div>
          <div>
            <p className="text-gray-500">Experience</p>
            <p className="font-medium">{doctor?.experience} years</p>
          </div>
          <div className="flex items-start gap-2">
            <DollarOutlined className="mt-1 text-gray-500" />
            <div>
              <p className="text-gray-500">Consultation Fee</p>
              <p className="font-medium">₹{doctor?.Fee}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card
        title={
          <div className="flex items-center gap-2">
            <CalendarOutlined /> Practice Details
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-2">
            <ClockCircleOutlined className="mt-1 text-gray-500" />
            <div>
              <p className="text-gray-500">Consultation Hours</p>
              <p className="font-medium">
                {doctor?.startTime} - {doctor?.endTime}
              </p>
            </div>
          </div>
          <div>
            <p className="text-gray-500 mb-2">Available Days</p>
            <div className="flex flex-wrap gap-2">
              {doctor?.days?.map((day, index) => (
                <Tag key={index} color="blue">
                  {day}
                </Tag>
              ))}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <EnvironmentOutlined className="mt-1 text-gray-500" />
            <div>
              <p className="text-gray-500">Address</p>
              <p className="font-medium whitespace-pre-line">
                {doctor?.address}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const columns = [
    {
      title: "Doctor Name",
      dataIndex: "firstName",
      render: (_, record) => (
        <div>
          <p className="font-medium">{`${record.firstName} ${record.lastName}`}</p>
          <p className="text-sm text-gray-500">{record.email}</p>
        </div>
      ),
    },
    {
      title: "Specialization",
      dataIndex: "Specialist",
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => getStatusTag(status),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Button
            type="default"
            icon={<EyeOutlined />}
            onClick={() => handleViewDoctor(record)}
          >
            View
          </Button>
          {record.status === "pending" && (
            <>
              <Button
                danger
                onClick={() => handleStatusChange(record, "rejected")}
              >
                Reject
              </Button>
              <Button
                type="primary"
                className="bg-green-500"
                onClick={() => handleStatusChange(record, "approved")}
              >
                Approve
              </Button>
            </>
          )}
          {record.status === "approved" && (
            <Button
              danger
              onClick={() => handleStatusChange(record, "blocked")}
            >
              Block
            </Button>
          )}
          {(record.status === "rejected" || record.status === "blocked") && (
            <Button
              type="primary"
              className="bg-green-500"
              onClick={() => handleStatusChange(record, "approved")}
            >
              {record.status === "rejected" ? "Approve" : "Unblock"}
            </Button>
          )}
        </div>
      ),
    },
  ];

  const appointmentColumns = [
    {
      title: "Patient Name",
      dataIndex: "userName",
      key: "userName",
    },
    {
      title: "Patient Email",
      dataIndex: "userEmail",
      key: "userEmail",
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Time Slot",
      dataIndex: "timeSlot",
      key: "timeSlot",
    },
    {
      title: "Problem",
      dataIndex: "problem",
      key: "problem",
      ellipsis: true,
    },
    {
      title: "Booked On",
      dataIndex: "bookedOn",
      key: "bookedOn",
    },
    {
      title: "Last Seen",
      dataIndex: "seenAt",
      key: "seenAt",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status, record) => getStatusTag(status, record.rescheduleStatus),
    },
  ];

  return (
    <div className="p-6">
      <Card title="Doctors Management">
        <Table
          columns={columns}
          dataSource={doctors}
          rowKey={(record) => record.id || record.userId}
        />
      </Card>

      <Modal
        title="Doctor Information"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setDoctorAppointments([]);
          setSelectedDoctor(null);
        }}
        width={1200}
        footer={null}
      >
        <Tabs
          items={[
            {
              key: "1",
              label: "Doctor Details",
              children: <DoctorDetails doctor={selectedDoctor} />,
            },
            {
              key: "2",
              label: "Appointments",
              children: (
                <Table
                  columns={appointmentColumns}
                  dataSource={doctorAppointments}
                  rowKey={(record) => record.id}
                  pagination={{ pageSize: 5 }}
                  scroll={{ x: true }}
                />
              ),
            },
          ]}
        />
      </Modal>
    </div>
  );
};

export default DoctorsList;