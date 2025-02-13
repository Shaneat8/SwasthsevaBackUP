import { BrowserRouter, Routes, Route,Navigate } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Home from "./pages/Home";
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./pages/Profile";
import Spinner from "./components/Spinner";
import { useSelector } from "react-redux";
import Doctor from "./pages/DoctorForm";
import ForgotPassword from "./pages/Login/forgotpass";
import ResetPassword from "./pages/Login/ResetPass";
import Admin from "./pages/Admin";
import BookAppointment from "./pages/BookAppointment";
import Prescription from "./pages/DoctorForm/Prescription";
import RescheduleResponse from "./pages/Profile/RescheduleResponse.js";


function App() {
  const {loading}=useSelector((state)=>state.loader);
  const user = JSON.parse(localStorage.getItem("user"));
  return (
    <div>
      {loading && <Spinner/>}
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>}/>
          <Route path="/book-appointment/:id" element={<ProtectedRoute><BookAppointment/></ProtectedRoute>}/>
          <Route path="/profile" element={<ProtectedRoute><Profile/></ProtectedRoute>} />
          <Route path="/doctor" element={<ProtectedRoute><Doctor/></ProtectedRoute>}/>
          <Route path="/forgot" element={<ForgotPassword/>}/>
          <Route path="/resetpass" element={<ResetPassword/>}/>
          <Route path="/admin" element={<ProtectedRoute><Admin/></ProtectedRoute>}/>
          <Route path="/patient/:patientId" element={<ProtectedRoute><Prescription/></ProtectedRoute>}/>          
          <Route path="/respond-reschedule/:id/:response" element={<RescheduleRespone />} />
          <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
