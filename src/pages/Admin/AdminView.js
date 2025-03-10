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

const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
    <div className="w-12 h-12 text-gray-400 mb-3 flex items-center justify-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
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
    <h3 className="text-lg font-medium text-gray-900">No data available</h3>
    <p className="text-sm text-gray-500">{message}</p>
  </div>
);

const StatCard = ({ title, value, trend, trendsUp, onClick }) => (
  <div
    className="bg-white p-5 rounded-lg shadow-md cursor-pointer transition-transform duration-300 hover:-translate-y-1"
    onClick={onClick}
  >
    <h3 className="text-gray-600 text-sm mb-2">{title}</h3>
    <p className="text-2xl font-bold text-gray-800 mb-2">
      {value.toLocaleString()}
    </p>
    <span
      className={`text-sm flex items-center gap-1 ${
        trendsUp ? "text-green-600" : "text-red-600"
      }`}
    >
      {trend}
    </span>
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
        <span
          className={`px-2 py-1 rounded-full text-sm ${
            status === "approved"
              ? "bg-green-100 text-green-800"
              : status === "pending"
              ? "bg-orange-100 text-orange-800"
              : "bg-red-100 text-red-800"
          }`}
        >
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
    <div className="bg-white rounded-lg shadow-md p-5">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-bold">
          {type.charAt(0).toUpperCase() + type.slice(1)} List
        </h2>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
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
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">Error: {error}</p>
          <button
            onClick={fetchData}
            className="mt-2 px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200"
          >
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
    <div className="flex flex-col min-h-screen">
      {/* Main container with sidebar and content */}
      <div className="flex flex-1">
        <div className="w-64 bg-gray-900 text-white fixed left-0 top-[93px] bottom-0 h-[calc(100vh-93px)] overflow-y-auto z-10">
          <div className="p-5 border-b border-gray-700">
            <h2 className="text-2xl font-bold">Hospital Admin</h2>
          </div>
          <nav className="mt-5 px-3">
            {["overview", "medicine", "reports", "tests", "feedback"].map(
              (section) => (
                <button
                  key={section}
                  className={`w-full px-3 py-3 text-left rounded-md transition-colors duration-200 ${
                    activeSection === section
                      ? "bg-gray-800 text-white"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
                  onClick={() => setActiveSection(section)}
                >
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </button>
              )
            )}
          </nav>
        </div>

        {/* Main content with margin adjusted for the fixed sidebar */}
        <div className="flex-1 ml-64 bg-gray-50 min-h-screen">
          <header className="bg-white p-5 flex justify-between items-center shadow-sm">
            <h1 className="text-2xl text-gray-800">
              Welcome to{" "}
              {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
            </h1>
          </header>
          <main className="p-5">{renderSection()}</main>
        </div>
      </div>
    </div>
  );
};

export default AdminView;
