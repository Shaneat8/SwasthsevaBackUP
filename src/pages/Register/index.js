import React, { useEffect } from "react";
import { Button, Form, Input, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { CreateUser } from "../../apicalls/users";
import { useDispatch } from "react-redux";
import { ShowLoader } from "../../redux/loaderSlice";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import styles from './Register.module.css';

function Register() {
  const nav = useNavigate();
  const dispatch = useDispatch();
  
  const onFinish = async(values) => {
    try {
      dispatch(ShowLoader(true));
      
      // Create Firebase auth user
      await createUserWithEmailAndPassword(auth, values.email, values.password)
        .catch((error) => {
          if (error.code === "auth/email-already-in-use") {
            throw new Error("This email is already registered. Please use a different email.");
          }
          throw error;
        });

      // Create user in your database
      const response = await CreateUser({
        ...values,
        role: "user",
      });

      dispatch(ShowLoader(false));
      
      if(response.success) {
        message.success(response.message);
        nav("/login");
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      dispatch(ShowLoader(false));
      message.error(error.message);
    }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if(user) { 
      nav("/");
    }
  }, [nav]);

  return (
    <div className={styles.container}>
      <div className={styles.part}>
        <div className={styles.right}>
          {/* Background image will be handled by CSS */}
        </div>
        <div className={styles.left}>
          <div className={styles.formContainer}>
            <h2 className={styles.heading}>Swasthya Seva</h2>
            
            <Form layout="vertical" onFinish={onFinish} className={styles.registerForm}>
              <Form.Item
                label="Name"
                name="name"
                rules={[{ required: true, message: "Please enter your name!" }]}
              >
                <Input placeholder="Enter your name" />
              </Form.Item>

              <Form.Item
                label="Email"
                name="email"
                rules={[{ required: true, message: "Please enter your email!" }]}
              >
                <Input type="email" placeholder="Enter your email" />
              </Form.Item>

              <Form.Item
                label="Phone Number"
                name="phone"
                rules={[
                  { required: true, message: "Please enter your phone number!" },
                  { pattern: /^[0-9]{10}$/, message: "Enter a valid phone number" },
                ]}
              >
                <Input placeholder="Enter your phone number" maxLength={10} />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                rules={[
                  { required: true, message: "Please enter your password!" },
                  { min: 6, message: "Password must be at least 6 characters long" },
                ]}
              >
                <Input.Password placeholder="Enter your password" />
              </Form.Item>
              
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                >
                  Register
                </Button>
              </Form.Item>

              <div className={styles.alreadyAccount}>
                Already have an account?{' '}
                <Link to="/login" className="text-blue-500 hover:text-blue-600">
                  Login
                </Link>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;