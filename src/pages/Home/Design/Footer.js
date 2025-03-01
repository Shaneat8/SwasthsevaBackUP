import React from 'react';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.topSection}>
          <div className={styles.headingSection}>
            <h2 className={styles.mainHeading}>Let's Connect<br />with us</h2>
            <div className={styles.contactButton}>
              <a href="/profile?tab=tickets" className={styles.contactLink}>Contact Us</a>
            </div>
          </div>
          
          <hr className={styles.divider} />

          <div className={styles.infoSection}>
            <div className={styles.logoSection}>
              <div className={styles.logo}>
                <div
                  className={styles.logoImage}
                />
              </div>
            </div>

            <div className={styles.linksSection}>
              <div className={styles.quickLinks}>
                <h3 className={styles.linkHeading}>QUICK LINKS</h3>
                <ul className={styles.linksList}>
                  <li><a href="/">Home</a></li>
                  <li><a href="/AboutUs">About Us</a></li>
                  <li><a href="/AboutUs">Meet Our Team</a></li>
                  <li><a href="/Profile">Profile</a></li>
                </ul>
              </div>

              <div className={styles.servicesLinks}>
                <h3 className={styles.linkHeading}>SERVICES</h3>
                <ul className={styles.linksList}>
                  <li><a href="/book-doctor">Book Appointment</a></li>
                  <li><a href="/book-test">Book Test</a></li>
                  <li><a href="/doctor">Register a Doctor</a></li>
                  <li><a href="/profile?tab=records">Records</a></li>
                  <li><a href="/profile?tab=support">Register a Complaint</a></li>
                </ul>
              </div>

              <div className={styles.contactInfo}>
                <h3 className={styles.linkHeading}>CONTACT INFORMATION</h3>
                <p className={styles.contactDetail}>
                  Phone: +91 012-232-4452
                </p>
                <p className={styles.contactDetail}>
                  Email: swasthyasevawovv@gmail.com
                </p>
                <p className={styles.contactDetail}>
                  Address: 123 Wellness Street, Healthy City, Mediland 456789
                </p>
                <div className={styles.socialIcons}>
                  <a href="#facebook" className={styles.socialLink}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" className={styles.icon}>
                      <path fill="currentColor" d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z" />
                    </svg>
                  </a>
                  <a href="#instagram" className={styles.socialLink}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className={styles.icon}>
                      <path fill="currentColor" d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
                    </svg>
                  </a>
                  <a href="#linkedin" className={styles.socialLink}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className={styles.icon}>
                      <path fill="currentColor" d="M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z" />
                    </svg>
                  </a>
                  <a href="#skype" className={styles.socialLink}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className={styles.icon}>
                      <path fill="currentColor" d="M424.7 299.8c2.9-14 4.7-28.9 4.7-43.8 0-113.5-91.9-205.3-205.3-205.3-14.9 0-29.7 1.7-43.8 4.7C161.3 40.7 137.7 32 112 32 50.2 32 0 82.2 0 144c0 25.7 8.7 49.3 23.3 68.2-2.9 14-4.7 28.9-4.7 43.8 0 113.5 91.9 205.3 205.3 205.3 14.9 0 29.7-1.7 43.8-4.7 19 14.6 42.6 23.3 68.2 23.3 61.8 0 112-50.2 112-112 .1-25.6-8.6-49.2-23.2-68.1zm-194.6 91.5c-65.6 0-120.5-29.2-120.5-65 0-16 9-30.6 29.5-30.6 31.2 0 34.1 44.9 88.1 44.9 25.7 0 42.3-11.4 42.3-26.3 0-18.7-16-21.6-42-28-62.5-15.4-117.8-22-117.8-87.2 0-59.2 58.6-81.1 109.1-81.1 55.1 0 110.8 21.9 110.8 55.4 0 16.9-11.4 31.8-30.3 31.8-28.3 0-29.2-33.5-75-33.5-25.7 0-42 7-42 22.5 0 19.8 20.8 21.8 69.1 33 41.4 9.3 90.7 26.8 90.7 77.6 0 59.1-57.1 86.5-112 86.5z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.copyright}>
          © 2025 Healthcare Center. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;