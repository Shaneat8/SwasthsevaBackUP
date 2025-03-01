import React from 'react';
import styles from './LabTestSection.module.css';

const LabTestSection = () => {
  return (
    <section className={styles.labTestSection}>
      <div className={styles.labTestContent}>
        <h2 className={styles.labTestTitle}>Book Your Test</h2>
        <p className={styles.labTestSubtitle}>
          Book your lab tests online with ease and get fast, accurate results
          from trusted professionals!
        </p>
        
        <div className={styles.testCardsContainer}>
          <div className={styles.testCard}>
            <div className={styles.testCardImage}>
              {/* You'll replace this with your actual image */}
              <div className={styles.imagePlaceholder}></div>
            </div>
            <h3 className={styles.testCardTitle}>Full Body Check-Up</h3>
            <p className={styles.testCardDescription}>
              A thorough check-up to monitor overall health, 
              including essential tests for heart, liver, and more.
            </p>
            <ul className={styles.testFeatures}>
              <li>Covers 10+ organ systems.</li>
              <li>Detects potential issues before symptoms arise.</li>
              <li>Provides actionable insights for a healthier you.</li>
            </ul>
            <div className={styles.testCardFooter}>
              <div className={styles.priceContainer}>
                <p className={styles.priceLabel}>Price</p>
                <p className={styles.price}>$430.00</p>
              </div>
              <button className={styles.primaryButton}>Book Now</button>
            </div>
          </div>
          
          <div className={styles.testCard}>
            <div className={styles.testCardImage}>
              {/* You'll replace this with your actual image */}
              <div className={styles.imagePlaceholder}></div>
            </div>
            <h3 className={styles.testCardTitle}>Diabetes Health Check-Up</h3>
            <p className={styles.testCardDescription}>
              A focused package for early detection and prevention
              of diabetes-related complications.
            </p>
            <ul className={styles.testFeatures}>
              <li>12 tests for diabetes monitoring.</li>
              <li>Tracks blood sugar and insulin levels.</li>
              <li>Detects early diabetes complications.</li>
            </ul>
            <div className={styles.testCardFooter}>
              <div className={styles.priceContainer}>
                <p className={styles.priceLabel}>Price</p>
                <p className={styles.price}>$364.00</p>
              </div>
              <button className={styles.primaryButton}>Book Now</button>
            </div>
          </div>
          
          <div className={styles.testCard}>
            <div className={styles.testCardImage}>
              {/* You'll replace this with your actual image */}
              <div className={styles.imagePlaceholder}></div>
            </div>
            <h3 className={styles.testCardTitle}>Heart Health Check-Up</h3>
            <p className={styles.testCardDescription}>
              Essential tests to assess heart function and detect
              any cardiovascular risks.
            </p>
            <ul className={styles.testFeatures}>
              <li>18 tests for heart health.</li>
              <li>Monitors cardiac function and cholesterol.</li>
              <li>Detects early cardiovascular risks.</li>
            </ul>
            <div className={styles.testCardFooter}>
              <div className={styles.priceContainer}>
                <p className={styles.priceLabel}>Price</p>
                <p className={styles.price}>$350.00</p>
              </div>
              <button className={styles.primaryButton}>Book Now</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LabTestSection;
