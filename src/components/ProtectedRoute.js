import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { isGuestUser } from "../apicalls/users";
import RegistrationPopup from "../pages/Login/RegistrationPopup";

function ProtectedRoute({ children }) {
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  // Redirect to login if no user is found
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Handle logo click
  const handleLogoClick = () => {
    if (user.role === "admin") {
      navigate("/AdminView");
    } else { 
      navigate("/");
    }
  };

  // Handle name click
  const handleNameClick = () => {
    if (user.role === "admin") {
      navigate("/AdminView");
    }
    else if(user.isGuest)
    {
      navigate("/");
    }
    else {
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

  return (
    <div className="layout p-1">
      <div className="header bg-white p-2 flex justify-between items-center">
        <h2 className="cursor-pointer" onClick={handleLogoClick}>
          <strong className="text-primary">Swasthya</strong>
          <strong className="text-secondary">{" "}Seva</strong>
        </h2>
        
        {user && (
          <div className="flex gap-3 items-center">
            <div className="flex gap-1 items-center">
              <i className="ri-shield-user-fill cursor-pointer" onClick={handleNameClick}></i> 
              <h4 className="uppercase cursor-pointer underline" onClick={handleNameClick}>
                {user.name}
                {/* Conditionally render the guest text without a click handler */}
                {user.isGuest && (
                  <span 
                    style={{ cursor: "default" }} // Disable pointer events
                    onClick={(e) => {
                      e.preventDefault(); // Prevent default behavior
                      e.stopPropagation(); // Stop event propagation
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
      
      {/* Add the click handler to the content div */}
      <div className="content my-1" onClick={handleContentClick}>
        {React.Children.map(children, (child) => {
          // Clone the child element and add a click handler to prevent guest access
          return React.cloneElement(child, {
            onClick: (e) => {
              if (isGuestUser()) {    
                e.preventDefault(); // Prevent default behavior
                e.stopPropagation(); // Stop event propagation
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