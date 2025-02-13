import React from "react";
import { useNavigate,Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const nav = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null"); // Ensure user is defined

  console.log("User:", user);

  // Immediately redirect to login if user is not logged in
  if (!user) {
    console.log("Redirecting to login");
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="layout p-1">
      <div className="header bg-white p-2 flex justify-between items-center">
        <h2 className="cursor-pointer" onClick={()=>nav("/")}>
        <strong className="text-primary">Swasthya</strong>
        <strong className="text-secondary">{" "}Seva</strong></h2>
        
        {user && (
        <div className="flex gap-3 items-center">
            <div className="flex gap-1 items-center">
                <i className="ri-shield-user-fill cursor-pointer" onClick={()=>nav("/profile")}></i> 
                <h4 className="uppercase cursor-pointer underline" onClick={()=>{
                  if(user.role === "admin")
                  {  nav("/admin")
                  }
                  else{
                    nav("/profile");
                }}}>{user.name}</h4>
            </div>
            <i className="ri-logout-box-r-line cursor-pointer" onClick={()=>{
                localStorage.removeItem("user");
                nav("/login");}}></i>
        </div>
        )}
      </div>
      <div className="content my-1">{children}</div>
    </div>
  );
}

export default ProtectedRoute;
