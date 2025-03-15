import React, { useEffect, useRef, useState, useCallback } from "react";
import "./Slider.css";

import appointmentImage from "../../images/book_appnt.png";
import doctorImage from "../../images/doc_24.png";
import recordsImage from "../../images/med_record.png";
import reportsImage from "../../images/test_report.png";
import reg_doc from "../../images/reg_doc.png";

const HeroSlider = () => {
  const carouselRef = useRef(null);
  const runningTimeRef = useRef(null);
  const [items, setItems] = useState([
    {
      background: appointmentImage,
      name: "Book Appointments",
      des: "Schedule appointments with our specialists at your convenience. Choose from available time slots and receive instant confirmation."
    },
    {
      background: doctorImage,
      name: "Find the Right Doctor",
      des: "Connect with experienced specialists who can address your health concerns with personalized care."
    },
    {
      background: recordsImage,
      name: "Access Medical Records",
      des: "Keep all your health information in one secure place for better continuity of care."
    },
    {
      background: reportsImage,
      name: "View Test Reports",
      des: "Access your test reports and appointment summaries anytime. Track your health progress with our user-friendly dashboard."
    },
    {
      background: reg_doc,
      name: "Register as a Doctor",
      des: "Join our platform as a healthcare provider and connect with patients seeking your expertise."
    },
  ]);

  const slideTransitionTime = 700;
  const timeAutoNext = 5000;
  
  const runTimeOutRef = useRef(null);
  const runNextAutoRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const resetTimeAnimation = useCallback(() => {
    if (runningTimeRef.current) {
      runningTimeRef.current.style.animation = 'none';
      void runningTimeRef.current.offsetHeight;
      runningTimeRef.current.style.animation = `runningTime ${timeAutoNext/1000}s linear 1 forwards`;
    }
  }, [timeAutoNext]);

  const showSlider = useCallback((type) => {
    if (!carouselRef.current || isAnimating) return;
    
    setIsAnimating(true);
    
    setTimeout(() => {
      if (type === 'next') {
        carouselRef.current.classList.add('next');
      } else {
        carouselRef.current.classList.add('prev');
      }
      
      clearTimeout(runTimeOutRef.current);
      runTimeOutRef.current = setTimeout(() => {
        let newItems = [...items];
        
        if (type === 'next') {
          const firstItem = newItems.shift();
          newItems.push(firstItem);
        } else {
          const lastItem = newItems.pop();
          newItems.unshift(lastItem);
        }
        
        carouselRef.current.classList.remove('next');
        carouselRef.current.classList.remove('prev');
        
        setItems(newItems);
        
        setTimeout(() => {
          setIsAnimating(false);
        }, 50);
      }, slideTransitionTime);
    }, 300);

    clearTimeout(runNextAutoRef.current);

    runNextAutoRef.current = setTimeout(() => {
      showSlider('next');
    }, timeAutoNext);

    resetTimeAnimation();
  }, [items, resetTimeAnimation, slideTransitionTime, timeAutoNext, isAnimating]);

  useEffect(() => {
    resetTimeAnimation();

    runNextAutoRef.current = setTimeout(() => {
      showSlider('next');
    }, timeAutoNext);

    return () => {
      clearTimeout(runTimeOutRef.current);
      clearTimeout(runNextAutoRef.current);
    };
  }, [resetTimeAnimation, showSlider, timeAutoNext]); 

  const handlePrev = () => {
    if (!isAnimating) {
      showSlider('prev');
    }
  };

  const handleNext = () => {
    if (!isAnimating) {
      showSlider('next');
    }
  };

  return (
    <div className="carousel" ref={carouselRef}>
      <div className="list">
        {items.map((item, index) => (
          <div
            key={`item-${index}-${item.name}`}
            className="item"
            style={{ backgroundImage: `url(${item.background})` }}
          >
            <div className="content">
              <div className="name">{item.name}</div>
              <div className="des">{item.des}</div>
              <div className="btn">
                {item.name === "Book Appointments" && (
                  <button><a href="/book-doctor">Book Now</a></button>
                )}
                {item.name === "Find the Right Doctor" && (
                  <button><a href="/book-doctor">Meet Our Doctors</a></button>
                )}
                {item.name === "Access Medical Records" && (
                  <button><a href="/profile?tab=records">Access Files</a></button>
                )}
                {item.name === "View Test Reports" && (
                  <button><a href="/profile?tab=records">View Reports</a></button>
                )}
                {item.name === "Register as a Doctor" && (
                  <button><a href="/doctor">Register Now</a></button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="arrows">
        <button 
          className="prev" 
          onClick={handlePrev}
          disabled={isAnimating}
        >
          &lt;
        </button>
        <button 
          className="next" 
          onClick={handleNext}
          disabled={isAnimating}
        >
          &gt;
        </button>
      </div>
      
      <div className="bottom-previews">
        {items.slice(2, 4).map((item, index) => (
          <div 
            key={`preview-${index}`} 
            className="preview-item"
            style={{ backgroundImage: `url(${item.background})` }}
            onClick={() => !isAnimating && showSlider(index === 0 ? 'next' : 'next')}
          >
            <div className="preview-label">{item.name}</div>
          </div>
        ))}
      </div>

      <div className="timeRunning" ref={runningTimeRef}></div>
    </div>
  );
};

export default HeroSlider;