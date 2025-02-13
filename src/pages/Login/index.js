import React, { useEffect } from "react";
import { Button, Form, Input, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { LoginUser } from "../../apicalls/users";
import { useDispatch } from "react-redux";
import { ShowLoader } from "../../redux/loaderSlice";
import { auth, googleProvider } from "../../firebaseConfig";
import { signInWithPopup } from "firebase/auth";
import { Divider } from 'antd';
import { FcGoogle } from "react-icons/fc";

function Login() {
  const nav=useNavigate();
  const dispatch=useDispatch();
  const onFinish=async(values)=>
  {
    try {
      dispatch(ShowLoader(true));
      const log1=await LoginUser(values);
      dispatch(ShowLoader(false));
      if(log1.success)
      {
        message.success(log1.message);
        localStorage.setItem("user",JSON.stringify({
          ...log1.data,
          password:"",
        }));
        nav("/"); 
      }
      
      else{
        throw new Error(log1.message);
      }
    } catch (error) {
      dispatch(ShowLoader(false));
      message.error(error.message);
    }
  };
  
  useEffect(()=>{
    const user=JSON.parse(localStorage.getItem('user'));
    if(user) nav("/");
  },[nav]);

  const handleGoogleSignIn = async () => {
    try {
      dispatch(ShowLoader(true));
      // Use signInWithRedirect 
      const result=await signInWithPopup(auth, googleProvider);
      const user=result.user;

      const GoogleLogin=await LoginUser({email:user.email},true);
      
      if(GoogleLogin.success)
      {
        message.success(GoogleLogin.message);
        localStorage.setItem("user",JSON.stringify({
          ...GoogleLogin.data,
          password:"",
        }));
        nav("/");
      }
      else{
        throw new Error(GoogleLogin.message);
      }
      dispatch(ShowLoader(false));
    } catch (error) {
      dispatch(ShowLoader(false));
      message.error(error.message);
      nav("/register");
    } 
  };



  return (
    <div className="flex justify-center items-center h-screen">
      <div className="bg-white p-3 w-400 shadow-lg rounded">
        <h2 className="text-center uppercase my-2">Swasthya Seva Login</h2><hr/><br/>
        <Form layout="vertical" onFinish={onFinish}> 
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, message: "Please enter your email!" }]}
          >
            <Input type="email" placeholder="Enter your email" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Please enter your password!" }]}
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
              Login
            </Button>
          </Form.Item>

          <Divider style={{ borderColor: '#d3d2d2' }}>OR</Divider>

          <button className="custom-google-button" onClick={handleGoogleSignIn}>
            <div className="custom-google-button-content">
              <FcGoogle className="custom-google-icon" />
              <span>Sign in with Google</span>
            </div>
          </button>

          <br/> 
          <div className="auth-links">
           <Link className="already" to="/register">
            Don't have an account? <strong>Register</strong>
           </Link>
            <Link className="forgot" to="/forgot">
            Forgot Password
          </Link>
          </div>
        </Form>
      </div>
    </div>
  );
}

export default Login;
