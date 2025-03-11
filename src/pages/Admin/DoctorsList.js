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
import styles from "./DoctorList.module.css";

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
        <div className={styles.spaceY1}>
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
    <div className={styles.spaceY6}>
      <Card
        title={
          <div className={styles.cardTitle}>
            <UserOutlined /> Personal Information
          </div>
        }
      >
        <div className={styles.gridCols2}>
          <div>
            <p className={styles.textGray500}>Full Name</p>
            <p className={styles.fontMedium}>{`${doctor?.firstName} ${doctor?.lastName}`}</p>
          </div>
          <div>
            <p className={styles.textGray500}>Registration ID</p>
            <p className={styles.fontMedium}>{doctor?.reg_id}</p>
          </div>
          <div className={`${styles.flex} ${styles.itemsStart} ${styles.gap2}`}>
            <MailOutlined className={`${styles.mt1} ${styles.textGray500}`} />
            <div>
              <p className={styles.textGray500}>Email</p>
              <p className={styles.fontMedium}>{doctor?.email}</p>
            </div>
          </div>
          <div className={`${styles.flex} ${styles.itemsStart} ${styles.gap2}`}>
            <PhoneOutlined className={`${styles.mt1} ${styles.textGray500}`} />
            <div>
              <p className={styles.textGray500}>Phone</p>
              <p className={styles.fontMedium}>{doctor?.phone}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card
        title={
          <div className={styles.cardTitle}>
            <TrophyOutlined /> Professional Details
          </div>
        }
      >
        <div className={styles.gridCols2}>
          <div>
            <p className={styles.textGray500}>Specialization</p>
            <p className={styles.fontMedium}>{doctor?.Specialist}</p>
          </div>
          <div>
            <p className={styles.textGray500}>Qualification</p>
            <p className={styles.fontMedium}>{doctor?.Qualification}</p>
          </div>
          <div>
            <p className={styles.textGray500}>Experience</p>
            <p className={styles.fontMedium}>{doctor?.experience} years</p>
          </div>
          <div className={`${styles.flex} ${styles.itemsStart} ${styles.gap2}`}>
            <DollarOutlined className={`${styles.mt1} ${styles.textGray500}`} />
            <div>
              <p className={styles.textGray500}>Consultation Fee</p>
              <p className={styles.fontMedium}>₹{doctor?.Fee}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card
        title={
          <div className={styles.cardTitle}>
            <CalendarOutlined /> Practice Details
          </div>
        }
      >
        <div className={styles.spaceY4}>
          <div className={`${styles.flex} ${styles.itemsStart} ${styles.gap2}`}>
            <ClockCircleOutlined className={`${styles.mt1} ${styles.textGray500}`} />
            <div>
              <p className={styles.textGray500}>Consultation Hours</p>
              <p className={styles.fontMedium}>
                {doctor?.startTime} - {doctor?.endTime}
              </p>
            </div>
          </div>
          <div>
            <p className={`${styles.textGray500} ${styles.mb2}`}>Available Days</p>
            <div className={styles.tagContainer}>
              {doctor?.days?.map((day, index) => (
                <Tag key={index} color="blue">
                  {day}
                </Tag>
              ))}
            </div>
          </div>
          <div className={`${styles.flex} ${styles.itemsStart} ${styles.gap2}`}>
            <EnvironmentOutlined className={`${styles.mt1} ${styles.textGray500}`} />
            <div>
              <p className={styles.textGray500}>Address</p>
              <p className={`${styles.fontMedium} ${styles.whitespacePre}`}>
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
          <p className={styles.fontMedium}>{`${record.firstName} ${record.lastName}`}</p>
          <p className={`${styles.textSm} ${styles.textGray500}`}>{record.email}</p>
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
        <div className={`${styles.flex} ${styles.itemsCenter} ${styles.gap2}`}>
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
                className={styles.approveButton}
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
              className={styles.approveButton}
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
    <div className={styles.container}>
      <Card title="Doctors Management">
        <Table
          columns={columns}
          dataSource={doctors}
          rowKey={(record) => record.id || record.userId}
        />
      </Card>

      <Modal
        bodyStyle={{ maxHeight: 'calc(80vh - 110px)', overflow: 'auto' }}
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