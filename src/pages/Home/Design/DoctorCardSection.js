import React, { useState, useEffect, useCallback } from "react";
import { message } from "antd";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import styles from "./DoctorCardSection.module.css";
import { GetAllDoctors } from "../../../apicalls/doctors";
import { ShowLoader } from "../../../redux/loaderSlice";

const DoctorCardSection = () => {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState("All Experts");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Calculate number of doctors to show per view
  const itemsPerView = 4;

  // Get visible doctors (utility function needed early)
  const getVisibleDoctors = useCallback((doctorsList) => {
    if (!doctorsList || !doctorsList.length) return [];
    
    const startIndex = activeIndex * itemsPerView;
    const endIndex = Math.min(startIndex + itemsPerView, doctorsList.length);
    return doctorsList.slice(startIndex, endIndex);
  }, [activeIndex]);

  // Get all doctor data
  const getData = useCallback(async () => {
    try {
      dispatch(ShowLoader(true));
      const response = await GetAllDoctors();
      
      if (response.success) {
        const approvedDoctors = response.data.filter(
          (doctor) => doctor.status === "approved"
        );
        // Assign a consistent imageIndex to each doctor when data is first loaded
        const doctorsWithImageIndex = approvedDoctors.map((doctor, index) => ({
          ...doctor,
          imageIndex: index % 5 + 1,
          gradientIndex: index % 5
        }));
        
        setDoctors(doctorsWithImageIndex);
        setFilteredDoctors(doctorsWithImageIndex);
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      dispatch(ShowLoader(false));
    }
  }, [dispatch, setDoctors, setFilteredDoctors]);

  // Initial data load
  useEffect(() => {
    getData();
  }, [getData]);

  // Calculate total number of pages
  const totalPages = Math.ceil(filteredDoctors.length / itemsPerView);

  // Handle next and previous buttons
  const handleNext = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % Math.max(1, totalPages));
  };

  const handlePrev = () => {
    setActiveIndex((prevIndex) =>
      prevIndex === 0 ? Math.max(totalPages - 1, 0) : prevIndex - 1
    );
  };

  // Handle specialty filter
  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
    setActiveIndex(0);
    
    // Apply specialty filter
    if (filter === "All Experts") {
      setFilteredDoctors(doctors);
    } else {
      const results = doctors.filter(
        (doctor) =>
          doctor.Specialist?.toLowerCase() === filter.toLowerCase() ||
          doctor.specialty?.toLowerCase() === filter.toLowerCase()
      );
      setFilteredDoctors(results);
    }
  };

  // Get all unique specialties for filter buttons
  const getSpecialties = () => {
    const specialties = new Set(["All Experts"]);
    doctors.forEach((doctor) => {
      if (doctor.Specialist) specialties.add(doctor.Specialist);
      if (doctor.specialty) specialties.add(doctor.specialty);
    });
    return Array.from(specialties);
  };

  // Get doctor's image
  const getDoctorImage = (doctor) => {
    try {
      // Check if doctor has a photoUrl from their profile
      if (doctor.photoUrl) {
        return doctor.photoUrl;
      }
    } catch (error) {
      message.error("Error loading doctor image");
    }
  };

  // Get gradient color based on the doctor's assigned gradientIndex
  const getGradientColor = (doctor) => {
    // Array of different gradient combinations
    const gradients = [
      'linear-gradient(to bottom, rgba(232, 244, 248, 0) 50%, rgba(62, 198, 224, 0.2) 60%, rgba(62, 198, 224, 0.7) 100%)',  // Blue
      'linear-gradient(to bottom, rgba(249, 232, 232, 0) 50%, rgba(229, 115, 115, 0.2) 60%, rgba(229, 115, 115, 0.7) 100%)',  // Red
      'linear-gradient(to bottom, rgba(240, 248, 232, 0) 50%, rgba(181, 213, 106, 0.2) 60%, rgba(181, 213, 106, 0.7) 100%)',  // Green
      'linear-gradient(to bottom, rgba(232, 240, 248, 0) 50%, rgba(100, 181, 246, 0.2) 60%, rgba(100, 181, 246, 0.7) 100%)',  // Light blue
      'linear-gradient(to bottom, rgba(250, 240, 230, 0) 50%, rgba(255, 183, 77, 0.2) 60%, rgba(255, 183, 77, 0.7) 100%)'    // Orange
    ];
    
    // Use doctor's consistent gradientIndex
    return gradients[doctor.gradientIndex];
  };

  // Handle doctor card click
  const handleDoctorClick = (doctor) => {
    // Navigate to book-appointment page with doctor's ID
    navigate(`/book-appointment/${doctor._id || doctor.id}`);
  };

  return (
    <section className={styles.doctorsSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          Dedicated <span className={styles.accentText}>Experts</span> Driving
          Exceptional Care
        </h2>
        <p className={styles.sectionSubtitle}>
          Meet the specialists shaping the future of healthcare with their
          expertise, innovation, and unwavering compassion
        </p>
      </div>

      <div className={styles.filterContainer}>
        {getSpecialties().map((specialty) => (
          <button
            key={specialty}
            className={`${styles.filterButton} ${
              activeFilter === specialty ? styles.activeFilter : ""
            }`}
            onClick={() => handleFilterClick(specialty)}
          >
            {specialty}
          </button>
        ))}
      </div>

      {filteredDoctors.length === 0 ? (
        <div className={styles.noResults}>
          <h3>No doctors found. Try a different filter.</h3>
        </div>
      ) : (
        <>
          <div className={styles.doctorCardsContainer}>
            {getVisibleDoctors(filteredDoctors).map((doctor, index) => {
              return (
                <div 
                  key={doctor._id || doctor.id || index}
                  className={styles.doctorCard}
                  onClick={() => handleDoctorClick(doctor)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Background container with light blue background */}
                  <div 
                    className={styles.doctorBackgroundContainer}
                    style={{ backgroundColor: "#dbe3ee" }}  
                  >
                    {/* Doctor image */}
                    <div 
                      className={styles.doctorImageContainer}
                      style={{
                        backgroundImage: `url(${getDoctorImage(doctor)})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center top",
                        backgroundRepeat: "no-repeat"
                      }}
                    >
                      {/* Gradient overlay */}
                      <div 
                        className={styles.gradientOverlay}
                        style={{
                          background: getGradientColor(doctor),
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Text overlay directly on the image */}
                  <div className={styles.doctorTextOverlay}>
                    <h3 className={styles.doctorName}>
                      {doctor.name ||
                        `${doctor.firstName || ""} ${doctor.lastName || ""}`}
                    </h3>
                    <p className={styles.doctorSpecialty}>
                      {doctor.specialty || doctor.Specialist || "Specialist"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.navigationContainer}>
            <div className={styles.paginationDots}>
              {Array.from({ length: Math.max(totalPages, 1) }).map(
                (_, index) => (
                  <span
                    key={index}
                    className={`${styles.paginationDot} ${
                      index === activeIndex ? styles.activeDot : ""
                    }`}
                    onClick={() => setActiveIndex(index)}
                  ></span>
                )
              )}
            </div>
            <div className={styles.navigationButtons}>
              <button
                className={styles.navButton}
                onClick={handlePrev}
                disabled={totalPages <= 1}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                className={styles.navButton}
                onClick={handleNext}
                disabled={totalPages <= 1}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default DoctorCardSection;