import React, { useEffect, useState } from "react";
import axios from "axios";
import "./CampaignTable.css";
import { FaArrowLeft, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import apiConfig from "../apiconfig/apiConfig";

function RemainderTable() {
  const [campaigns, setCampaigns] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [failedEmails, setFailedEmails] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTime, setNewTime] = useState({});
    const [activeCampaignId, setActiveCampaignId] = useState(null); // Track the active campaign's modal
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  
 
  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!user) {
        navigate("/");
        return;
      }

      try {
        const res = await axios.get(
          `${apiConfig.baseURL}/api/stud/campaigns/${user.id}`
        );
        setCampaigns(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch campaigns");
      }
    };
    fetchCampaigns();
  }, [user, navigate]);

  const handleBackCampaign = () => {
    navigate("/home");
  };

  const handleViewFailedEmails = (emails) => {
    setFailedEmails(emails);
    setShowModal(true);
  };
  const handleview = (userId, campaignId) => {
    navigate(`/readreportremainder/${userId}/${campaignId}`);
  };
   const handleOpenModal = (campaignId, scheduledTime) => {
      console.log(
        "Opening modal for campaign:",
        campaignId,
        "Scheduled Time:",
        scheduledTime
      );
      setNewTime((prev) => ({ ...prev, [campaignId]: scheduledTime || "" })); // Ensure campaign-specific time
      setActiveCampaignId(campaignId); // Track the active campaign's modal
      setIsModalOpen(true); // Open the modal
    };
  
    const handleTimeChange = (e, campaignId) => {
        const selectedTime = e.target.value; // "HH:MM"
        console.log("Selected Time:", selectedTime, campaignId);
        setNewTime((prev) => ({ ...prev, [campaignId]: selectedTime }));
      };
      
      const handleSaveTime = async () => {
        const timeOnly = newTime[activeCampaignId];
        if (!timeOnly) {
          toast.error("Please select a valid time");
          return;
        }
      
        try {
          // Get original campaign
          const originalCampaign = campaigns.find(c => c._id === activeCampaignId);
          const originalDate = new Date(originalCampaign.scheduledTime);
      
          // Extract hours and minutes from selected time
          const [hours, minutes] = timeOnly.split(":").map(Number);
      
          // Create new Date with same date but updated time
          const updatedDate = new Date(originalDate);
          updatedDate.setHours(hours);
          updatedDate.setMinutes(minutes);
          updatedDate.setSeconds(0);
          updatedDate.setMilliseconds(0);
      
          const updatedTimeISO = updatedDate.toISOString();
      
          console.log(
            "Updating campaign:",
            activeCampaignId,
            "with new time:",
            updatedTimeISO
          );
      
          await axios.put(
            `${apiConfig.baseURL}/api/stud/camhistory/${activeCampaignId}`,
            {
              scheduledTime: updatedTimeISO,
            }
          );
      
          // Update local state
          setCampaigns((prevCampaigns) =>
            prevCampaigns.map((c) =>
              c._id === activeCampaignId
                ? { ...c, scheduledTime: updatedTimeISO }
                : c
            )
          );
      
          toast.success("Scheduled time updated successfully!");
          setIsModalOpen(false);
          setActiveCampaignId(null);
        } catch (error) {
          console.error("Error updating scheduled time:", error);
          toast.error("Failed to update scheduled time");
        }
      };
      
      const handleToggle = async (e, campaignId) => {
        const isChecked = e.target.checked;
      
        try {
          // If toggle is ON, always set to Remainder On
          const newStatus = isChecked ? "Remainder On" : "Remainder Off";
      
          await axios.put(`${apiConfig.baseURL}/api/stud/camhistory/${campaignId}`, {
            status: newStatus,
          });
      
          console.log(`Campaign ${campaignId} status updated to ${newStatus}`);
        } catch (error) {
          console.error("Error updating remainder campaign status:", error);
        }
      };
      

 
const filteredCampaigns = campaigns.filter((campaign) =>
    campaign.campaignname?.toLowerCase().includes("remainder")
  );
  

  return (
    <div className="admin-dashboard-page">
      <div className="admin-nav">
        <div className="nav-mobile-btn">
          <h2 className="admin-dashboard-header">Remainder Campaign History</h2>
          <button
            onClick={handleBackCampaign}
            className="admin-nav-button2 mobile-btn"
          >
            <span className="admin-nav-icons">
              <FaArrowLeft />
            </span>
            <span className="nav-names">Home</span>
          </button>
        </div>
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search campaigns..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <button
            onClick={handleBackCampaign}
            className="admin-nav-button desktop"
          >
            <span className="admin-nav-icons">
              <FaArrowLeft />
            </span>
            <span className="nav-names">Home</span>
          </button>
        </div>
      </div>
      <div className="cam-scroll" style={{ overflowX: "auto" }}>
        <table className="cam-dashboard-table">
          <thead>
            <tr>
              <th>Set Date</th>
              <th>Campaign Name</th>
              <th>Alias Name</th>
              <th>Group Name</th>
              <th>Total Count</th>
              <th>Send Count</th>
              <th>Failed Count</th>
              <th>Scheduled Time</th>
              <th>Status</th>
              <th>Action</th>
              <th>Report</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.length > 0 ? (
              filteredCampaigns.map((campaign) => (
                <tr key={campaign._id}>
                  <td>{campaign.senddate}</td>
                  <td>{campaign.campaignname}</td>
                  <td>{campaign.aliasName}</td>
                  <td>{campaign.groupname}</td>
                  <td>{campaign.totalcount}</td>
                  <td>{campaign.sendcount}</td>
                  <td>
                    {campaign.failedcount > 0 ? (
                      <button
                        className="view-btn"
                        onClick={() =>
                          handleViewFailedEmails(campaign.failedEmails)
                        }
                      >
                        View-{campaign.failedcount}
                      </button>
                    ) : (
                      campaign.failedcount
                    )}
                    </td>
                 <td
  title="Edit"
  style={{ cursor: "pointer", textDecoration: "underline" }}
  onClick={(e) => {
    e.stopPropagation();
    handleOpenModal(campaign._id, campaign.scheduledTime);
  }}
>
  {/* Modal */}
  {isModalOpen && activeCampaignId === campaign._id && (
    <div
      className="modal-schedule"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="modal-content-schedule"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Edit Scheduled Time</h3>
        <input
          type="time"
          value={newTime[activeCampaignId] || ""}
          onChange={(e) =>
            handleTimeChange(e, activeCampaignId)
          }
        />

        <div className="modal-actions-schedule">
          <button onClick={handleSaveTime}>Save</button>
          <button onClick={() => setIsModalOpen(false)}>Cancel</button>
        </div>
      </div>
    </div>
  )}

  {/* View time only */}
  {new Date(campaign.scheduledTime).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  })}
</td>


                 
                  <td
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent:
                        campaign.status === "Remainder On" ||
                        campaign.status === "Remainder Off"
                          ? "center"
                          : "flex-start",
                      fontWeight: "bold",
                      color:
                        campaign.status === "Remainder On"
                          ? "green"
                          : campaign.status === "Remainder Off"
                          ? "red"
                          : "#2f327d",
                    }}
                  >{campaign.status}-{campaign.progress}% 
                  </td>
                  <td> <label
                          className="toggle-switch"
                          style={{ marginLeft: "15px" }}
                        >
                          <input
                            type="checkbox"
                            checked={campaign.status === "Remainder On"}
                            onChange={(e) => handleToggle(e, campaign._id)}
                          />
                          <span className="slider"></span>
                        </label>
                        </td>
                  <td>
                    <button
                      className="resend-btn"
                      onClick={() => handleview(user.id, campaign._id)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: "center" }}>
                  No Campaign History
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <ToastContainer
        className="custom-toast"
        position="bottom-center"
        autoClose={2000}
        hideProgressBar={true}
        closeOnClick={false}
        closeButton={false}
        pauseOnHover={true}
        draggable={true}
        theme="light"
      />

      {/* Modal for Failed Emails */}
      {showModal && (
        <div className="modal-overlay-fail">
          <div className="modal-content-fail">
            <h3>Failed Emails</h3>

            <div className="failedview">
              {failedEmails.map((email, index) => (
                <p key={index}>{email}</p>
              ))}
            </div>
            <button
              className="close-btn-fail"
              onClick={() => setShowModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RemainderTable;
