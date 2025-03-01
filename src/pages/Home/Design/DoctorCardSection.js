import React, { useState, useEffect, useCallback } from "react";
import { message, Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import styles from "./DoctorCardSection.module.css";
import {GetAllDoctors} from "../../../apicalls/doctors";
import {ShowLoader} from "../../../redux/loaderSlice";

const DoctorCardSection = () => {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState("All Experts");
  const dispatch = useDispatch();

  // Get all doctor data
  const getData = useCallback(async () => {
    try {
      dispatch(ShowLoader(true));
      const response = await GetAllDoctors();
      dispatch(ShowLoader(false));

      if (response.success) {
        const approvedDoctors = response.data.filter(
          (doctor) => doctor.status === "approved"
        );
        setDoctors(approvedDoctors);
        setFilteredDoctors(approvedDoctors);
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error(error.message);
      dispatch(ShowLoader(false));
    }
  }, [dispatch]);

  useEffect(() => {
    getData();
  }, [getData]);

  // Calculate number of doctors to show per view
  const itemsPerView = 4;

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

  // Get only the visible doctors for the current page
  const getVisibleDoctors = () => {
    const startIndex = activeIndex * itemsPerView;
    const endIndex = Math.min(
      startIndex + itemsPerView,
      filteredDoctors.length
    );
    return filteredDoctors.slice(startIndex, endIndex);
  };

  // Handle search changes
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    // Reset active index when searching
    setActiveIndex(0);

    // Filter doctors based on search term
    filterDoctors(term, activeFilter);
  };

  // Handle specialty filter
  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
    setActiveIndex(0);
    filterDoctors(searchTerm, filter);
  };

  // Combined filter function for both search and specialty
  const filterDoctors = (term, filter) => {
    let results = [...doctors];

    // Apply specialty filter (if not "All Experts")
    if (filter !== "All Experts") {
      results = results.filter(
        (doctor) =>
          doctor.Specialist?.toLowerCase() === filter.toLowerCase() ||
          doctor.specialty?.toLowerCase() === filter.toLowerCase()
      );
    }

    // Apply search term filter
    if (term) {
      results = results.filter((doctor) => {
        const fullName = `${doctor.firstName || ""} ${
          doctor.lastName || ""
        }`.toLowerCase();
        const name = doctor.name ? doctor.name.toLowerCase() : "";
        const specialty = (
          doctor.Specialist ||
          doctor.specialty ||
          ""
        ).toLowerCase();

        return (
          fullName.includes(term.toLowerCase()) ||
          name.includes(term.toLowerCase()) ||
          specialty.includes(term.toLowerCase())
        );
      });
    }

    setFilteredDoctors(results);
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

  // Get doctor's image URL
  const getDoctorImage = (doctor) => {
    if (doctor.imageUrl) return doctor.imageUrl;
    // Create a placeholder image if no image is available
    return `/placeholder-doctor${(doctor.id % 6) + 1}.jpg`;
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

      <div className={styles.searchContainer}>
        <Input
          placeholder="Search Doctor by Name or Speciality"
          allowClear
          suffix={<SearchOutlined />}
          className={styles.searchInput}
          value={searchTerm}
          onChange={handleSearch}
        />
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
          <h3>No doctors found. Try a different search term or filter.</h3>
        </div>
      ) : (
        <>
          <div className={styles.doctorCardsContainer}>
            {getVisibleDoctors().map((doctor) => (
              <div key={doctor.id} className={styles.doctorCard}>
                <div className={styles.doctorImageContainer}>
                  <div
                    className={styles.doctorImage}
                    style={{
                      backgroundImage: `url(${getDoctorImage(doctor)})`,
                    }}
                  ></div>
                </div>
                <div className={styles.doctorInfo}>
                  <h3 className={styles.doctorName}>
                    {doctor.name ||
                      `${doctor.firstName || ""} ${doctor.lastName || ""}`}
                  </h3>
                  <p className={styles.doctorSpecialty}>
                    {doctor.specialty || doctor.Specialist}
                  </p>

                  {doctor.experience && (
                    <p className={styles.doctorExperience}>
                      Experience: {doctor.experience} Years
                    </p>
                  )}

                  {doctor.Fee && (
                    <p className={styles.doctorFee}>
                      Consultation Fee: Rs. {doctor.Fee}
                    </p>
                  )}

                  <button className={styles.appointmentButton}>
                    Book Appointment
                  </button>
                </div>
              </div>
            ))}
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
