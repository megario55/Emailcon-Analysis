import React from "react";
import Lookingimg from "../Images/hand-drawn-step-illustration.png";
import { useNavigate } from "react-router-dom";
import "../component/Campaign.css";

function Campaign() {
  const navigate = useNavigate(); // ✅ Correct usage

  const handleToggle = () => {
    navigate("/editor");
  };

  return (
    <div className="Mobile-page">
      <div className="app-container-mobile">
        <nav className="app-navbar">
          <p className="mobile-head">
            Camp<span style={{ color: "#f48c06" }}>aigns</span>
          </p>
        </nav>

        <div className="app-content">
          <img src={Lookingimg} alt="looking" style={{ width: "300px" }} />
          <p style={{ textAlign: "center" }}>
            Looking for creating your own campaigns! Experience it.
          </p>
        </div>

        <footer className="app-footer">
          <div className="half-circle"></div>
          <button className="foot-button" onClick={handleToggle}>
            +
          </button>
        </footer>
      </div>
    </div>
  );
}

export default Campaign;
