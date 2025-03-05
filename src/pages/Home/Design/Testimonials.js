import React, { useEffect, useState, useRef } from 'react';
import styles from './Testimonials.module.css';
import { getAllFeedback } from '../../../apicalls/feedback';

const Testimonials = () => {
  const [position, setPosition] = useState(0);
  const [testimonials, setTestimonials] = useState([]);
  const sliderRef = useRef(null);
  
  useEffect(() => {
    // Function to fetch testimonials that have display set to true
    const fetchTestimonials = async () => {
      try {
        // Use getAllFeedback to fetch all feedback
        const response = await getAllFeedback();
        
        if (response.success) {
          // Filter testimonials to only include those with display set to true
          const displayTestimonials = response.data
            .filter(feedback => feedback.display)
            .map(feedback => ({
              id: feedback.id,
              text: feedback.comment || "No comment provided",
              author: feedback.userName || `User ${feedback.userId}`, 
              title: `${feedback.userRole || 'User'} | ${feedback.rating} stars`,
              rating: feedback.rating
            }));
          
          setTestimonials(displayTestimonials);
        } else {
          console.error('Failed to fetch testimonials', response.message);
        }
      } catch (error) {
        console.error('Failed to fetch testimonials', error);
      }
    };

    fetchTestimonials();
  }, []);

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
    
    // Only start animation if there are testimonials
    if (testimonials.length > 0) {
      animationFrame = requestAnimationFrame(animate);
      
      // Clean up
      return () => {
        cancelAnimationFrame(animationFrame);
      };
    }
  }, [testimonials]);

  // If no testimonials are available, return a placeholder
  if (testimonials.length === 0) {
    return (
      <section className={styles.testimonialsSection}>
        <h2 className={styles.sectionTitle}>Patient Testimonials</h2>
        <div className={styles.noTestimonials}>
          No testimonials available at the moment.
        </div>
      </section>
    );
  }

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