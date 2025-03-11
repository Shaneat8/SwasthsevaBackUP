import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Slider.css";

const HeroSlider = () => {
  const navigate = useNavigate();
  const carouselRef = useRef(null);
  const runningTimeRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const slides = [
    {
      id: 1,
      title: "SLIDER",
      name: "Find the Right Doctor",
      description: "Connect with experienced specialists who can address your health concerns with personalized care.",
      icon: "👨‍⚕️",
      color: "blue",
      action: () => navigate("/doctor-list"),
      imagePath: require("../../images/doc1.png")
    },
    {
      id: 2,
      title: "SLIDER",
      name: "Book Appointments Easily",
      description: "Schedule your consultation in seconds with our intuitive appointment booking system.",
      icon: "📅",
      color: "green",
      action: () => navigate("/appointments"),
      imagePath: require("../../images/dpc2.png")
    },
    {
      id: 3,
      title: "SLIDER",
      name: "Access Medical Records",
      description: "Keep all your health information in one secure place for better continuity of care.",
      icon: "📋",
      color: "purple",
      action: () => navigate("/medical-records"),
      imagePath: require("../../images/doc1.png")
    },
    {
      id: 4,
      title: "SLIDER",
      name: "Register as a Doctor",
      description: "Join our platform as a healthcare provider and connect with patients seeking your expertise.",
      icon: "🩺",
      color: "orange",
      action: () => navigate("/doctor"),
      imagePath: require("../../images/doc1.png")
    }
  ];

  const slidesRef = useRef(slides);
  const initialItemsRef = useRef([...slides, ...slides, ...slides, ...slides]);
  const [items, setItems] = useState(initialItemsRef.current);

  const slideTransitionTime = 1000;
  const timeAutoNext = 6000;

  const runTimeOutRef = useRef(null);
  const runNextAutoRef = useRef(null);
  const contentAnimTimeoutRef = useRef(null);
  const isInitialMount = useRef(true);

  const resetTimeAnimation = useCallback(() => {
    if (runningTimeRef.current) {
      runningTimeRef.current.style.animation = 'none';
      void runningTimeRef.current.offsetHeight;
      runningTimeRef.current.style.animation = `runningTime ${timeAutoNext / 1000}s linear forwards`;
    }
  }, [timeAutoNext]);

  const resetAnimationState = useCallback(() => {
    if (carouselRef.current) {
      carouselRef.current.classList.remove('next');
      carouselRef.current.classList.remove('prev');
    }
  }, []);

  const triggerContentAnimations = useCallback(() => {
    const activeContent = document.querySelector('.list .item:nth-child(2) .content');
    if (activeContent) {
      const elements = activeContent.querySelectorAll('.title, .name, .des, .btn');
      elements.forEach((el, i) => {
        el.style.animation = 'none';
        void el.offsetHeight;
        el.style.animation = `fadeInContent 0.5s ease-out ${0.1 * (i + 1)}s forwards`;
      });
    }
  }, []);

  useEffect(() => {
    const currentSlides = slidesRef.current;
    currentSlides.forEach(slide => {
      if (typeof slide.imagePath === 'string') {
        const img = new Image();
        img.src = slide.imagePath;
      }
    });
  }, []);

  const showSlider = useCallback((type) => {
    if (!carouselRef.current || isAnimating) return;

    setIsAnimating(true);
    clearTimeout(contentAnimTimeoutRef.current);

    if (type === 'next') {
      carouselRef.current.classList.add('next');
    } else {
      carouselRef.current.classList.add('prev');
    }

    clearTimeout(runTimeOutRef.current);
    runTimeOutRef.current = setTimeout(() => {
      const newItems = [...items];

      if (type === 'next') {
        const firstItem = newItems.shift();
        newItems.push(firstItem);
      } else {
        const lastItem = newItems.pop();
        newItems.unshift(lastItem);
      }

      resetAnimationState();
      setItems(newItems);

      contentAnimTimeoutRef.current = setTimeout(() => {
        triggerContentAnimations();
        setIsAnimating(false);
      }, 100);
    }, slideTransitionTime);

    clearTimeout(runNextAutoRef.current);
    runNextAutoRef.current = setTimeout(() => {
      showSlider('next');
    }, timeAutoNext);

    resetTimeAnimation();
  }, [isAnimating, items, resetAnimationState, resetTimeAnimation, slideTransitionTime, timeAutoNext, triggerContentAnimations]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      resetTimeAnimation();
      triggerContentAnimations();

      runNextAutoRef.current = setTimeout(() => {
        showSlider('next');
      }, timeAutoNext);
    }

    return () => {
      clearTimeout(runTimeOutRef.current);
      clearTimeout(runNextAutoRef.current);
      clearTimeout(contentAnimTimeoutRef.current);
    };
  }, [resetTimeAnimation, showSlider, timeAutoNext, triggerContentAnimations]);

  const handleNext = useCallback(() => {
    if (!isAnimating) {
      clearTimeout(runNextAutoRef.current);
      showSlider('next');
    }
  }, [isAnimating, showSlider]);

  const handlePrev = useCallback(() => {
    if (!isAnimating) {
      clearTimeout(runNextAutoRef.current);
      showSlider('prev');
    }
  }, [isAnimating, showSlider]);

  const handleLearnMore = useCallback((slide) => {
    if (slide.action) {
      slide.action();
    }
  }, []);

  useEffect(() => {
    const checkCarouselState = () => {
      if (carouselRef.current &&
        (carouselRef.current.classList.contains('next') ||
          carouselRef.current.classList.contains('prev'))) {
        resetAnimationState();
      }
    };

    const intervalId = setInterval(checkCarouselState, 5000);

    return () => clearInterval(intervalId);
  }, [resetAnimationState]);

  return (
    <div className="carousel" ref={carouselRef}>
      <div className="list">
        {items.map((slide, index) => (
          <div
            key={`item-${index}-${slide.id}`}
            className="item"
            style={{ backgroundImage: `url(${slide.imagePath})` }}
            onTransitionEnd={() => {
              if (index < 3) {
                resetAnimationState();
              }
            }}
          >
            <div className="imageOverlay"></div>
            <div className="content">
              <div className="title">{slide.title}</div>
              <div className="name">
                <span className="icon">{slide.icon}</span> {slide.name}
              </div>
              <div className="des">{slide.description}</div>
              <div className="btn">
                <button onClick={() => handleLearnMore(slide)}>
                  {slide.id === 4 ? "Register Now" : "Learn More"}
                </button>
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
          aria-label="Previous slide"
        >
          &lt;
        </button>
        <button
          className="next"
          onClick={handleNext}
          disabled={isAnimating}
          aria-label="Next slide"
        >
          &gt;
        </button>
      </div>

      <div className="timeRunning" ref={runningTimeRef}></div>
    </div>
  );
};

export default HeroSlider;