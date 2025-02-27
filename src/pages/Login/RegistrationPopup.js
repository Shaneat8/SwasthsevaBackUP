import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ShowLoader } from '../../redux/loaderSlice';

const RegistrationPopup = ({ onClose, className }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleRegister = async () => {
    // Show the loader
    dispatch(ShowLoader(true));

    // Logout guest user
    const logoutResult = logoutGuest();

    if (logoutResult.success) {
      // Simulate a delay for the loader (optional)
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
    }

    // Navigate to the registration page
    navigate('/register');

    // Hide the loader after navigation
    dispatch(ShowLoader(false));

    // Close the popup
    onClose();
  };

  const logoutGuest = () => {
    // Check if the current user is a guest
    const user = JSON.parse(localStorage.getItem("user") || "null");
    
    if (user && user.isGuest) {
      // Remove user from localStorage
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      
      return {
        success: true,
        message: "Guest user logged out successfully"
      };
    }
    
    return {
      success: false,
      message: "No guest user to logout"
    };
  };
  
  // Prevent clicks inside the popup from closing it
  const handlePopupClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className || ''}`}
      onClick={onClose}
    >
      <div 
        className="bg-white p-4 rounded shadow-lg max-w-md w-full"
        onClick={handlePopupClick}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Create an Account</h2>
          <button 
            className="text-gray-500 hover:text-gray-700 text-2xl" 
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        <p className="mb-4">To access this feature, you need to create an account or login.</p>
        <div className="flex gap-3 justify-end">
          <button 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={handleRegister} // Call handleRegister directly
          >
            Register Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPopup;