import React, { useEffect } from "react";
import { Button, Form, Input, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { LoginAsGuest, LoginUser } from "../../apicalls/users";
import { useDispatch } from "react-redux";
import { ShowLoader } from "../../redux/loaderSlice";
import { auth, googleProvider } from "../../firebaseConfig";
import { signInWithPopup } from "firebase/auth";
import { FcGoogle } from "react-icons/fc";
import styles from './Login.module.css';

function Login() {
  const nav = useNavigate();
  const dispatch = useDispatch();

  const handleGuestLogin = (e) => {
    e.preventDefault(); // Prevent default link behavior
    const response = LoginAsGuest();
    if (response.success) {
      nav('/'); // Navigate to home page
    }
  };

  const handleLoginSuccess = (userData) => {
    localStorage.setItem("user", JSON.stringify({
      ...userData,
      password: "",
    }));
    if (userData.role === "admin") {
      nav("/AdminView");
    } else {
      nav("/");
    }
  };

  const onFinish = async (values) => {
    try {
      dispatch(ShowLoader(true));
      const log1 = await LoginUser(values);
      dispatch(ShowLoader(false));
      if (log1.success) {
        message.success(log1.message);
        handleLoginSuccess(log1.data);
      } else {
        throw new Error(log1.message);
      }
    } catch (error) {
      dispatch(ShowLoader(false));
      message.error(error.message);
    }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      if (user.role === "admin") {
        nav("/AdminView");
      } else {
        nav("/");
      }
    }
  }, [nav]);

  const handleGoogleSignIn = async () => {
    try {
      dispatch(ShowLoader(true));
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const GoogleLogin = await LoginUser({ email: user.email }, true);

      if (GoogleLogin.success) {
        message.success(GoogleLogin.message);
        handleLoginSuccess(GoogleLogin.data);
      } else {
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
    <div className={styles.container}>
      <div className={styles.part}>
        <div className={styles.left}>
          {/* Background image will be handled by CSS */}
        </div>
        <div className={styles.right}>
          <div className={styles.formContainer}>
            <h2 className={styles.heading}><span className={styles.color1}>Swasthya</span> <span className={styles.color2}>Seva</span></h2>
            
            <Form layout="vertical" onFinish={onFinish} className={styles.loginForm}>
              <Form.Item
                label="Email or phone number"
                name="email"
                rules={[{ required: true, message: "Please enter your email!" }]}
              >
                <Input 
                  type="email" 
                  placeholder="Email or phone number"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                rules={[{ required: true, message: "Please enter your password!" }]}
              >
                <Input.Password 
                  placeholder="Enter password"
                  size="large"
                />
              </Form.Item>

              <div className={styles.linksContainer}>
                <div className={styles.guest} style={{color: '#2e2929'}}>
                  <Link onClick={handleGuestLogin}>Continue as Guest</Link>
                </div>
                <div className={styles.forgotPassword}>
                  <Link to="/forgot">Forgot password?</Link>
                </div>
              </div>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  block
                  size="large"
                  className={styles.loginButton}
                >
                  Login
                </Button>
              </Form.Item>

              <div className={styles.orSeparator}>
                <div className={styles.line}></div>
                <span className={styles.orText}>or</span>
                <div className={styles.line}></div>
              </div>

              <button 
                className={styles.googleBtn} 
                onClick={handleGoogleSignIn}
                type="button"
              >
                <FcGoogle className={styles.googleIcon} />
                <span>Sign in with Google</span>
              </button>

              <div className={styles.createAccount}>
                Don't have an account?{' '}
                <Link to="/register" className={styles.signupLink}>
                  Sign up now
                </Link>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;