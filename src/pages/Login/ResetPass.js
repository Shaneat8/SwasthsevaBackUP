import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Form, Input, Button, message } from "antd";
import { collection, deleteDoc, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import firestoredb from "../../firebaseConfig";
import CryptoJS from "crypto-js";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userId, setUserId]=useState("");
  const navigate = useNavigate();
  const location=useLocation();
  // const token = localStorage.getItem("resetToken");
  // console.log("Token from local storage:", token);
  const token = new URLSearchParams(location.search).get("token");
  // console.log("Token from URL:", token);

//we used set token to fetch
useEffect(()=>{
const verifyToken = async()=>{
  if (!token) {
    message.error("Token is missing.");
    navigate("/login");
    return;
  }


  const user=query(collection(firestoredb,"passwordResets"),where("token","==",token));
  const userSnapshot=await getDocs(user);

  if (userSnapshot.empty) {
    message.error("Invalid or Expired Token");
    navigate("/login");
    return;
}

const resetPass = userSnapshot.docs[0].data(); // This line may throw an error if userSnapshot is empty
// console.log("Reset Pass Data:", resetPass); // Debugging line

// Check expiration logic
const currentTime = new Date().getTime();
  if(resetPass.expiresAt < currentTime)
  {
    message.error("Token has expired!");
    navigate("/login");
    return;
  }

  setUserId(resetPass.userId);
};

verifyToken();
},[token,navigate]);
    
const handleResetPassword=async()=>
{
    if(newPassword!==confirmPassword)
    {
        message.error("Passwords do not match!");
        return;
    }

    try {
        
        const userRef=doc(firestoredb,"users",userId);
        const encryptPassword=CryptoJS.AES.encrypt(newPassword,'project-ss').toString();

        await updateDoc(userRef,{
            password:encryptPassword
        });

        await deleteDoc(doc(firestoredb,"passwordResets",userId));

        message.success("Password updated successfully");
        navigate("/login");
    } catch (error) {
        message.error("Error updating password!");
    }
}


  return (
    <div className="flex justify-center items-center h-screen">
    <div className="bg-white p-3 w-400 shadow-lg rounded">
        <h2 className="text-center uppercase my-2">Reset Password</h2>
        <hr/><br/>
        <Form layout="vertical" onFinish={handleResetPassword}>
        <Form.Item label="New Password" required>
            <Input.Password
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            />
        </Form.Item>
        <Form.Item label="Confirm Password" required>
            <Input.Password
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            />
        </Form.Item>
        <Button type="primary" htmlType="submit">
            Update Password
        </Button>
        </Form>
        </div>
        </div>
  );
};

export default ResetPassword;
