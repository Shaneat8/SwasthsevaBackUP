import React, { useEffect, useRef } from "react";
import styles from "./About.module.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { Power4, Elastic } from "gsap";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const About = () => {
  const horizontalSectionRef = useRef(null);
  const sectionsRef = useRef(null);
  const storySectionRef = useRef(null);
  const teamSectionRef = useRef(null);

  useEffect(() => {
    if (!horizontalSectionRef.current || !sectionsRef.current) return;

    const sections = sectionsRef.current.getElementsByClassName(styles.panel);
    if (!sections?.length) return;

    const heroTimeline = gsap.timeline();

    heroTimeline
      .from(`.${styles.heroBackground}`, {
        scale: 1.2,
        opacity: 0,
        duration: 2,
        ease: Power4.easeOut
      })
      .from(`.${styles.medicalElements}`, {
        scale: 0,
        opacity: 0,
        duration: 1.5,
        stagger: 0.2,
        ease: Elastic.easeOut.config(1, 0.3)
      }, "-=1.5");

    gsap.to(`.${styles.dnaHelix}`, {
      rotationY: 360,
      scale: "random(1.5, 2)",
      duration: 15,
      repeat: -1,
      ease: "none",
      transformOrigin: "center center"
    });

    gsap.to(`.${styles.circle}`, {
      y: "random(-100, 100)",
      x: "random(-100, 100)",
      rotation: "random(-360, 360)",
      duration: "random(4, 8)",
      repeat: -1,
      yoyo: true,
      ease: "none",
      stagger: {
        amount: 3,
        from: "random"
      }
    });

    gsap.to(`.${styles.medicalCross}`, {
      rotation: "random(-360, 360)",
      scale: "random(1.5, 2.5)",
      x: "random(-150, 150)",
      y: "random(-150, 150)",
      duration: "random(10, 15)",
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut",
      stagger: {
        amount: 4,
        from: "random"
      }
    });

    gsap.to(`.${styles.pulseRing}`, {
      scale: 2.5,
      opacity: 0,
      duration: 3,
      repeat: -1,
      ease: "power2.out",
      stagger: {
        amount: 2,
        from: "center"
      }
    });

    heroTimeline
      .from(`.${styles.heroTitle}`, {
        y: 50,
        opacity: 0,
        duration: 1,
        ease: "power3.out"
      })
      .from(`.${styles.logoFirst}, .${styles.logoSecond}`, {
        opacity: 0,
        scale: 0.8,
        y: 30,
        duration: 1.2,
        stagger: 0.2,
        ease: "back.out(1.7)"
      }, "-=0.5")
      .from(`.${styles.heroDescription}`, {
        opacity: 0,
        y: 30,
        duration: 1,
        ease: "power3.out"
      }, "-=0.7")
      .from(`.${styles.heroCTA}`, {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: "power3.out"
      }, "-=0.5");

    const width = horizontalSectionRef.current?.offsetWidth || window.innerWidth;
    let scrollTween = gsap.to(Array.from(sections), {
      xPercent: -100 * (sections.length - 1),
      ease: "none",
      scrollTrigger: {
        trigger: horizontalSectionRef.current,
        start: "top top",
        end: () => `+=${width * 2.5}`,
        pin: true,
        scrub: 1.5,
        snap: {
          snapTo: 1 / (sections.length - 1),
          duration: { min: 0.4, max: 0.7 },
          delay: 0.3,
          ease: "power2.inOut"
        },
        anticipatePin: 1
      }
    });

    Array.from(sections).forEach((panel) => {
      const content = panel.getElementsByClassName(styles.panelContent)[0];
      const title = panel.querySelector('h2');
      const features = panel.getElementsByClassName(styles.featureItem);

      if (content && title && features.length) {
        gsap.fromTo([title, content], {
          opacity: 0,
          y: 100,
          rotationX: -30
        }, {
          opacity: 1,
          y: 0,
          rotationX: 0,
          duration: 1.2,
          ease: "power4.out",
          scrollTrigger: {
            trigger: panel,
            containerAnimation: scrollTween,
            start: "left center",
            toggleActions: "play none none reverse"
          }
        });

        gsap.fromTo(features, {
          opacity: 0,
          scale: 0.8,
          y: 150,
          rotationX: -60
        }, {
          opacity: 1,
          scale: 1,
          y: 0,
          rotationX: 0,
          duration: 0.6,
          stagger: 0.2,
          ease: "power4.out",
          scrollTrigger: {
            trigger: panel,
            containerAnimation: scrollTween,
            start: "left center",
            toggleActions: "play none none reverse"
          }
        });
      }
    });

    const storyText = storySectionRef.current?.getElementsByClassName(styles.storyParagraph)[0];
    const storyTitle = storySectionRef.current?.getElementsByClassName(styles.storyTitle)[0];
    
    if (storyText && storyTitle) {
      gsap.fromTo(storyTitle, {
        opacity: 0,
        y: 50
      }, {
        opacity: 1,
        y: 0,
        duration: 1,
        scrollTrigger: {
          trigger: storySectionRef.current,
          start: "top 80%",
          toggleActions: "play none none reverse"
        }
      });

      gsap.fromTo(storyText, {
        opacity: 0,
        y: 50
      }, {
        opacity: 1,
        y: 0,
        duration: 1,
        delay: 0.3,
        scrollTrigger: {
          trigger: storySectionRef.current,
          start: "top 80%",
          toggleActions: "play none none reverse"
        }
      });
    }

    const teamCards = teamSectionRef.current?.getElementsByClassName(styles.teamCard);
    if (teamCards?.length) {
      gsap.fromTo(Array.from(teamCards), {
        opacity: 0,
        y: 100,
        rotationY: 45
      }, {
        opacity: 1,
        y: 0,
        rotationY: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: teamSectionRef.current,
          start: "top 80%",
          toggleActions: "play none none reverse"
        }
      });
    }

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <div className={styles.container}>
      <section className={styles.heroSection}>
        <div className={styles.heroBackground}>
          <div className={styles.medicalElements}>
            <div className={styles.pulse}></div>
            <div className={styles.heartbeat}></div>
            <div className={styles.circles}>
              {[...Array(5)].map((_, i) => (
                <div key={i} className={styles.circle}></div>
              ))}
            </div>
            <div className={styles.dnaHelix}></div>
            {[...Array(3)].map((_, i) => (
              <div
                key={`pulse-ring-${i}`}
                className={styles.pulseRing}
                style={{
                  width: `${(i + 1) * 100}px`,
                  height: `${(i + 1) * 100}px`,
                  animationDelay: `${i * 0.5}s`
                }}
              ></div>
            ))}
            {[...Array(4)].map((_, i) => (
              <div
                key={`cross-${i}`}
                className={styles.medicalCross}
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.7}s`
                }}
              ></div>
            ))}
          </div>
        </div>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            <span className={styles.logoFirst}>Swasthya</span>
            <span className={styles.logoSecond}>Seva</span>
          </h1>
          <p className={styles.heroDescription}>
            Revolutionizing healthcare management with a comprehensive platform
            connecting patients, doctors, and administrators.
          </p>
          <div className={styles.heroCTA}>
            <button className={styles.primaryButton}>
              Get Started
              <span className={styles.buttonIcon}>→</span>
            </button>
          </div>
        </div>
      </section>

      <section ref={horizontalSectionRef} className={styles.horizontalSection}>
        <div ref={sectionsRef} className={styles.sectionWrapper}>
          <div className={`${styles.panel} ${styles.patientsPanel}`}>
            <div className={styles.panelContent}>
              <h2>For Patients</h2>
              <div className={styles.featuresList}>
                <div className={styles.featureItem}>
                  <div className={styles.featureHeader}>
                    <div className={styles.featureNumber}>01</div>
                    <h3>Easy Appointments</h3>
                  </div>
                  <p>Schedule appointments with just a few clicks. Streamlined booking process for your convenience.</p>
                </div>
                <div className={styles.featureItem}>
                  <div className={styles.featureHeader}>
                    <div className={styles.featureNumber}>02</div>
                    <h3>Medical Records</h3>
                  </div>
                  <p>Secure access to your complete medical history. All your health information in one place.</p>
                </div>
                <div className={styles.featureItem}>
                  <div className={styles.featureHeader}>
                    <div className={styles.featureNumber}>03</div>
                    <h3>Smart Reminders</h3>
                  </div>
                  <p>Timely notifications for appointments and medications. Stay on top of your health schedule.</p>
                </div>
              </div>
            </div>
          </div>

          <div className={`${styles.panel} ${styles.doctorsPanel}`}>
            <div className={styles.panelContent}>
              <h2>For Doctors</h2>
              <div className={styles.featuresList}>
                <div className={styles.featureItem}>
                  <div className={styles.featureHeader}>
                    <div className={styles.featureNumber}>04</div>
                    <h3>Patient Management</h3>
                  </div>
                  <p>Efficiently manage your patient roster with comprehensive tools and insights.</p>
                </div>
                <div className={styles.featureItem}>
                  <div className={styles.featureHeader}>
                    <div className={styles.featureNumber}>05</div>
                    <h3>Medical Analytics</h3>
                  </div>
                  <p>Data-driven insights for better care and improved patient outcomes.</p>
                </div>
                <div className={styles.featureItem}>
                  <div className={styles.featureHeader}>
                    <div className={styles.featureNumber}>06</div>
                    <h3>Digital Prescriptions</h3>
                  </div>
                  <p>Write and manage prescriptions digitally with automated verification.</p>
                </div>
              </div>
            </div>
          </div>

          <div className={`${styles.panel} ${styles.adminsPanel}`}>
            <div className={styles.panelContent}>
              <h2>For Administrators</h2>
              <div className={styles.featuresList}>
                <div className={styles.featureItem}>
                  <div className={styles.featureHeader}>
                    <div className={styles.featureNumber}>07</div>
                    <h3>System Control</h3>
                  </div>
                  <p>Complete platform management with advanced configuration options.</p>
                </div>
                <div className={styles.featureItem}>
                  <div className={styles.featureHeader}>
                    <div className={styles.featureNumber}>08</div>
                    <h3>Analytics Dashboard</h3>
                  </div>
                  <p>Real-time performance metrics and comprehensive reporting tools.</p>
                </div>
                <div className={styles.featureItem}>
                  <div className={styles.featureHeader}>
                    <div className={styles.featureNumber}>09</div>
                    <h3>Security Management</h3>
                  </div>
                  <p>Maintain data security and compliance with industry standards.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section ref={storySectionRef} className={styles.storySection}>
        <div className={styles.storyContainer}>
          <h2 className={styles.storyTitle}>Our Journey</h2>
          <p className={styles.storyParagraph}>
            We recognized the challenges in healthcare management—fragmented
            records, communication gaps between doctors and patients, and
            administrative inefficiencies. Swasthya Seva was born from our
            vision to create an integrated ecosystem where healthcare becomes
            more accessible, efficient, and patient-centric.
          </p>
        </div>
      </section>

      <section ref={teamSectionRef} className={styles.teamSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Meet Our Team</h2>
          <p className={styles.sectionDescription}>
            The brilliant minds behind Swasthya Seva, committed to transforming
            healthcare management.
          </p>
        </div>
        <div className={styles.teamGrid}>
          <TeamCard
            name="Ambuj Tripathi"
            role="Backend Developer"
            imageUrl="/path/to/ambuj-image.jpg"
          />
          <TeamCard
            name="Manya Choradiya"
            role="UX Designer & Backend Developer"
            imageUrl="/path/to/manya-image.jpg"
          />
          <TeamCard
            name="Daksh Dhola"
            role="UX Designer & Developer"
            imageUrl="/path/to/daksh-image.jpg"
          />
        </div>
      </section>

      <section className={styles.ctaSection}>
        <h2 className={styles.ctaTitle}>Join the Healthcare Revolution</h2>
        <p className={styles.ctaDescription}>
          Experience a new standard in healthcare management with Swasthya Seva.
        </p>
        <button className={styles.ctaButton}>
          Get Started
          <span className={styles.ctaButtonIcon}>→</span>
        </button>
      </section>
    </div>
  );
};

const TeamCard = ({ name, role, imageUrl }) => {
  return (
    <div className={styles.teamCard}>
      <div className={styles.teamImageContainer}>
        <img src={imageUrl} alt={name} className={styles.teamImage} />
      </div>
      <div className={styles.teamInfo}>
        <h4 className={styles.teamName}>{name}</h4>
        <p className={styles.teamRole}>{role}</p>
      </div>
    </div>
  );
};

export default About;