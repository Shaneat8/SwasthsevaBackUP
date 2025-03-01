import React, { useCallback, useEffect, useState } from "react";
import { Input, message, Button, Tabs, Rate } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import Fuse from "fuse.js";
import { useNavigate } from "react-router-dom";
import { GetAllDoctors } from "../../apicalls/doctors";
import { useDispatch } from "react-redux";
import { ShowLoader } from "../../redux/loaderSlice";
import { 
  SearchOutlined, 
  MedicineBoxOutlined, 
  ClockCircleOutlined,
  DollarOutlined,
  HeartOutlined,
  HeartFilled,
  StarOutlined,
  LoadingOutlined
} from "@ant-design/icons";
import "./doctor-list.css";

// Import your doctor images here
import doctor1 from "../Home/Design/doctor_image/placeholder-doctor1.png";
import doctor2 from "../Home/Design/doctor_image/placeholder-doctor2.png";
import doctor3 from "../Home/Design/doctor_image/placeholder-doctor3.png";
import doctor4 from "../Home/Design/doctor_image/placeholder-doctor4.png";
import doctor5 from "../Home/Design/doctor_image/placeholder-doctor5.png";

// Create an array to easily access the imported images
const doctorImages = [doctor1, doctor2, doctor3, doctor4, doctor5];

const { TabPane } = Tabs;

// Doctor Card Component
const DoctorCard = ({ doctor, onClick, toggleFavorite, isFavorite }) => {
  // Get doctor image
  const getDoctorImage = (doctor) => {
    const imageIndex = (doctor.imageIndex || doctor.id % 5) - 1;
    return doctorImages[imageIndex >= 0 && imageIndex < 5 ? imageIndex : 0];
  };

  // Get gradient color based on index
  const getGradientColor = (doctor) => {
    const gradients = [
      'linear-gradient(to bottom, rgba(232, 244, 248, 0) 0%, rgba(62, 198, 224, 0.2) 50%, rgba(62, 198, 224, 0.7) 100%)',  // Blue
      'linear-gradient(to bottom, rgba(249, 232, 232, 0) 0%, rgba(229, 115, 115, 0.2) 50%, rgba(229, 115, 115, 0.7) 100%)',  // Red
      'linear-gradient(to bottom, rgba(240, 248, 232, 0) 0%, rgba(181, 213, 106, 0.2) 50%, rgba(181, 213, 106, 0.7) 100%)',  // Green
      'linear-gradient(to bottom, rgba(232, 240, 248, 0) 0%, rgba(100, 181, 246, 0.2) 50%, rgba(100, 181, 246, 0.7) 100%)',  // Light blue
      'linear-gradient(to bottom, rgba(250, 240, 230, 0) 0%, rgba(255, 183, 77, 0.2) 50%, rgba(255, 183, 77, 0.7) 100%)'    // Orange
    ];
    
    const gradientIndex = doctor.gradientIndex || doctor.id % 5;
    return gradients[gradientIndex];
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    toggleFavorite(doctor.id);
  };

  return (
    <motion.div 
      className="doctor-card"
      whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
    >
      <div className="doctor-image-container" style={{ backgroundImage: `url(${doctor.profileImage || getDoctorImage(doctor)})` }}>
        <div className="doctor-gradient-overlay" style={{ background: getGradientColor(doctor) }}></div>
        <div className="favorite-btn" onClick={handleFavoriteClick}>
          {isFavorite ? 
            <HeartFilled className="favorite-icon active" /> : 
            <HeartOutlined className="favorite-icon" />
          }
        </div>
      </div>
      
      <div className="doctor-card-content">
        {/* Doctor name and rating on the same line */}
        <div className="doctor-name-rating">
          <h3 className="doctor-name">{doctor.firstName} {doctor.lastName}</h3>
          <div className="doctor-rating">
            <Rate disabled defaultValue={4.5}/>
            <span className="rating-count">(24)</span>
          </div>
        </div>
        
        {/* Two column grid with specialty and experience/fee */}
        <div className="doctor-details">
          {/* Specialty in first column */}
          <div className="doctor-detail doctor-specialty">
            <MedicineBoxOutlined className="detail-icon" />
            <span className="detail-value">{doctor.Specialist}</span>
          </div>
          
          {/* Experience in second column */}
          <div className="doctor-detail">
            <ClockCircleOutlined className="detail-icon" />
            <span className="detail-value">{doctor.experience} Years</span>
          </div>
          
          {/* Fee in second column, second row */}
          <div className="doctor-detail">
            <DollarOutlined className="detail-icon" />
            <span className="detail-value">Rs. {doctor.Fee}</span>
          </div>
        </div>
        
        <div className="doctor-card-footer">
          <Button type="primary" className="book-btn" block>Book Appointment</Button>
        </div>
      </div>
    </motion.div>
  );
};


// Specialty Filter Component
const SpecialtyFilter = ({ specialties, activeSpecialty, setActiveSpecialty }) => {
  return (
    <div className="specialty-filter">
      <motion.div 
        className="filter-scroll"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <motion.button
          className={`specialty-btn ${activeSpecialty === 'all' ? 'active' : ''}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveSpecialty('all')}
        >
          All Specialties
        </motion.button>
        
        {specialties.map((specialty, index) => (
          <motion.button
            key={specialty}
            className={`specialty-btn ${activeSpecialty === specialty ? 'active' : ''}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 + (index * 0.05) }}
            onClick={() => setActiveSpecialty(specialty)}
          >
            {specialty}
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
};

// Doctor List Component
const DoctorList = () => {
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("nearby");
  const [activeSpecialty, setActiveSpecialty] = useState("all");
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  // Extract unique specialties
  const specialties = [...new Set(doctors.map(doctor => doctor.Specialist))];

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favoriteDoctors');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Save favorites to localStorage when updated
  useEffect(() => {
    localStorage.setItem('favoriteDoctors', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (doctorId) => {
    setFavorites(prevFavorites => {
      if (prevFavorites.includes(doctorId)) {
        return prevFavorites.filter(id => id !== doctorId);
      } else {
        return [...prevFavorites, doctorId];
      }
    });
  };

  const getData = useCallback(async () => {
    try {
      setLoading(true);
      dispatch(ShowLoader(true));
      const response = await GetAllDoctors();
      dispatch(ShowLoader(false));
      if (response.success) {
        const approvedDoctors = response.data.filter(
          (doctor) => doctor.status === "approved"
        );
        
        // Add image and gradient indices to each doctor
        const doctorsWithImageIndex = approvedDoctors.map((doctor, index) => ({
          ...doctor,
          imageIndex: index % 5 + 1, // Assign a consistent image index (1-5)
          gradientIndex: index % 5   // Assign a consistent gradient index (0-4)
        }));
        
        setDoctors(doctorsWithImageIndex);
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error(error.message);
      dispatch(ShowLoader(false));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    getData();
  }, [getData]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Fuse.js configuration
  const fuseOptions = {
    keys: ["firstName", "lastName", "Specialist"],
    threshold: 0.3,
  };

  // Initialize Fuse.js with the doctors list
  const fuse = new Fuse(doctors, fuseOptions);

  // Filter doctors based on search and specialty
  let filteredDoctors = doctors;
  
  // First filter by specialty if not "all"
  if (activeSpecialty !== "all") {
    filteredDoctors = filteredDoctors.filter(
      doctor => doctor.Specialist === activeSpecialty
    );
  }
  
  // Then apply search term
  if (searchTerm) {
    const searchResults = fuse.search(searchTerm);
    filteredDoctors = searchResults.map(result => result.item);
    // Further filter by active specialty if not "all"
    if (activeSpecialty !== "all") {
      filteredDoctors = filteredDoctors.filter(
        doctor => doctor.Specialist === activeSpecialty
      );
    }
  }

  // Get favorite doctors
  const favoriteDoctors = doctors.filter(doctor => favorites.includes(doctor.id));

  return (
    user && (
      <div className="doctor-list-page">
        <div className="page-header">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="page-title"
          >
            Find Your Doctor
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="page-subtitle"
          >
            Book appointments with the best doctors in your area
          </motion.p>
        </div>
        
        <div className="search-container">
          <div className="search-wrapper">
            <Input
              prefix={<SearchOutlined className="search-icon" />}
              placeholder="Search by doctor name or specialty"
              allowClear
              size="large"
              className="search-input"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          
          {user?.role !== "doctor" && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                type="primary" 
                size="large"
                className="apply-btn"
                onClick={() => navigate("/doctor")}
              >
                Apply as Doctor
              </Button>
            </motion.div>
          )}
        </div>
        
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          className="doctor-tabs"
        >
          <TabPane 
            tab={
              <span>
                <StarOutlined /> Nearby Doctors
              </span>
            } 
            key="nearby"
          >
            <SpecialtyFilter 
              specialties={specialties} 
              activeSpecialty={activeSpecialty} 
              setActiveSpecialty={setActiveSpecialty} 
            />
            
            {loading ? (
              <div className="loading-container">
                <LoadingOutlined spin className="loading-icon" />
                <p>Loading doctors...</p>
              </div>
            ) : (
              <div className="doctors-grid">
                <AnimatePresence>
                  {filteredDoctors.length > 0 ? (
                    filteredDoctors.map((doctor) => (
                      <DoctorCard 
                        key={doctor.id}
                        doctor={doctor} 
                        onClick={() => navigate(`/book-appointment/${doctor.id}`)}
                        toggleFavorite={toggleFavorite}
                        isFavorite={favorites.includes(doctor.id)}
                      />
                    ))
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="no-results"
                    >
                      <div className="no-results-content">
                        <SearchOutlined className="no-results-icon" />
                        <h3>No doctors found</h3>
                        <p>Try adjusting your search or specialty filter</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </TabPane>
          
          <TabPane 
            tab={
              <span>
                <HeartOutlined /> Favorite Doctors
              </span>
            } 
            key="favorites"
          >
            <div className="doctors-grid">
              <AnimatePresence>
                {favoriteDoctors.length > 0 ? (
                  favoriteDoctors.map((doctor) => (
                    <DoctorCard 
                      key={doctor.id}
                      doctor={doctor} 
                      onClick={() => navigate(`/book-appointment/${doctor.id}`)}
                      toggleFavorite={toggleFavorite}
                      isFavorite={true}
                    />
                  ))
                ) : (
                  <div className="favorites-placeholder">
                    <HeartOutlined className="favorites-icon" />
                    <h3>Your Favorite Doctors</h3>
                    <p>Save your favorite doctors for quick access</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </TabPane>
        </Tabs>       
      </div>
    )
  );
};

export default DoctorList;