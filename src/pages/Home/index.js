import React, { useCallback, useEffect, useState } from "react";
import { Button, Col, Input, message, Row } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ShowLoader } from "../../redux/loaderSlice";
import { GetAllDoctors } from "../../apicalls/doctors";
import Fuse from "fuse.js"; 
import Footer from "./Design/Footer";
import Testimonials from "./Design/Testimonials";
import CTASection from "./Design/CTASection";
import DoctorCardSection from "./Design/DoctorCardSection";


function Home() {
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const dispatch = useDispatch();
  const user = JSON.parse(localStorage.getItem("user"));

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

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Fuse.js configuration
  const fuseOptions = {
    keys: ["firstName", "lastName", "Specialist"], // Fields to search in
    threshold: 0.3, // Adjust for more/less strict matching
  };

  // Initialize Fuse.js with the doctors list
  const fuse = new Fuse(doctors, fuseOptions);

  // Filter doctors based on search term using Fuse.js
  const filteredDoctors = searchTerm
    ? fuse.search(searchTerm).map((result) => result.item)
    : doctors;

  const nav = useNavigate();
  return (
    user && (
      <>  
      <div>

        <div className="flex justify-between">
          <div className="flex">
            <Input
              placeholder="Search Doctor by Name or Speciality"
              allowClear
              suffix={<SearchOutlined />}
              className="h-1 w-350 search-input"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          {user?.role !== "doctor" && (
            <Button className="h-1 p-2" onClick={() => nav("/doctor")}>
              Apply Doctor
            </Button>
          )}
        </div>

        <Row gutter={[16, 16]} className="my-1">
          {filteredDoctors.length > 0 ? (
            filteredDoctors.map((doctor) => (
              <Col span={8} key={doctor.id}>
                <div
                  className="bg-white p-1 flex flex-column gap-1 cursor-pointer"
                  onClick={() => nav(`/book-appointment/${doctor.id}`)}
                >
                  <div className="flex justify-between w-full uppercase">
                    <h2>
                      {doctor.firstName} {doctor.lastName}
                    </h2>
                  </div>
                  <hr />
                  <div className="flex justify-between w-full">
                    <h4>Speciality :</h4>
                    <h4>{doctor.Specialist}</h4>
                  </div>

                  <div className="flex justify-between w-full">
                    <h4>Experience :</h4>
                    <h4>{doctor.experience} Years</h4>
                  </div>

                  <div className="flex justify-between w-full">
                    <h4>Email :</h4>
                    <h4>{doctor.email}</h4>
                  </div>

                  <div className="flex justify-between w-full">
                    <h4>Phone :</h4>
                    <h4>{doctor.phone}</h4>
                  </div>

                  <div className="flex justify-between w-full">
                    <h4>Fees :</h4>
                    <h4>Rs. {doctor.Fee}</h4>
                  </div>
                </div>
              </Col>
            ))
          ) : (
            <Col span={24}>
              <div className="text-center">
                <h3>No doctors found. Try a different search term.</h3>
              </div>
            </Col>
          )}
        </Row>
      </div>
      <DoctorCardSection/>
      <br/><br/>
      <CTASection/>
      <br/><br/>
      <Testimonials/>
      <br/><br/>
      <Footer/>    
      </>
    ) 
  );
}


export default Home;
