import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Form, Input, Button, message } from "antd";
import { collection, deleteDoc, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import firestoredb from "../../firebaseConfig";
import CryptoJS from "crypto-js";
import styles from "./ResetPassword.module.css";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userId, setUserId] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const token = new URLSearchParams(location.search).get("token");

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        message.error("Token is missing.");
        navigate("/login");
        return;
      }

      const user = query(collection(firestoredb, "passwordResets"), where("token", "==", token));
      const userSnapshot = await getDocs(user);

      if (userSnapshot.empty) {
        message.error("Invalid or Expired Token");
        navigate("/login");
        return;
      }

      const resetPass = userSnapshot.docs[0].data();
      const currentTime = new Date().getTime();
      
      if (resetPass.expiresAt < currentTime) {
        message.error("Token has expired!");
        navigate("/login");
        return;
      }

      setUserId(resetPass.userId);
    };

    verifyToken();
  }, [token, navigate]);
    
  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      message.error("Passwords do not match!");
      return;
    }

    try {
      const userRef = doc(firestoredb, "users", userId);
      const encryptPassword = CryptoJS.AES.encrypt(newPassword, 'project-ss').toString();

      await updateDoc(userRef, {
        password: encryptPassword
      });

      await deleteDoc(doc(firestoredb, "passwordResets", userId));

      message.success("Password updated successfully");
      navigate("/login");
    } catch (error) {
      message.error("Error updating password!");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.part}>
        <div className={styles.left}>
          {/* Left side with illustration from background image */}
        </div>
        <div className={styles.right}>
          <div className={styles.formCard}>
            <h2 className={styles.heading}>SWASTHYA SEVA</h2>
            <h3>RESET PASSWORD</h3><br/>
            <Form 
              layout="vertical" 
              onFinish={handleResetPassword} 
              className={styles.form}
            >
              <Form.Item
                label={<span className={styles.label}>New Password</span>}
                name="newPassword"
                rules={[{ required: true, message: "Please enter your new password!" }]}
              >
                <Input.Password
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={styles.input}
                />
              </Form.Item>
              <Form.Item
                label={<span className={styles.label}>Confirm Password</span>}
                name="confirmPassword"
                rules={[
                  { required: true, message: "Please confirm your password!" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('The passwords do not match!'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={styles.input}
                />
              </Form.Item>
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  block 
                  className={styles.button}
                >
                  Update Password
                </Button>
              </Form.Item>
              <div className={styles.backToLogin}>
                <Link to="/login">Back to Login</Link>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;