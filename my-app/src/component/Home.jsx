import React, { useState, useEffect, useRef } from "react";
import {
  FaFileAlt,
  FaHistory,
  FaUserPlus,
  FaEye,
  FaUser,
} from "react-icons/fa";
import "./Home.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import apiConfig from "../apiconfig/apiConfig.js";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SendbulkModal from "./SendbulkModal.jsx";
import GroupfileModal from "./GroupfileModal";
import GroupModalnew from "./GroupModalnew.jsx";
import ListPage from "./ListPage.jsx";
import { FaRegClipboard, FaTimes } from "react-icons/fa";
import { FaSignOutAlt } from "react-icons/fa";
import { FaAddressBook } from "react-icons/fa";
import { FaUserCircle } from "react-icons/fa";
import { MdWavingHand } from "react-icons/md";
import imghome from "../Images/home-sidebar.jpg";
import welcomeimg from "../Images/welcome.png";

const Home = () => {
  const [view, setView] = useState("main");
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showCampaignModalTem, setShowCampaignModalTem] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [showfileGroupModal, setShowfileGroupModal] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [showListPageModal, setShowListPageModal] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [showtemModal, setShowtemModal] = useState(false);
  const [selectedTemplatepre, setSelectedTemplatepre] = useState(null);
  const [bgColortem, setBgColortem] = useState("ffffff");
  const [previewContenttem, setPreviewContenttem] = useState([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const dropdownRef = useRef(null);

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };
  useEffect(() => {
    const fetchtemplate = async () => {
      if (!user) {
        navigate("/"); // Redirect to login if user is not found
        return;
      }

      try {
        const res = await axios.get(
          `${apiConfig.baseURL}/api/stud/templates/${user.id}`
        );
        setTemplates(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch templates");
      }
    };

    fetchtemplate();
  }, [user, navigate]); // Ensure useEffect is dependent on `user` and `navigate`

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      window.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  useEffect(() => {
    if (!user) {
      navigate("/signup");
      toast.warning("Signup first to access Homepage");
    } else {
      const modalShown = localStorage.getItem("modalShown");
      if (!modalShown) {
        setShowPopup(true); // Show modal on first navigation
        localStorage.setItem("modalShown", "true"); // Mark modal as shown
      }
    }
  }, [user, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("modalShown"); // Reset modalShown for next login
    localStorage.setItem("hasvisit", true);
    navigate("/");
  };

  const closePopup = () => {
    setShowPopup(false); // Close the modal
  };
  const handleMainView = () => {
    setView("main");
  };

  const handleCampaignView = () => {
    setView("campaign");
  };

  const handleContactView = () => {
    setView("contact");
  };
  const handleCreateContactView = () => {
    setView("create-contact");
  };
  const handlePreview = (template) => {
    setShowtemModal(false);
    setIsPreviewOpen(true);
    setSelectedTemplatepre(template);
    setBgColortem(template.bgColor || "#ffffff"); // Update background color
    setPreviewContenttem(template.previewContent || []); // Update previewContent
  };

  const handleCloseModalpre = () => {
    setIsPreviewOpen(false);
    setShowtemModal(true);
  };
  const handleprevcampaignname = () => {
    setShowCampaignModalTem(true);
  };

  const handleopentem = () => {
    setShowtemModal(true);
  };
  const handletemclose = () => {
    setShowtemModal(false);
  };

  const handleCreateCampaign = () => {
    setShowCampaignModal(true);
  };

  const handleviewcontacts = () => {
    setShowListPageModal(true);
  };

  const handleaddfilecontacts = () => {
    setShowfileGroupModal(true);
  };

  const handleCreateButton = () => {
    if (!user || !user.id) {
      toast.error("Please ensure the user is valid");
      return;
    }
    if (!campaignName) {
      toast.error("Please enter a campaign name");
      return;
    }

    setIsLoading(true);

    axios
      .post(`${apiConfig.baseURL}/api/stud/campaign`, {
        camname: campaignName, // Ensure the field matches backend
        userId: user.id,
      })
      .then((response) => {
        localStorage.setItem(
          "campaign",
          JSON.stringify(response.data.campaign)
        );
        console.log("Campaign created successfully");

        setIsLoading(false);
        setShowCampaignModal(false);
        setCampaignName("");

        if (window.innerWidth <= 768) {
          navigate("/campaign"); // Mobile
        } else {
          navigate("/editor"); // PC
        }
      })
      .catch((error) => {
        setIsLoading(false);
        console.error("Error:", error);

        // Dismiss previous toasts before showing a new one
        toast.dismiss();

        if (
          error.response &&
          error.response.data &&
          error.response.data.message
        ) {
          toast.warning(error.response.data.message, { autoClose: 3000 });
        } else {
          toast.error("Failed to create campaign", { autoClose: 3000 });
        }
      });
  };
  const handleCreateTemButton = () => {
    if (!user || !user.id) {
      toast.error("Please ensure the user is valid");
      return;
    }
    if (!campaignName) {
      toast.error("Please enter a campaign name");
      return;
    }

    setIsLoading(true);

    axios
      .post(`${apiConfig.baseURL}/api/stud/campaign`, {
        camname: campaignName, // Ensure the field matches backend
        userId: user.id,
      })
      .then((response) => {
        localStorage.setItem(
          "campaign",
          JSON.stringify(response.data.campaign)
        );
        console.log("Campaign created successfully");

        setIsLoading(false);
        setShowCampaignModal(false);
        setCampaignName("");

        if (window.innerWidth <= 768) {
          navigate("/campaign"); // Mobile
        } else {
          navigate("/TemMainpage", {
            state: { previewContenttem, bgColortem },
          }); // PC
        }
      })
      .catch((error) => {
        setIsLoading(false);
        console.error("Error:", error);

        // Dismiss previous toasts before showing a new one
        toast.dismiss();

        if (
          error.response &&
          error.response.data &&
          error.response.data.message
        ) {
          toast.warning(error.response.data.message, { autoClose: 3000 });
        } else {
          toast.error("Failed to create campaign", { autoClose: 3000 });
        }
      });
  };
  const handlecampaignhistory = () => {
    navigate("/campaigntable");
  };

  return (
    <>
      <div className="sidebar-container">
        {/* Sidebar */}
        <div className="sidebar">
          <div>
            <h2 className="sidebar-title" onClick={handleMainView}>
              Email<span style={{ color: "#f48c06" }}>Con</span>
            </h2>
            <button
              className="sidebar-button campaign-button"
              onClick={handleCampaignView}
            >
              Campaign
            </button>
            <button
              className="sidebar-button contact-button"
              onClick={handleContactView}
            >
              Contact
            </button>
            <button
              className="sidebar-button contact-button"
              onClick={handleopentem}
            >
              Templates
            </button>
          </div>
          <div className="side-img">
            <img src={imghome} alt="Home img" className="home-image" />
          </div>
        </div>

        {/* Main Content */}

        <div className="main-content">
          <nav className="navbars">
            <div className="desktop-content">
              <h2 className="sidebar-title" onClick={handleMainView}>
                Email<span style={{ color: "#f48c06" }}>Con</span>
              </h2>
            </div>
            <div className="nav-split">
              <h4>
                <span
                  style={{
                    transform: "scaleX(-1)",
                    display: "inline-block",
                    color: "gold",
                    marginRight: "5px",
                  }}
                >
                  <MdWavingHand size={17} />
                </span>{" "}
                Hey{" "}
                <span style={{ color: "#f48c06" }}>
                  {user?.username || "Guest"}
                </span>
              </h4>

              <div className="profile-container" ref={dropdownRef}>
                <button onClick={toggleDropdown} className="profile-button">
                  <FaUserCircle className="profile-icon" />
                </button>
                {dropdownOpen && (
                  <div className="dropdown-menu">
                    <button onClick={handleLogout} className="dropdown-item">
                      <span>Logout </span>
                      <span>
                        <FaSignOutAlt color="#f48c06" fontSize="15px" />
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </nav>
          <div className="maincontent-main">
            {view === "main" && (
              <div className="card-grid">
                <div className="cards" onClick={handleCampaignView}>
                  <FaRegClipboard className="icons campaign-icon" />
                  <span className="card-texts">Campaign</span>
                </div>
                <div className="cards" onClick={handleContactView}>
                  <FaAddressBook className="icons contact-icon" />
                  <span className="card-texts">Contact</span>
                </div>
              </div>
            )}

            {view === "campaign" && (
              <div className="card-grid">
                <div className="cards" onClick={handleCreateCampaign}>
                  <FaFileAlt className="icons campaign-create-icon" />
                  <span className="card-texts">Create Campaign</span>
                </div>
                <div className="cards" onClick={handlecampaignhistory}>
                  <FaHistory className="icons campaign-history-icon" />
                  <span className="card-texts">Campaign History</span>
                </div>
              </div>
            )}

            {view === "contact" && (
              <div className="card-grid">
                <div className="cards" onClick={handleCreateContactView}>
                  <FaUserPlus className="icons contact-create-icon" />
                  <span className="card-texts">Create Contact</span>
                </div>
                <div className="cards" onClick={handleviewcontacts}>
                  <FaEye className="icons contact-view-icon" />
                  <span className="card-texts">View Contact </span>
                </div>
              </div>
            )}
            {view === "create-contact" && (
              <div className="card-grid">
                <div
                  className="cards"
                  onClick={() => {
                    setShowNewGroupModal((prev) => !prev); // Toggle state
                  }}
                >
                  <FaUserPlus className="icons contact-create-icon" />
                  <span className="card-texts">New Group</span>
                </div>
                <div className="cards" onClick={handleaddfilecontacts}>
                  <FaUser className="icons contact-view-icon" />
                  <span className="card-texts">Existing Group</span>
                </div>
              </div>
            )}
          </div>

          {/* Show group existing modal    */}
          {showfileGroupModal && (
            <GroupfileModal onClose={() => setShowfileGroupModal(false)} />
          )}
          {/* Show new group modal    */}
          {showNewGroupModal && (
            <GroupModalnew onClose={() => setShowNewGroupModal(false)} />
          )}
          {/* show group list */}
          {showListPageModal && (
            <ListPage onClose={() => setShowListPageModal(false)} />
          )}
          {/* welcome popup */}
          {showPopup && (
            <div className="home-overlay overlay">
              <div className="home-modal">
                <div className="confetti-wrapper">
                  {[...Array(30)].map((_, index) => (
                    <div key={index} className="confetti"></div>
                  ))}
                </div>
                <button className="welcome-close-button" onClick={closePopup}>
                  <FaTimes className="text-red-500 cursor-pointer" />
                </button>
                <img
                  src={welcomeimg}
                  alt="Celebration"
                  className="celebration-icon"
                />
                <h2>Welcome {user.username}!</h2>
                <p>Explore the features and manage your groups efficiently.</p>
                <button className="welcome-button" onClick={closePopup}>
                  Let's go!
                </button>
              </div>
            </div>
          )}
          {/* Modal for Email Details */}
          {showtemModal && (
            <div className="modal-overlay-tem">
              <div className="modal-content-tem">
                <h2>Saved Templates</h2>
                <button className="close-button-tem" onClick={handletemclose}>
                  x
                </button>
                <ol>
                  {templates.length > 0 ? (
                    templates.map((template) => (
                      <li
                        key={template._id}
                        onClick={() => handlePreview(template)}
                      >
                        {template.temname}
                      </li>
                    ))
                  ) : (
                    <p>No templates found</p>
                  )}
                </ol>
              </div>
            </div>
          )}

          {isPreviewOpen && (
            <div className="preview-modal-overlay-tem">
              <div className="preview-modal-content-tem">
                {selectedTemplatepre && (
                  <h3 className="temname">
                    {selectedTemplatepre.temname} Preview
                  </h3>
                )}
                <button
                  className="close-modal-read-pre"
                  onClick={handleCloseModalpre}
                >
                  x
                </button>
                <div>
                  <div
                    style={{
                      backgroundColor: bgColortem,
                      borderRadius: "10px",
                      pointerEvents: "none",
                    }}
                  >
                    {previewContenttem.map((item, index) => {
                      if (!item || !item.type) return null;
                      return (
                        <div
                          className="content-item-preview"
                          style={item.style}
                          key={index}
                        >
                          {item.type === "para" && (
                            <>
                              <p
                                className="border"
                                style={item.style}
                                dangerouslySetInnerHTML={{
                                  __html: item.content,
                                }} // Render HTML content here
                              />
                            </>
                          )}

                          {item.type === "multi-image" ? (
                            <div className="Layout-img">
                              <div className="Layout">
                                <img
                                  src={
                                    item.src1 ||
                                    "https://via.placeholder.com/200"
                                  }
                                  alt="Editable"
                                  className="multiimg"
                                  title="Upload Image"
                                  style={item.style}
                                />
                                <a
                                  href={item.link1}
                                  target="_blank"
                                  className="button-preview"
                                  rel="noopener noreferrer"
                                  style={item.buttonStyle1}
                                >
                                  {item.content1}
                                </a>
                              </div>

                              <div className="Layout">
                                <img
                                  src={
                                    item.src2 ||
                                    "https://via.placeholder.com/200"
                                  }
                                  alt="Editable"
                                  className="multiimg"
                                  title="Upload Image"
                                  style={item.style}
                                />
                                <a
                                  href={item.link2}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="button-preview"
                                  style={item.buttonStyle2}
                                >
                                  {item.content2}
                                </a>
                              </div>
                            </div>
                          ) : null}

                          {item.type === "video-icon" ? (
                            <div className="video-icon">
                              <img
                                src={
                                  item.src1 || "https://via.placeholder.com/200"
                                }
                                alt="Editable"
                                className="videoimg"
                                title="Upload Thumbnail Image"
                                style={item.style}
                              />
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <img
                                  src={item.src2}
                                  className="video-btn"
                                  alt="icon"
                                />
                              </a>
                            </div>
                          ) : null}

                          {item.type === "cardimage" ? (
                            <div
                              className="card-image-container"
                              style={item.style1}
                            >
                              <img
                                src={
                                  item.src1 || "https://via.placeholder.com/200"
                                }
                                style={item.style}
                                alt="Editable"
                                className="card-image"
                                title="Upload Image"
                              />
                              <p
                                className="card-text"
                                style={item.style}
                                dangerouslySetInnerHTML={{
                                  __html: item.content1,
                                }}
                              />
                            </div>
                          ) : null}

                          {item.type === "head" && (
                            <div>
                              <p className="border" style={item.style}>
                                {item.content}
                              </p>
                            </div>
                          )}

                          {item.type === "link-image" && (
                            <div className="border">
                              <a href={item.link || "#"}>
                                <img
                                  src={
                                    item.src ||
                                    "https://via.placeholder.com/200"
                                  }
                                  alt="Editable"
                                  className="img"
                                  style={item.style}
                                />
                              </a>
                            </div>
                          )}
                          {item.type === "image" && (
                            <div className="border">
                              <img
                                src={
                                  item.src || "https://via.placeholder.com/200"
                                }
                                alt="Editable"
                                className="img"
                                style={item.style}
                              />
                            </div>
                          )}

                          {item.type === "icons" && (
                            <div
                              className="border-icons"
                              style={item.ContentStyle}
                              key={index}
                            >
                              <div className="icon-containers">
                                <a
                                  href={item.links1 || "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <img
                                    src={item.iconsrc1}
                                    alt="Facebook"
                                    className="icon"
                                    style={item.style1}
                                  />
                                </a>

                                <a
                                  href={item.links2 || "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <img
                                    src={item.iconsrc2}
                                    alt="Twitter"
                                    className="icon"
                                    rel="noopener noreferrer"
                                    style={item.style2}
                                  />
                                </a>

                                <a
                                  href={item.links3 || "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <img
                                    src={item.iconsrc3}
                                    alt="Instagram"
                                    className="icon"
                                    style={item.style3}
                                  />
                                </a>

                                <a
                                  href={item.links4 || "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <img
                                    src={item.iconsrc4}
                                    alt="Youtube"
                                    className="icon"
                                    style={item.style4}
                                  />
                                </a>
                              </div>
                            </div>
                          )}

                          {item.type === "imagewithtext" ? (
                            <div className="image-text-container">
                              <div
                                className="image-text-wrapper"
                                style={item.style1}
                              >
                                <img
                                  src={
                                    item.src1 ||
                                    "https://via.placeholder.com/200"
                                  }
                                  alt="Editable"
                                  className="image-item"
                                  title="Upload Image"
                                />
                                <p
                                  className="text-item"
                                  style={item.style}
                                  dangerouslySetInnerHTML={{
                                    __html: item.content1,
                                  }}
                                />
                              </div>
                            </div>
                          ) : null}

                          {item.type === "multipleimage" ? (
                            <div className="Layout-img">
                              <div className="Layout">
                                <img
                                  src={
                                    item.src1 ||
                                    "https://via.placeholder.com/200"
                                  }
                                  alt="Editable"
                                  className="multiple-img"
                                  title="Upload Image"
                                  style={item.style}
                                />
                              </div>

                              <div className="Layout">
                                <img
                                  src={
                                    item.src2 ||
                                    "https://via.placeholder.com/200"
                                  }
                                  alt="Editable"
                                  className="multiple-img"
                                  title="Upload Image"
                                  style={item.style}
                                />
                              </div>
                            </div>
                          ) : null}

                          {item.type === "textwithimage" ? (
                            <div className="image-text-container">
                              <div
                                className="image-text-wrapper"
                                style={item.style}
                              >
                                <p
                                  className="text-item"
                                  style={item.style}
                                  dangerouslySetInnerHTML={{
                                    __html: item.content2,
                                  }}
                                />
                                <img
                                  src={
                                    item.src2 ||
                                    "https://via.placeholder.com/200"
                                  }
                                  alt="Editable"
                                  className="image-item"
                                  title="Upload Image"
                                />
                              </div>
                            </div>
                          ) : null}

                          {item.type === "logo" && (
                            <div className="border">
                              <img
                                src={
                                  item.src || "https://via.placeholder.com/200"
                                }
                                alt="Editable"
                                className="logo"
                                style={item.style}
                              />
                            </div>
                          )}
                          {item.type === "button" && (
                            <div className="border-btn">
                              <a
                                href={item.link || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={item.style}
                                className="button-preview"
                              >
                                {item.content}
                              </a>
                            </div>
                          )}
                          {item.type === "link" && (
                            <div className="border-btn">
                              <a href={item.href || "#"} style={item.style}>
                                {item.content}
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="prev-select-btn">
                  <button
                    onClick={handleprevcampaignname}
                    className="preview-create-button"
                  >
                    Select
                  </button>
                  <button
                    onClick={() => setIsPreviewOpen(false)}
                    className="preview-create-button"
                    style={{ backgroundColor: "#f48c06" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal for Creating Campaign */}
          {showCampaignModal && (
            <div className="campaign-modal-overlay">
              <div className="campaign-modal-content">
                <h3>Create Campaign</h3>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Enter Campaign Name Max 15 letter"
                  className="modal-input"
                  maxLength={15}
                />
                <button
                  className="modal-create-button"
                  onClick={handleCreateButton}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="loader-create"></span> // Spinner
                  ) : (
                    "Create"
                  )}{" "}
                </button>
                <button
                  onClick={() => setShowCampaignModal(false)}
                  className="modal-create-button-cancel-modal"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {/* Modal for Creating Campaign */}
          {showCampaignModalTem && (
            <div className="campaign-modal-overlay">
              <div className="campaign-modal-content">
                <h3>Create Campaign </h3>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Enter Campaign Name Max 15 letter"
                  className="modal-input"
                  maxLength={15}
                />
                <button
                  className="modal-create-button"
                  onClick={handleCreateTemButton}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="loader-create"></span> // Spinner
                  ) : (
                    "Create"
                  )}{" "}
                </button>
                <button
                  onClick={() => setShowCampaignModalTem(false)}
                  className="modal-create-button-cancel-modal"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          <SendbulkModal campaignName={campaignName} />
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
      </div>
      <div className="dwn-menu">
        <div className="mobile-menu">
          <button
            className="sidebar-button campaign-button"
            onClick={handleCampaignView}
          >
            Campaign
          </button>
          <button
            className="sidebar-button contact-button"
            onClick={handleContactView}
          >
            Contact
          </button>
          <button
            className="sidebar-button contact-button"
            onClick={handleContactView}
          >
            Templates
          </button>
        </div>
      </div>
    </>
  );
};

export default Home;
