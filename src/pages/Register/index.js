import React, { useEffect } from "react";
import { Button, Form, Input, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { CreateUser } from "../../apicalls/users";
import { useDispatch } from "react-redux";
import { ShowLoader } from "../../redux/loaderSlice";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebaseConfig";

function Register() {
  const nav=useNavigate();
  const dispatch=useDispatch();
  const onFinish=async(values)=>
  {
    // // console.log(values);
    await createUserWithEmailAndPassword(auth, values.email, values.password).catch((error) => {
      if (error.code === "auth/email-already-in-use") {
        console.log("This email is already registered. Please use a different email.");
      }
    });

    try {
      dispatch(ShowLoader(true));
      const response=await CreateUser({
        ...values,
        role : "user",
    });

      dispatch(ShowLoader(false));
      if(response.success)
      {
        message.success(response.message);
        nav("/login");
      }
      else{
        throw new Error(response.message);
      }
    } catch (error) {
      dispatch(ShowLoader(false));
      message.error(error.message);
    }
  }

  useEffect(()=>{
    const user=JSON.parse(localStorage.getItem('user'));
    if(user){ nav("/");}
  },[nav]);

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="bg-white p-3 w-400 shadow-lg rounded">
        <h2 className="text-center uppercase my-1">Swasthya Seva Register</h2><hr/><br/>
        <Form layout="vertical" onFinish={onFinish}>
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
            rules={[{ required: true, message: "Please enter your phone number!" },
              { pattern: /^[0-9]{10}$/, message: "Enter a valid phone number" },
            ]}
          >
            <Input placeholder="Enter your phone number" maxLength={10} />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Please enter your password!" },
            { min: 6, message: "Password must be at least 6 characters long" },]}
          >
            <Input.Password placeholder="Enter your password" />
          </Form.Item>
          
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="contained-button"
              block
            >
              Register
            </Button>
          </Form.Item>

          <Link className="already" to="/login">
            <p>Already have an account? <strong>Login</strong></p>
          </Link>
        </Form>
      </div>
    </div>
  );
}

export default Register;
