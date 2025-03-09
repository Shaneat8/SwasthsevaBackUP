import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import styles from './LabTestSection.module.css';

const LabTestSection = () => {
  const navigate = useNavigate();
  
  // Top 3 tests from the testCatalog in BookTest.js
  const featuredTests = [
    {
      id: "cbc",
      name: "Complete Blood Count (CBC)",
      price: 349,
      discountedPrice: 249,
      discount: "29% OFF",
      fastingRequired: true,
      reportTime: 24,
      description: "Basic blood test that checks overall health and detects disorders",
      imageSrc: require("../../images/blood_count.png")
    },
    {
      id: "thyroid",
      name: "Thyroid Profile",
      price: 799,
      discountedPrice: 599,
      discount: "25% OFF",
      fastingRequired: true,
      reportTime: 36,
      description: "Measures thyroid hormone levels to evaluate thyroid function",
      imageSrc: require("../../images/thyroid.png")
    },
    {
      id: "diabetes",
      name: "Diabetes Screening",
      price: 599,
      discountedPrice: 449,
      discount: "25% OFF",
      fastingRequired: true,
      reportTime: 24,
      description: "Screens for diabetes and pre-diabetes conditions",
      imageSrc: require("../../images/diabetes_screening.png")
    }
  ];
  
  // Navigate to book test page with the selected test ID
  const handleTestSelection = (testId) => {
    navigate('/book-test');
  };
  
  // Navigate to the full test catalog page
  const viewAllTests = () => {
    navigate('/book-test');
  };

  // Animation variants
  const sectionVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.2
      }
    }
  };
  
  const titleVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };
  
  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };
  
  const buttonVariants = {
    initial: { scale: 1 },
    hover: { 
      scale: 1.05,
      transition: { duration: 0.2 }
    },
    tap: { 
      scale: 0.95,
      transition: { duration: 0.1 }
    }
  };

  return (
    <motion.section 
      className={styles.labTestSection}
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className={styles.labTestContent}>
        <motion.h2 
          className={styles.labTestTitle}
          variants={titleVariants}
        >
          <span className={styles.titleHighlight}>Lab Tests</span> For Your Health
        </motion.h2>
        
        <motion.p 
          className={styles.labTestSubtitle}
          variants={titleVariants}
        >
          Fast, accurate results from certified professionals at your convenience
        </motion.p>
        
        <div className={styles.testCardsContainer}>
          {featuredTests.map((test, index) => (
            <motion.div 
              className={styles.testCard} 
              key={test.id} 
              onClick={() => handleTestSelection(test.id)}
              variants={cardVariants}
              whileHover={{ 
                y: -8, 
                boxShadow: "0 12px 30px rgba(59, 130, 246, 0.15)" 
              }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className={styles.testCardImage}>
                {test.imageSrc ? (
                  <motion.img 
                    src={test.imageSrc} 
                    alt={test.name} 
                    className={styles.testImage}
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.5 }}
                  />
                ) : (
                  <div className={styles.imagePlaceholder}></div>
                )}
                <motion.div 
                  className={styles.discountTag}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.1, duration: 0.3 }}
                >
                  {test.discount}
                </motion.div>
              </div>
              
              <div className={styles.testCardContent}>
                <h3 className={styles.testCardTitle}>{test.name}</h3>
                <p className={styles.testCardDescription}>{test.description}</p>
                
                <div className={styles.testInfoTags}>
                  <span className={styles.infoTag}>
                    <i className={`${styles.icon} ${styles.clockIcon}`}></i>
                    Results in {test.reportTime}h
                  </span>
                  <span className={`${styles.infoTag} ${test.fastingRequired ? styles.fastingRequired : styles.fastingNotRequired}`}>
                    <i className={`${styles.icon} ${test.fastingRequired ? styles.fastIcon : styles.checkIcon}`}></i>
                    {test.fastingRequired ? 'Fasting required' : 'No fasting'}
                  </span>
                </div>
                
                <div className={styles.testCardFooter}>
                  <div className={styles.priceContainer}>
                    <p className={styles.originalPrice}>₹{test.price}</p>
                    <p className={styles.discountedPrice}>₹{test.discountedPrice}</p>
                  </div>
                  <motion.button 
                    className={styles.viewDetailsButton}
                    variants={buttonVariants}
                    initial="initial"
                    whileHover="hover"
                    whileTap="tap"
                  >
                    View Details
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className={styles.viewAllContainer}>
          <motion.button 
            className={styles.viewAllButton} 
            onClick={viewAllTests}
            variants={buttonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
          >
            View All Lab Tests
            <i className={styles.arrowRightIcon}></i>
          </motion.button>
        </div>
      </div>
    </motion.section>
  );
};

export default LabTestSection;