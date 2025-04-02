import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css"; // Import the CSS file
// import { AiFillMail } from "react-icons/ai";
// import { FaEnvelope, FaLock } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import adminimg from "../Images/signup-img.png";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email === "admin@emailcon.com" && password === "admin123") {
      // Set token in localStorage
      localStorage.setItem("adminToken", "secret_key");
      navigate("/admin-dashboard");
    } else {
      toast.success("Invalid admin credentials");
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-cover">
        <div className="admin-aside">
          {/* <AiFillMail style={{ color: "white", fontSize: "90px" }} /> */}
          <img
            src={adminimg}
            alt="Sample Excel Format"
            className="signup-image"
          />
          <h2 style={{ fontWeight: "550", color: "#2f327d" }}>
            Admin <span style={{ color: "#f48c06" }}> Access</span>
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
            View The Overall Access Content Here...
          </p>
        </div>
        <div className="admin-login-container">
          <h2
            className="admin-login-header"
            style={{ fontWeight: "550", color: "#2f327d" }}
          >
            Admin <span style={{ color: "#f48c06" }}>Login</span>
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="lab">
              <label>Email</label>
            </div>
            <div className="input-container">
              {/* <FaEnvelope className="input-icon" /> */}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="admin-login-input"
              />
            </div>
            <div className="lab">
              <label>Password</label>
            </div>
            <div className="input-container">
              {/* <FaLock className="input-icon" /> */}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="admin-login-input"
              />
            </div>
            <div className="Admin-submit">
              <button type="submit" className="admin-login-button">
                Login
              </button>
            </div>
          </form>
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
      />{" "}
    </div>
  );
}

export default AdminLogin;
