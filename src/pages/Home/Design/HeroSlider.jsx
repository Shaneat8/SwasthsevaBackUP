import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./HeroSlider.module.css";
import gsap from "gsap";

const HeroSlider = () => {
  const navigate = useNavigate();
  const sliderRef = useRef(null);
  
  const slides = [
    {
      id: 1,
      title: "Find the Right Doctor",
      description: "Connect with experienced specialists who can address your health concerns with personalized care.",
      icon: "👨‍⚕️",
      color: "blue",
      action: () => navigate("/doctor-list"),
      imagePath: require("../../images/doc1.png")
    },
    {
      id: 2,
      title: "Book Appointments Easily",
      description: "Schedule your consultation in seconds with our intuitive appointment booking system.",
      icon: "📅",
      color: "green",
      action: () => navigate("/appointments"),
      imagePath: require("../../images/dpc2.png")
    },
    {
      id: 3,
      title: "Access Medical Records",
      description: "Keep all your health information in one secure place for better continuity of care.",
      icon: "📋",
      color: "purple",
      action: () => navigate("/medical-records"),
      imagePath: "/images/medical-records.jpg"
    },
    {
      id: 4,
      title: "Register as a Doctor",
      description: "Join our platform as a healthcare provider and connect with patients seeking your expertise.",
      icon: "🩺",
      color: "orange",
      action: () => navigate("/doctor"),
      imagePath: "/images/doctor-registration.jpg"
    }
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-scroll functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  // GSAP Animations
  useEffect(() => {
    if (sliderRef.current) {
      // Slide content animation
      gsap.fromTo(
        `.${styles.slideContent}`,
        { 
          opacity: 0, 
          y: 50,
          scale: 0.9
        },
        { 
          opacity: 1, 
          y: 0,
          scale: 1,
          duration: 1,
          ease: "power3.out"
        }
      );

      // Background image animation
      gsap.fromTo(
        `.${styles.slideImageContainer}`,
        { 
          opacity: 0, 
          scale: 1.2
        },
        { 
          opacity: 1, 
          scale: 1,
          duration: 1.5,
          ease: "power3.out"
        }
      );
    }
  }, [currentSlide]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const handleLearnMore = (slide) => {
    if (slide.action) {
      slide.action();
    }
  };

  return (
    <div className={styles.sliderContainer} ref={sliderRef}>
      <div className={styles.sliderHeaderWrapper}>
        <h1 className={styles.sliderHeader}>Swasthya Seva Healthcare Platform</h1>
        <p className={styles.sliderSubheader}>
          Transforming how you experience healthcare
        </p>
      </div>

      <div className={styles.sliderWrapper}>
        <button 
          className={`${styles.sliderButton} ${styles.prevButton}`}
          onClick={prevSlide}
          aria-label="Previous slide"
        >
          &#10094;
        </button>

        <div className={styles.slideTrack}>
          {slides.map((slide, index) => (
            <div 
              key={slide.id}
              className={`${styles.slide} ${currentSlide === index ? styles.activeSlide : ''} ${styles[`slide${slide.color}`]}`}
              style={{ 
                transform: `translateX(${100 * (index - currentSlide)}%)`,
                display: currentSlide === index ? 'flex' : 'none'
              }}
            >
              <div className={styles.slideImageContainer}>
                <img 
                  src={slide.imagePath} 
                  alt={slide.title} 
                  className={styles.fullPageImage}
                />
                <div className={styles.imageOverlay}></div>
              </div>
              
              <div className={styles.slideContent}>
                <div className={styles.slideIcon}>{slide.icon}</div>
                <h2 className={styles.slideTitle}>{slide.title}</h2>
                <p className={styles.slideDescription}>{slide.description}</p>
                <button 
                  className={styles.learnMoreButton}
                  onClick={() => handleLearnMore(slide)}
                >
                  {slide.id === 4 ? "Register Now" : "Learn More"}
                </button>
              </div>
            </div>
          ))}
        </div>

        <button 
          className={`${styles.sliderButton} ${styles.nextButton}`}
          onClick={nextSlide}
          aria-label="Next slide"
        >
          &#10095;
        </button>
      </div>

      <div className={styles.slideDots}>
        {slides.map((_, index) => (
          <span 
            key={index}
            className={`${styles.dot} ${currentSlide === index ? styles.activeDot : ''}`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;