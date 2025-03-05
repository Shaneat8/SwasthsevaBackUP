import React from "react";
import Footer from "./Design/Footer";
import Testimonials from "./Design/Testimonials";
import CTASection from "./Design/CTASection";
import DoctorCardSection from "./Design/DoctorCardSection";
import HeroSlider from "./Design/HeroSlider";


function Home() {
  const user = JSON.parse(localStorage.getItem("user"));


  return (
    user && (
      <>  
      <br/> <HeroSlider/><br/>
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
