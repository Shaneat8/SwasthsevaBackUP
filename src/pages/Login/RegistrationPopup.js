import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ShowLoader } from '../../redux/loaderSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { UserOutlined, CloseOutlined } from '@ant-design/icons';

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

  // Animation variants for Framer Motion
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } }
  };

  const popupVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: 'spring', 
        damping: 25, 
        stiffness: 300,
        delay: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      y: 20, 
      scale: 0.95,
      transition: { duration: 0.2 }
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        className={`registration-popup-overlay ${className || ''}`}
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={overlayVariants}
        onClick={onClose}
      >
        <motion.div 
          className="registration-popup-content"
          variants={popupVariants}
          onClick={handlePopupClick}
        >
          <div className="registration-popup-header">
            <h2 className="registration-popup-title">Create an Account</h2>
            <p className="registration-popup-subtitle">Join Swasthya Seva for complete healthcare access</p>
            <button className="registration-popup-close" onClick={onClose}>
              <CloseOutlined />
            </button>
          </div>
          
          <div className="registration-popup-body">
            <p>To access premium features, you need to create an account:</p>
            <ul className="registration-popup-features">
              <li><span>✓</span> Book doctor appointments</li>
              <li><span>✓</span> Schedule lab tests</li>
              <li><span>✓</span> Access your medical records</li>
              <li><span>✓</span> Get personalized health support</li>
            </ul>
            
            <motion.button 
              className="registration-popup-button registration-popup-button-primary"
              onClick={handleRegister}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <UserOutlined className="registration-popup-icon" /> Register Now
            </motion.button>
          </div>
          
          <div className="registration-popup-footer">
            <p>
              By registering, you agree to our{' '}
              <span className="registration-popup-link">Terms</span> and{' '}
              <span className="registration-popup-link">Privacy Policy</span>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RegistrationPopup;