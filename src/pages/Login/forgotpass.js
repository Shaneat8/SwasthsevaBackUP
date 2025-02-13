import React, { useState } from "react";
import sendPasswordResetEmail from "../../apicalls/forgot";
import { Button, Form, Input, message } from "antd";
import { Link } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import firestoredb from "../../firebaseConfig";
import { v4 as uuidv4 } from "uuid"; // For generating unique tokens
import { doc, setDoc } from "firebase/firestore";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");

  const handleForgotPassword = async () => {
    try {
      // Check if the user exists in Firestore
      const userQuery = query(
        collection(firestoredb, "users"),
        where("email", "==", email)
      );
      const querySnapshot = await getDocs(userQuery);

      // If no user is found, show an error
      if (querySnapshot.empty) {
        message.error("User not found!");
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userId = userDoc.id;

      const resetToken = uuidv4();
      const expiresAt = Date.now() + 3600000; // Token expires in 1 hour


      await setDoc(doc(firestoredb, "passwordResets", email), {
        token: resetToken,
        expiresAt,
        userId,
      });

      // Create the reset link
      //const resetLink = `http://localhost:3000/resetpass?token=${resetToken}`;
      const resetLink = `https://swasthyasevawovv.netlify.app/resetpass?token=${resetToken}`;

      // Send the password reset email
      await sendPasswordResetEmail(email, resetLink);
      message.success("Reset link sent! Please check your email.");
    } catch (error) {
      console.error("Error sending reset email:", error);
      message.error("Failed to send reset email. Please try again later.");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="bg-white p-3 w-400 shadow-lg rounded">
        <h2 className="text-center uppercase my-2">Forgot Password</h2>
        <hr />
        <br />
        <Form layout="vertical" onFinish={handleForgotPassword}>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, message: "Please enter your email!" }]}
          >
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Send Reset Link
            </Button>
          </Form.Item>
          <Link className="color" to="/login">
            <p>Back to Login</p>
          </Link>
        </Form>
      </div>
    </div>
  );
};

export default ForgotPassword;
