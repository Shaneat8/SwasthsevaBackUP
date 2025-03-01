import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import loadingVideo from "../assets/bgFile.webm";
import "./Spinner.css";

function Spinner() {
  const { loading } = useSelector(state => state.loader);
  const [showSpinner, setShowSpinner] = useState(false);
  const [timer, setTimer] = useState(null);

  useEffect(() => {
    // When loading becomes true
    if (loading) {
      setShowSpinner(true);
      // Clear any existing timer
      if (timer) clearTimeout(timer);
    } 
    // When loading becomes false
    else {
      // Set a minimum 2-second timer before hiding
      const newTimer = setTimeout(() => {
        setShowSpinner(false);
      }, 2000);
      
      setTimer(newTimer);
    }

    // Cleanup function
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [loading]);

  // Don't render anything if spinner shouldn't show
  if (!showSpinner) return null;

  return (
    <div className="spinner-parent">
      <div className="backdrop-blur">
        <video autoPlay loop muted className="loading-video">
          <source src={loadingVideo} type="video/webm" />
          Your browser does not support the video tag.
        </video>
        <p className="loading-text">Loading...</p>
      </div>
    </div>
  );
}

export default Spinner;