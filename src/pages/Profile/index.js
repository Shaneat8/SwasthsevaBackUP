import React from "react";
import { message } from "antd";
import { useLocation, useNavigate } from "react-router-dom";

// Import components lazily to improve initial load time
// Import components lazily to improve initial load time
const AppointmentManagement = React.lazy(() => import("./Appointments").then(module => ({ 
  default: module.AppointmentManagement 
})));
const Doctor = React.lazy(() => import("../DoctorForm"));
const UserForm = React.lazy(() => import("./UserForm"));
const Records = React.lazy(() => import("./records"));
const TicketForm = React.lazy(() => import("../Ticket/TicketForm"));
const BookTest = React.lazy(() => import("../BookTest/BookTest"));
const TicketList = React.lazy(() => import("../Ticket/TicketList"));

function Profile() {
  const user = JSON.parse(localStorage.getItem("user"));
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tab = queryParams.get("tab") || "profile";
  const navigate = useNavigate();

  // Check for guest role when component mounts or tab changes
  React.useEffect(() => {
    if(user.role === "guest"){
      message.error("Please register before accessing");
      navigate('/');
      return;
    }
  }, [tab, navigate, user.role]);

  // Render content based on the current tab
  const renderContent = () => {
    // Use React.Suspense to handle the lazy loaded components
    return (
      <React.Suspense fallback={<div className="text-center p-4">Loading...</div>}>
        {getTabContent()}
      </React.Suspense>
    );
  };

  const getTabContent = () => {
    switch(tab) {
      case "appointments":
        return (
            <div>
              <AppointmentManagement />
            </div>
        );
      case "profile":
        return (
          <div>
            {user.role === "doctor" ? <Doctor /> : <UserForm />}
          </div>
        );
      case "records":
        return (
          <div>
            <Records />
          </div>
        );
      case "support":
        return (
          <div>
            <TicketForm />
          </div>
        );
      case "tickets":
        return (
          <div>
            <TicketList userEmail={user.email} />
          </div>
        );
      case "booktest":
        return (
          <div>
            <BookTest />
          </div>
        );
      default:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6">Your Profile</h2>
            {user.role === "doctor" ? <Doctor /> : <UserForm />}
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto p-4">
      {renderContent()}
    </div>
  );
}

export default Profile;