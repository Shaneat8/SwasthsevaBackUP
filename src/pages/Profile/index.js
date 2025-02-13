import React from "react";
import { Tabs } from "antd";
import Appointments from "./Appointments";
import Doctor from "../DoctorForm";
import UserForm from "./UserForm";
import { useLocation } from "react-router-dom";
import Records from "./records";

function Profile() {
  const user=JSON.parse(localStorage.getItem("user"));  
  const location=useLocation();
  const queryParams=new URLSearchParams(location.search);
  const tab=queryParams.get("tab");

  const key=tab==="appointments" ? "1": "2";

  const tabItems=[
    {
      key:"1",
      label:"Appointment",
      children:<Appointments />
    },
    {
      key:"2",
      label:"Profile",
      children: user.role === "doctor" ? <Doctor/> : <UserForm/>    
    },
    {
      key:"3",
      label:"Records",
      children: <Records/>
    }
  ]

  return <div>
    <Tabs defaultActiveKey={key} items={tabItems}/>
  </div>;
}

export default Profile;
