import React, { useState, useCallback, useEffect } from "react";
import { useDispatch } from "react-redux";
import { message, Table } from "antd";
import { ShowLoader } from "../../redux/loaderSlice";
import { GetAllDoctors } from "../../apicalls/doctors";
import { GetAllUsers } from "../../apicalls/users";
import MedicineList from "./MedicineList";
import DoctorsList from "./DoctorsList";
import AdminTicket from "./AdminTicket";
import ResolvedComplaints from "./ResolvedComplaints";
import { collection, getDocs, query } from "firebase/firestore";
import firestoredb from "../../firebaseConfig";
import Reports from "./Reports";
import ManageFeedback from "./ManageFeedback";
import AdminTestManagement from "./TestManagement/AdminTestManagement";
import { useNavigate } from "react-router-dom";
import './AdminView.css'; // You'll need to create this CSS file

const EmptyState = ({ message }) => (
  <div className="empty-state">
    <div className="empty-icon">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
    <h3>No data available</h3>
    <p>{message}</p>
  </div>
);

const StatCard = ({ title, value, trend, trendsUp, onClick }) => (
  <div className={`stat-card ${trendsUp ? 'trend-up' : 'trend-down'}`} onClick={onClick}>
    <h3>{title}</h3>
    <p className="stat-value">{value.toLocaleString()}</p>
    <span className="trend-indicator">{trend}</span>
  </div>
);

const ListView = ({ type, data, onStatusUpdate }) => {
  const [loading] = useState(false);
  const doctorColumns = [
    {
      title: "First Name",
      dataIndex: "firstName",
    },
    {
      title: "Last Name",
      dataIndex: "lastName",
    },
    {
      title: "Email",
      dataIndex: "email",
    },
    {
      title: "Specialty",
      dataIndex: "Specialist",
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => (
        <span className={`status-badge ${status}`}>
          {status.toUpperCase()}
        </span>
      ),
    },
  ];

  const userColumns = [
    {
      title: "Name",
      dataIndex: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
    },
    {
      title: "Role",
      dataIndex: "role",
      render: (role) => role.toUpperCase(),
    },
  ];

  const getColumns = () => {
    switch (type) {
      case "doctors":
        return doctorColumns;
      case "patients":
        return userColumns;
      default:
        return [];
    }
  };

  if (!data || data.length === 0) {
    return (
      <EmptyState
        message={`No ${type} found. New ${type} will appear here when available.`}
      />
    );
  }

  return (
    <div className="list-view">
      <div className="list-header">
        <h2>{type.charAt(0).toUpperCase() + type.slice(1)} List</h2>
      </div>
      <Table
        columns={getColumns()}
        dataSource={data}
        rowKey="id"
        loading={loading}
      />
    </div>
  );
};

const Overview = ({ doctors, users, tickets }) => {
  const [activeList, setActiveList] = useState(null);

  const stats = React.useMemo(() => {
    const totalDoctors = doctors?.length || 0;
    const totalPatients =
      users?.filter((user) => user.role === "user")?.length || 0;
    const totalComplaints = tickets?.length || 0;
    const resolvedComplaints =
      tickets?.filter((ticket) => ticket.status === "closed")?.length || 0;

    return [
      {
        title: "Total Doctors",
        value: totalDoctors,
        trend: "↑ 5%",
        type: "doctors",
        trendsUp: true,
      },
      {
        title: "Total Patients",
        value: totalPatients,
        trend: "↑ 10%",
        type: "patients",
        trendsUp: true,
      },
      {
        title: "Total Complaints",
        value: totalComplaints,
        trend: "↓ 2%",
        type: "complaints",
        trendsUp: false,
      },
      {
        title: "Complaints Resolved",
        value: resolvedComplaints,
        trend: "↑ 8%",
        type: "resolved",
        trendsUp: true,
      },
    ];
  }, [doctors, users, tickets]);

  const renderList = () => {
    switch (activeList) {
      case "doctors":
        return <DoctorsList />;
      case "patients":
        return <ListView type="patients" data={users} />;
      case "complaints":
        return <AdminTicket />;
      case "resolved":
        return <ResolvedComplaints />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="stats-grid">
        {stats.map((stat) => (
          <StatCard
            key={stat.type}
            {...stat}
            onClick={() => setActiveList(stat.type)}
          />
        ))}
      </div>
      {activeList && renderList()}
    </>
  );
};

const AdminView = () => {
  const [tickets, setTickets] = useState([]);
  const [activeSection, setActiveSection] = useState("overview");
  const [doctors, setDoctors] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const dispatch = useDispatch();
  const nav = useNavigate();

  // Combine the authentication and user check into a single useEffect
  useEffect(() => {
    // Retrieve user from local storage or your authentication context
    const storedUser = JSON.parse(localStorage.getItem('user'));
    
    if (!storedUser || storedUser.role !== 'admin') {
      // Show error message
      message.error('Access Denied: You do not have permission to view this page.');
      
      // Redirect to home page
      nav('/');
    } else {
      setCurrentUser(storedUser);
    }
  }, [nav]);

  const fetchData = useCallback(async () => {
    // Check if user is admin before fetching data
    if (!currentUser || currentUser.role !== 'admin') {
      return;
    }

    try {
      dispatch(ShowLoader(true));
      setError(null);

      // Fetch tickets
      const ticketsQuery = query(collection(firestoredb, "tickets"));
      const ticketsSnapshot = await getDocs(ticketsQuery);
      const ticketsList = ticketsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTickets(ticketsList);

      // Fetch doctors
      const doctorsResponse = await GetAllDoctors();
      if (doctorsResponse.success) {
        setDoctors(doctorsResponse.data || []);
      }

      // Fetch users
      const usersResponse = await GetAllUsers();
      if (usersResponse.success) {
        setUsers(usersResponse.data || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message);
    } finally {
      dispatch(ShowLoader(false));
    }
  }, [dispatch, currentUser]);

  // Fetch data when currentUser changes and is an admin
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchData();
    }
  }, [currentUser, fetchData]);

  // If not an admin, return null (which prevents rendering)
  if (!currentUser || currentUser.role !== 'admin') {
    return null;
  }

  const renderSection = () => {
    if (error) {
      return (
        <div className="error-container">
          <p>Error: {error}</p>
          <button onClick={fetchData} className="retry-button">
            Retry
          </button>
        </div>
      );
    }

    switch (activeSection) {
      case "overview":
        return <Overview doctors={doctors} users={users} tickets={tickets} />;
      case "medicine":
        return <MedicineList />;
      case "reports":
        return <Reports />;
      case "tests":
        return <AdminTestManagement />;
      case "feedback":
        return <ManageFeedback />;
      default:
        return <Overview doctors={doctors} users={users} tickets={tickets} />;
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="sidebar-header">
            <h2>Hospital Admin</h2>
          </div>
          <nav className="sidebar-nav">
            {["overview", "medicine", "reports", "tests", "feedback"].map(
              (section) => (
                <button
                  key={section}
                  className={`nav-item ${activeSection === section ? "active" : ""}`}
                  onClick={() => setActiveSection(section)}
                >
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </button>
              )
            )}
          </nav>
        </aside>

        <div className="admin-content">
          <header className="content-header">
            <h1>
              Welcome to {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
            </h1>
          </header>
          <main className="content-main">{renderSection()}</main>
        </div>
      </div>
    </div>
  );
};

export default AdminView;