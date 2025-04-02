import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Signup.css";
import { ToastContainer, toast } from "react-toastify";
import { FaInfoCircle } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";
import apiConfig from "../apiconfig/apiConfig.js";
import sign from "../Images/ex1.png";

function Signup() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [smtppassword, setSmtppassword] = useState("");
  const [authMethod, setAuthMethod] = useState("Hostinger");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Start loading

    try {
      const response = await axios.post(
        `${apiConfig.baseURL}/api/auth/signup`,
        {
          email,
          username,
          password,
          smtppassword,
        }
      );

      toast.success(response.data.message || "Account created successfully!");

      setTimeout(() => {
        navigate("/");
      }, 4000);
    } catch (error) {
      if (error.response) {
        const errorMessage = error.response.data.message || "Error signing up";

        if (error.response.status === 400) {
          if (errorMessage.includes("User already exists")) {
            toast.warning(
              "User already exists. Please use a different email or username."
            );
          } else {
            toast.error(errorMessage);
          }
        } else {
          toast.error(errorMessage);
        }
      } else {
        toast.error("Network error. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-cover">
        <div className="signup-aside">
          <img src={sign} alt="Sample signup img" className="signup-image" />
          <h2 style={{ fontWeight: "550", color: "#2f327d" }}>
            Welcome To <span style={{ color: "#f48c06" }}>Emailcon...!</span>
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
            Create your personalized template to strengthen our connection and
            enhance communication and engagement like never before.
          </p>
        </div>
        <div className="signup-container">
          <h2 className="signup-header">
            Sign<span style={{ color: "#f48c06" }}>up</span>
          </h2>
          <div>
            <div className="label">
              <label>Select Mail Service</label>
            </div>
            <select
              value={authMethod}
              onChange={(e) => setAuthMethod(e.target.value)}
              className="signup-dropdown"
            >
              <option value="Hostinger" className="options">
                Hostinger
              </option>
              <option value="Gmail" className="options">
                Gmail
              </option>
            </select>
          </div>
          <form onSubmit={handleSubmit} className="form-content">
            <div className="label">
              <label>Email</label>
            </div>
            <div className="input-container-sign">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="signup-input"
              />
            </div>
            <div className="label">
              <label>Username</label>
            </div>
            <div className="input-container-sign">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="signup-input"
              />
            </div>
            <div className="label">
              <label>User Password</label>
            </div>
            <div className="input-container-sign">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="signup-input"
              />
            </div>
            <div className="label">
              <label>
                {authMethod === "Gmail"
                  ? "SMTP App Passcode"
                  : "Hostinger Password"}
              </label>
              {authMethod === "Gmail" && (
                <FaInfoCircle
                  className="info-icon"
                  onClick={() => {
                    console.log("Info icon clicked!");
                    setIsModalOpen(true);
                  }}
                  style={{ cursor: "pointer", marginLeft: "5px" }}
                />
              )}
            </div>
            <div className="input-container">
              <input
                type="text"
                value={smtppassword}
                onChange={(e) => setSmtppassword(e.target.value)}
                required
                className="signup-input"
              />
            </div>
            <div className="sub-btn">
              <button
                type="submit"
                className="signup-button signup-submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="loader-signup"></span> // Spinner
                ) : (
                  "Sign in"
                )}
              </button>
            </div>
            <div className="sign-log">
              <button
                onClick={() => navigate("/")}
                className="signups-button signup-alt-button"
              >
                Already have an account?{" "}
                <span style={{ color: "#2f327d" }}>Login</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-container">
            <h3>Steps to Get Gmail SMTP App Passcode</h3>
            <ol>
              <li>Go to your Google Account Security Settings.</li>
              <li>Enable 2-Step Verification.</li>
              <li>Navigate to "App Passwords" section.</li>
              <li>
                Generate a new app password for "Mail" and select your device.
              </li>
              <li>
                Copy and use the generated passcode in the SMTP App Passcode
                field.
              </li>
              <li>
                Sample 16 digit App Passcode is{" "}
                <strong>deyq kjki kvii olua.</strong>
              </li>
            </ol>
            <button
              onClick={() => setIsModalOpen(false)}
              className="modal-close-button"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <ToastContainer
        className="custom-toast"
        position="bottom-center"
        autoClose={3000}
        hideProgressBar={true}
        closeOnClick={false}
        closeButton={false}
        pauseOnHover={true}
        draggable={true}
        theme="light"
      />
    </div>
  );
}

export default Signup;
