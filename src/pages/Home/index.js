import React from "react";
import Footer from "./Design/Footer";
import Testimonials from "./Design/Testimonials";
import CTASection from "./Design/CTASection";
import DoctorCardSection from "./Design/DoctorCardSection";
import LabTestSection from "./Design/LabTestSection";
import HeroSlider from "./Slider/Slider";


function Home() {

  return (
    <>
   
    
    {/* Existing ones */}
      <HeroSlider/>
      <DoctorCardSection/>
      <LabTestSection/>
      <CTASection/>
      <Testimonials/>
      <Footer/>
    </>
  );
}

export default Home;