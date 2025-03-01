import React, { useEffect, useState, useRef } from 'react';
import styles from './Testimonials.module.css';

const Testimonials = () => {
  const [position, setPosition] = useState(0);
  const sliderRef = useRef(null);
  
  // Testimonial data array
  const testimonials = [
    {
      id: 1,
      text: "The medical staff was incredibly caring and professional. They made my recovery journey much easier with their support.",
      author: "Sarah Johnson",
      title: "Patient"
    },
    {
      id: 2,
      text: "Outstanding healthcare service. The doctors took time to explain everything and ensured I received the best treatment possible.",
      author: "Mark Williams",
      title: "Patient"
    },
    {
      id: 3,
      text: "I was amazed by the modern facilities and technology. The entire process from diagnosis to treatment was seamless and efficient.",
      author: "Jessica Chen",
      title: "Patient"
    },
    {
      id: 4,
      text: "The nursing staff provided exceptional care during my stay. Their attention to detail and compassion made all the difference.",
      author: "Robert Davis",
      title: "Patient"
    },
    {
      id: 5,
      text: "From the moment I walked in, I felt taken care of. The staff's expertise and warm approach helped ease my anxiety completely.",
      author: "Emily Taylor",
      title: "Patient"
    }
  ];

  // Animation effect to continuously move cards from right to left
  useEffect(() => {
    let cardWidth = 300; // Default card width including gap
    
    // Get actual card width from DOM when component mounts
    if (sliderRef.current && sliderRef.current.children.length > 0) {
      const firstCard = sliderRef.current.children[0];
      const style = window.getComputedStyle(firstCard);
      // Width + right margin/gap
      cardWidth = firstCard.offsetWidth + parseInt(style.marginRight || 0);
    }
    
    const totalWidth = cardWidth * testimonials.length;
    let animationFrame;
    let currentPosition = 0;
    
    const animate = () => {
      currentPosition -= 0.5; // Speed of animation
      
      // Reset position when we've moved past all cards
      if (Math.abs(currentPosition) >= totalWidth) {
        currentPosition = 0;
      }
      
      setPosition(currentPosition);
      animationFrame = requestAnimationFrame(animate);
    };
    
    // Start the animation
    animationFrame = requestAnimationFrame(animate);
    
    // Clean up
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [testimonials.length]);

  return (
    <section className={styles.testimonialsSection}>
      <h2 className={styles.sectionTitle}>Hear from Our Patients</h2>
      
      <div className={styles.testimonialContainer}>
        <div 
          ref={sliderRef}
          className={styles.testimonialSlider} 
          style={{ transform: `translateX(${position}px)` }}
        >
          {/* Duplicate testimonials at the end for seamless looping */}
          {[...testimonials, ...testimonials].map((testimonial, index) => (
            <div key={`${testimonial.id}-${index}`} className={styles.testimonialCard}>
              <p className={styles.testimonialText}>"{testimonial.text}"</p>
              <div className={styles.testimonialAuthor}>
                <div className={styles.testimonialAvatar}></div>
                <div>
                  <p className={styles.authorName}>{testimonial.author}</p>
                  <p className={styles.authorTitle}>{testimonial.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;