import React, { useState } from "react";
import { useNavigate, Navigate, useLocation } from "react-router-dom";
import { Menu, notification } from "antd";
import { 
  SearchOutlined, 
  CalendarOutlined, 
  FileTextOutlined, 
  CustomerServiceOutlined, 
  TagsOutlined,
  InfoCircleOutlined,
  CommentOutlined,
  QuestionCircleOutlined,
  UserOutlined,
  DashboardOutlined
} from "@ant-design/icons";
import { isGuestUser } from "../apicalls/users";
import RegistrationPopup from "../pages/Login/RegistrationPopup";

function ProtectedRoute({ children }) {
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tab = queryParams.get("tab") || "home";
  
  // Set the selected menu key based on current location
  const getSelectedKey = () => {
    // For regular user routes
    if (location.pathname === "/") return "0";
    if (location.pathname === "/profile") {
      if (tab === "appointments") return "1";
      if (tab === "doctor") return "1-1";
      if (tab === "labtest") return "1-2";
      if (tab === "records") return "2";
      if (tab === "about") return "3";
      if (tab === "feedback") return "4";
      if (tab === "support") return "5-1";
      if (tab === "tickets") return "5-2";
    }
    if (location.pathname === "/book-doctor") return "1-1";
    if (location.pathname === "/book-lab") return "1-2";
    
    // For doctor routes
    if (location.pathname === "/doctor-dashboard") return "d-0";
    if (location.pathname === "/appointment") return "d-1";
    if (location.pathname === "/doctor-profile" && tab === "records") return "d-2";
    if (location.pathname === "/AboutUs") return "d-3";
    if (location.pathname === "/feedback") return "d-4";
    
    return "0"; // Default to home
  };
  
  const [selectedKey, setSelectedKey] = useState(getSelectedKey());
  const user = JSON.parse(localStorage.getItem("user") || "null");

  // Redirect to login if no user is found
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Handle logo click
  const handleLogoClick = () => {
    if (user.role === "admin") {
      navigate("/AdminView");
    } else if (user.role === "doctor") {
      navigate("/doctor-dashboard");
    } else { 
      navigate("/");
    }
  };

  // Handle name click
  const handleNameClick = () => {
    if (user.role === "admin") {
      navigate("/AdminView");
    } else if (user.role === "doctor") {
      navigate("/doctor-profile");
    } else if(user.isGuest) {
      navigate("/");
    } else {
      navigate("/profile");
    }
  };

  // Handle content click for guest users
  const handleContentClick = () => {
    if (isGuestUser()) {
      setShowPopup(true); // Show the registration popup
      navigate("/");
    }
  };
  
  // Check if user profile is complete
  const isProfileComplete = () => {
    if (!user) return false;
    
    // Simple check for profile completion
    return user.name && user.email && (user.phone || user.phoneNumber);
  };

  // Handle menu navigation for regular users
  const handleMenuClick = (e) => {
    // Check profile completion for certain menu items
    const requiresCompleteProfile = ["1-1", "1-2", "5-1", "5-2"];
    
    if (requiresCompleteProfile.includes(e.key) && !isProfileComplete()) {
      notification.warning({
        message: 'Profile Incomplete',
        description: 'Please update your profile information first.',
        placement: 'topRight',
      });
      navigate("/profile?tab=records");
      return;
    }
    
    // Set the selected key and navigate
    setSelectedKey(e.key);
    
    switch(e.key) {
      case "0": navigate("/"); break;
      case "1": navigate("/profile?tab=appointments"); break;
      case "1-1": navigate("/book-doctor"); break;
      case "1-2": navigate("/book-test"); break;
      case "2": navigate("/profile?tab=records"); break;
      case "3": navigate("/AboutUs"); break;
      case "4": navigate("/feedback"); break;
      case "5-1": navigate("/profile?tab=support"); break;
      case "5-2": navigate("/profile?tab=tickets"); break;
      default: navigate("/");
    }
  };

  // Handle doctor menu navigation
  const handleDoctorMenuClick = (e) => {
    setSelectedKey(e.key);
    switch (e.key) {
      case "d-0":
        navigate("/doctor-dashboard");
        break;
      case "d-1":
        navigate("/appointment");
        break;
      case "d-2":
        navigate("/profile?tab=records");
        break;
      case "d-3":
        navigate("/AboutUs");
        break;
      case "d-4":
        navigate("/feedback");
        break;
      default:
        navigate("/doctor-dashboard");
    }
  };

  return (
    <div className="layout">
      <div className="header bg-white p-2 flex items-center">
        {/* Left side - Logo */}
        <div className="flex-none">
          <h2 className="cursor-pointer" onClick={handleLogoClick}>
            <strong className="text-primary">Swasthya</strong>
            <strong className="text-secondary">{" "}Seva</strong>
          </h2>
        </div>
        
        {/* Middle - Navigation Menu for regular users */}
        {user && user.role !== "admin" && user.role !== "doctor" && (
          <div className="flex-grow mx-4">
            <Menu
              mode="horizontal"
              selectedKeys={[selectedKey]}
              onClick={handleMenuClick}
              style={{ lineHeight: '40px', border: 'none' }}
            >
              <Menu.Item key="0" icon={<SearchOutlined />}>
                Home
              </Menu.Item>
              
              {/* Appointments with submenu */}
              <Menu.SubMenu 
                key="1" 
                icon={<CalendarOutlined />}
                title="Appointments"
              >
                <Menu.Item key="1-1">Book Doctor Appointment</Menu.Item>
                <Menu.Item key="1-2">Book Lab Test</Menu.Item>
              </Menu.SubMenu>
              
              <Menu.Item key="2" icon={<FileTextOutlined />}>
                Records
              </Menu.Item>
              
              <Menu.Item key="3" icon={<InfoCircleOutlined />}>
                About Us
              </Menu.Item>
              
              <Menu.Item key="4" icon={<CommentOutlined />}>
                Feedback
              </Menu.Item>
              
              {/* Help with submenu */}
              <Menu.SubMenu 
                key="5" 
                icon={<QuestionCircleOutlined />}
                title="Help"
              >
                <Menu.Item key="5-1" icon={<CustomerServiceOutlined />}>Support</Menu.Item>
                <Menu.Item key="5-2" icon={<TagsOutlined />}>My Tickets</Menu.Item>
              </Menu.SubMenu>
            </Menu>
          </div>
        )}
        
        {/* Navigation Menu for Doctors */}
        {user && user.role === "doctor" && (
          <div className="flex-grow mx-4">
            <Menu
              mode="horizontal"
              selectedKeys={[selectedKey]}
              onClick={handleDoctorMenuClick}
              style={{ lineHeight: "40px", border: "none" }}
            >
              <Menu.Item key="d-0" icon={<DashboardOutlined />}>
                Home
              </Menu.Item>

              <Menu.Item key="d-1" icon={<CalendarOutlined />}>
                Appointments
              </Menu.Item>

              <Menu.Item key="d-2" icon={<UserOutlined />}>
                Records
              </Menu.Item>

              <Menu.Item key="d-3" icon={<InfoCircleOutlined />}>
                About Us
              </Menu.Item>

              <Menu.Item key="d-4" icon={<CustomerServiceOutlined />}>
                Feedback
              </Menu.Item>
            </Menu>
          </div>
        )}
        
        {/* Right side - User info */}
        {user && (
          <div className="flex-none flex gap-3 items-center ml-auto">
            <div className="flex gap-1 items-center">
              <i className="ri-shield-user-fill cursor-pointer" onClick={handleNameClick}></i> 
              <h4 className="uppercase cursor-pointer underline" onClick={handleNameClick}>
                {user.name}
                {user.isGuest && (
                  <span 
                    style={{ cursor: "default" }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    {" "}
                  </span>
                )}
              </h4>
            </div>
            
            {user.isGuest ? (
              <div className="flex gap-2">
                <button 
                  className="bg-primary text-white text-xs px-2 py-1 rounded"
                  onClick={() => navigate("/register")}
                >
                  Register
                </button>
              </div>
            ) : (
              <i 
                className="ri-logout-box-r-line cursor-pointer" 
                onClick={() => {
                  localStorage.removeItem("user");
                  navigate("/login");
                }}
              ></i>
            )}
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="content my-1" onClick={handleContentClick}>
        {React.Children.map(children, (child) => {
          return React.cloneElement(child, {
            onClick: (e) => {
              if (isGuestUser()) {    
                e.preventDefault();
                e.stopPropagation();
              }
            },
          });
        })}
        {showPopup && (
          <RegistrationPopup
            onClose={() => setShowPopup(false)}
            className="registration-popup"
          />
        )}
      </div>
    </div>
  );
}

export default ProtectedRoute;