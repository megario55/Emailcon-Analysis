import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Login.css"; // Import the CSS file
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import apiConfig from "../apiconfig/apiConfig.js";
import logimg from "../Images/mail.png";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false); // Loading state

  // Check if the user is already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // If there's a token, redirect to the home page
      navigate("/home");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Start loading
    try {
      const res = await axios.post(`${apiConfig.baseURL}/api/auth/login`, {
        email,
        password,
      });
      console.log(res.data.user); // Check the structure of the user data
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/home");
    } catch (error) {
      toast.error(error.response.data || "Error logging in");
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  return (
    <div className="login-page">
      <div className="login-cover">
        <div className="login-aside">
          <img src={logimg} alt="Sample Excel Format" className="login-image" />
          <h2 style={{ fontWeight: "550", color: "#2f327d" }}>
            Welcome <span style={{ color: "#f48c06" }}>Back...!</span>
          </h2>
          <p
            style={{
              fontSize: "16px",
              lineHeight: "1.7",
              textAlign: "center",
              padding: "0px 50px",
              color: "black",
            }}
          >
            Here You go To Next Step, Your Login Here...!
          </p>
        </div>
        <div className="login-container">
          <h2 className="login-header" style={{ color: "#2f327d" }}>
            Log<span style={{ color: "#f48c06" }}>in</span>
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="labels">
              <label>Email</label>
            </div>
            <div className="input-container-login">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="login-input"
              />
            </div>
            <div className="labels">
              <label>Password</label>
            </div>
            <div className="input-container-login">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="login-input"
              />
            </div>
            <div className="log-btn">
              <button
                type="submit"
                className="login-button login-submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="loader-login"></span> // Spinner
                ) : (
                  "Login"
                )}
              </button>
            </div>
            <div className="log-sign">
              <button
                onClick={() => navigate("/signup")}
                className="logins-button"
              >
                Don't have an account?
                <span style={{ color: "#2f327d" }}>Signup</span>
              </button>
            </div>
          </form>
          <div className="log-sign">
            <button
              onClick={() => navigate("/admin-login")}
              className="login-button login-submit"
            >
              Way to Admin Login
            </button>
          </div>
        </div>
      </div>
      <ToastContainer
        className="custom-toast"
        position="bottom-center"
        autoClose={2000}
        hideProgressBar={true} // Disable progress bar
        closeOnClick={false}
        closeButton={false}
        pauseOnHover={true}
        draggable={true}
        theme="light" // Optional: Choose theme ('light', 'dark', 'colored')
      />
    </div>
  );
}

export default Login;
