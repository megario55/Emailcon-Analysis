import React, { useEffect, useState } from "react";
import axios from "axios";
import "./CampaignTable.css";
import { FaArrowLeft, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import apiConfig from "../apiconfig/apiConfig";

function CampaignTable() {
  const [campaigns, setCampaigns] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [failedEmails, setFailedEmails] = useState([]);
  const [processingCampaigns, setProcessingCampaigns] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  // const excelstudent = JSON.parse(localStorage.getItem("excelstudent"));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTime, setNewTime] = useState({});
  const [activeCampaignId, setActiveCampaignId] = useState(null); // To track active modal's campaignId

  // Store old scheduled times separately
  // const [oldScheduledTimes, setOldScheduledTimes] = useState({});

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
    navigate(`/readreport/${userId}/${campaignId}`);
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
    const selectedTime = e.target.value;
    console.log("Selected Time:", selectedTime, campaignId);
    setNewTime((prev) => ({ ...prev, [campaignId]: selectedTime })); // Store per campaign
  };
  const handleSaveTime = async () => {
    if (!newTime[activeCampaignId]) {
      toast.error("Please select a valid time");
      return;
    }

    try {
      const updatedTimeISO = new Date(newTime[activeCampaignId]).toISOString(); // Convert to ISO format

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

      setCampaigns((prevCampaigns) =>
        prevCampaigns.map((c) =>
          c._id === activeCampaignId
            ? { ...c, scheduledTime: updatedTimeISO }
            : c
        )
      );

      toast.success("Scheduled time updated successfully!");
      setIsModalOpen(false); // Close modal after save
      setActiveCampaignId(null); // Clear active campaign
    } catch (error) {
      console.error("Error updating scheduled time:", error);
      toast.error("Failed to update scheduled time");
    }
  };

  const handleToggle = async (e, campaignId) => {
    const isChecked = e.target.checked; // Get toggle state

    try {
      const newStatus = isChecked ? "Scheduled On" : "Scheduled Off";

      // Update status and scheduled time in DB
      await axios.put(
        `${apiConfig.baseURL}/api/stud/camhistory/${campaignId}`,
        {
          status: newStatus,
        }
      );
    } catch (error) {
      console.error("Error updating campaign status:", error);
    }
  };

  const handleResend = async (campaignId) => {
  try {
   
    setProcessingCampaigns((prev) => ({ ...prev, [campaignId]: true })); // Set only this campaign as processing

    // Fetch campaign details
    const response = await axios.get(`${apiConfig.baseURL}/api/stud/getcamhistory/${campaignId}`);
    const campaign = response.data;
    console.log("Fetched campaign data:", campaign);

    if (!campaign || !campaign.failedEmails || campaign.failedEmails.length === 0) {
      toast.warning("No failed emails to resend.");
      setProcessingCampaigns((prev) => ({ ...prev, [campaignId]: false })); // Reset
      return;
    }

    let sentEmails = [];
    let failedEmails = [];

    // If groupId is a string (e.g., "no group"), send only to failedEmails and return early
    if (!campaign.groupId || campaign.groupId === "no group") {
      console.log("No group found, sending emails directly.");
      // Update status to 'Pending' before resending
    await axios.put(`${apiConfig.baseURL}/api/stud/camhistory/${campaignId}`, {
      status: "Pending",
    });

    for (const email of campaign.failedEmails) {
      const personalizedContent = campaign.previewContent.map((item) => {
        const personalizedItem = { ...item };

        if (item.content) {
          const placeholderRegex = new RegExp(`\\{?Email\\}?`, "g");
          personalizedItem.content = personalizedItem.content.replace(placeholderRegex, email);
        }
        return personalizedItem;
      });

      const emailData = {
        recipientEmail: email,
        subject: campaign.subject,
        aliasName: campaign.aliasName,
        body: JSON.stringify(personalizedContent),
        bgColor: campaign.bgColor,
        previewtext: campaign.previewtext,
        attachments: campaign.attachments,
        userId: campaign.user,
        groupId: campaign.groupname,
        campaignId: campaignId,
      };

        try {
          await axios.post(`${apiConfig.baseURL}/api/stud/sendbulkEmail`, emailData);
          sentEmails.push(email);
        } catch (error) {
          console.error(`Failed to send email to ${email}:`, error);
          failedEmails.push(email);
        }
      // **Update progress dynamically**
    const totalEmails = campaign.totalcount;
    const successProgress = Math.round((sentEmails.length / totalEmails) * 100);
    const failProgress = Math.round((failedEmails.length / totalEmails) * 100);
    const currentProgress = failedEmails.length > 0 ? failProgress : successProgress;

    // **Update the database after each email is processed**
    await axios.put(`${apiConfig.baseURL}/api/stud/camhistory/${campaignId}`, {
        sendcount: sentEmails.length,
        failedcount: failedEmails.length,
        sentEmails,
        failedEmails,
        status: "In Progress",
        progress: currentProgress, // Updated progress calculation
    });

    console.log(`Progress updated: ${currentProgress}%`);
      }

      // Update campaign history
      const finalStatus = failedEmails.length > 0 ? "Failed" : "Success";
      await axios.put(`${apiConfig.baseURL}/api/stud/camhistory/${campaignId}`, {
        sendcount: Number(campaign.sendcount) + sentEmails.length,
        sentEmails: [...campaign.sentEmails, ...sentEmails],
        failedEmails: failedEmails.length > 0 ? [...failedEmails] : 0,
        failedcount: failedEmails.length > 0 ? failedEmails.length : 0,
        status: finalStatus,
        
      });
      console.log("Emails resent successfully!");

      return;
    }

    // If groupId is a string (e.g., "No id"), send only to failedEmails and return early
    if (!campaign.groupId || campaign.groupId === "No id") {
      console.log("No group found, sending emails directly.");

    // Update status to 'Pending' before resending
    await axios.put(`${apiConfig.baseURL}/api/stud/camhistory/${campaignId}`, {
      status: "Pending",
    });

    for (const email of campaign.failedEmails) {
      // Find the corresponding student
      const student = campaign.exceldata.find((s) => s.Email === email);
      if (!student) {
        console.warn(`No matching student found for email: ${email}`);
        failedEmails.push(email);
        continue;
      }
     

      // Personalize email content with student details
      const personalizedContent = campaign.previewContent.map((item) => {
        const personalizedItem = { ...item };

        if (item.content) {
          Object.entries(student).forEach(([key, value]) => {
            const placeholderRegex = new RegExp(`\\{?${key}\\}?`, "g");
            const cellValue = value != null ? String(value).trim() : "";
            personalizedItem.content = personalizedItem.content.replace(placeholderRegex, cellValue);
          });
        }
        return personalizedItem;
      });

      const emailData = {
        recipientEmail: email,
        subject: campaign.subject,
        body: JSON.stringify(personalizedContent),
        bgColor: campaign.bgColor,
        previewtext: campaign.previewtext,
        aliasName: campaign.aliasName,
        attachments: campaign.attachments,
        userId: campaign.user,
        groupId: campaign.groupname,
        campaignId: campaignId,
      };

        try {
          await axios.post(`${apiConfig.baseURL}/api/stud/sendbulkEmail`, emailData);
          sentEmails.push(email);
        } catch (error) {
          console.error(`Failed to send email to ${email}:`, error);
          failedEmails.push(email);
        }
           // **Update progress dynamically**
    const totalEmails = campaign.totalcount;
    const successProgress = Math.round((sentEmails.length / totalEmails) * 100);
    const failProgress = Math.round((failedEmails.length / totalEmails) * 100);
    const currentProgress = failedEmails.length > 0 ? failProgress : successProgress;

    // **Update the database after each email is processed**
    await axios.put(`${apiConfig.baseURL}/api/stud/camhistory/${campaignId}`, {
        sendcount: sentEmails.length,
        failedcount: failedEmails.length,
        sentEmails,
        failedEmails,
        status: "In Progress",
        progress: currentProgress, // Updated progress calculation
    });

    console.log(`Progress updated: ${currentProgress}%`);
      }

      // Update campaign history
      const finalStatus = failedEmails.length > 0 ? "Failed" : "Success";
      await axios.put(`${apiConfig.baseURL}/api/stud/camhistory/${campaignId}`, {
        sendcount: Number(campaign.sendcount) + sentEmails.length,
        sentEmails: [...campaign.sentEmails, ...sentEmails],
        failedEmails: failedEmails.length > 0 ? [...failedEmails] : 0,
        failedcount: failedEmails.length > 0 ? failedEmails.length : 0,
        status: finalStatus,
      });
      console.log("Emails resent successfully!");

      return;
    }

    // If groupId exists, fetch students and follow existing logic
    const studentsResponse = await axios.get(`${apiConfig.baseURL}/api/stud/groups/${campaign.groupId}/students`);
    const students = studentsResponse.data;

    // Update status to 'Pending' before resending
    await axios.put(`${apiConfig.baseURL}/api/stud/camhistory/${campaignId}`, {
      status: "Pending",
    });

    for (const email of campaign.failedEmails) {
      // Find the corresponding student
      const student = students.find((s) => s.Email === email);
      if (!student) {
        console.warn(`No matching student found for email: ${email}`);
        failedEmails.push(email);
        continue;
      }
        // Replace placeholders in subject
  let personalizedSubject = campaign.subject;
  Object.entries(student).forEach(([key, value]) => {
    const placeholderRegex = new RegExp(`\\{?${key}\\}?`, "g");
    const cellValue = value != null ? String(value).trim() : "";
    personalizedSubject = personalizedSubject.replace(placeholderRegex, cellValue);
  });

      // Personalize email content with student details
      const personalizedContent = campaign.previewContent.map((item) => {
        const personalizedItem = { ...item };

        if (item.content) {
          Object.entries(student).forEach(([key, value]) => {
            const placeholderRegex = new RegExp(`\\{?${key}\\}?`, "g");
            const cellValue = value != null ? String(value).trim() : "";
            personalizedItem.content = personalizedItem.content.replace(placeholderRegex, cellValue);
          });
        }
        return personalizedItem;
      });

      const emailData = {
        recipientEmail: email,
        subject:personalizedSubject,
        body: JSON.stringify(personalizedContent),
        bgColor: campaign.bgColor,
        previewtext: campaign.previewtext,
        attachments: campaign.attachments,
        aliasName: campaign.aliasName,
        userId: campaign.user,
        groupId: campaign.groupname,
        campaignId: campaignId,
      };

      try {
        await axios.post(`${apiConfig.baseURL}/api/stud/sendbulkEmail`, emailData);
        sentEmails.push(email);
      } catch (error) {
        console.error(`Failed to send email to ${email}:`, error);
        failedEmails.push(email);
      }
         // **Update progress dynamically**
    const totalEmails = campaign.totalcount;
    const successProgress = Math.round((sentEmails.length / totalEmails) * 100);
    const failProgress = Math.round((failedEmails.length / totalEmails) * 100);
    const currentProgress = failedEmails.length > 0 ? failProgress : successProgress;

    // **Update the database after each email is processed**
    await axios.put(`${apiConfig.baseURL}/api/stud/camhistory/${campaignId}`, {
        sendcount: sentEmails.length,
        failedcount: failedEmails.length,
        sentEmails,
        failedEmails,
        status: "In Progress",
        progress: currentProgress, // Updated progress calculation
    });

    console.log(`Progress updated: ${currentProgress}%`);
    }

    // Update campaign history
    const finalStatus = failedEmails.length > 0 ? "Failed" : "Success";
    await axios.put(`${apiConfig.baseURL}/api/stud/camhistory/${campaignId}`, {
      sendcount: Number(campaign.sendcount) + sentEmails.length,
      sentEmails: [...campaign.sentEmails, ...sentEmails],
      failedEmails: failedEmails.length > 0 ? [...failedEmails] : 0,
      failedcount: failedEmails.length > 0 ? failedEmails.length : 0,
      status: finalStatus,
    });
    console.log("Emails resent successfully!");

  } catch (error) {
    console.error("Error resending emails:", error);
  } finally {
    setProcessingCampaigns((prev) => ({ ...prev, [campaignId]: false })); // Reset processing state
  }
};
  const filteredCampaigns = campaigns.filter((campaign) =>
    Object.values(campaign)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-dashboard-page">
      <div className="admin-nav">
        <div className="nav-mobile-btn">
          <h2 className="admin-dashboard-header">Campaign History</h2>
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
              <th>Send Date</th>
              <th>Campaign Name</th>
              <th>Alias Name</th>
              <th>Group Name</th>
              <th>Total Count</th>
              <th>Send Count</th>
              <th>Failed Count</th>
              <th>Scheduled Time</th>
              <th>Status</th>
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
                  {campaign.status === "Scheduled On" ||
                  campaign.status === "Scheduled Off" ? (
                    <td
                      title="Edit"
                      style={{ cursor: "pointer", textDecoration: "underline" }}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevents immediate closing
                        handleOpenModal(campaign._id, campaign.scheduledTime); // Pass scheduledTime
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
                              type="datetime-local"
                              value={newTime[activeCampaignId] || ""}
                              onChange={(e) =>
                                handleTimeChange(e, activeCampaignId)
                              }
                            />

                            <div className="modal-actions-schedule">
                              <button onClick={handleSaveTime}>Save</button>
                              <button onClick={() => setIsModalOpen(false)}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {new Date(campaign.scheduledTime).toLocaleString(
                        "en-IN",
                        { timeZone: "Asia/Kolkata" }
                      )}
                    </td>
                  ) : (
                    <td>
                      {new Date(campaign.scheduledTime).toLocaleString(
                        "en-IN",
                        { timeZone: "Asia/Kolkata" }
                      )}
                    </td>
                  )}

                  <td
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent:
                        campaign.status === "Success" ||
                        campaign.status === "Failed"
                          ? "center"
                          : "flex-start",
                      fontWeight: "bold",
                      color:
                        campaign.status === "Success"
                          ? "green"
                          : campaign.status === "Failed"
                          ? "red"
                          : "#2f327d",
                    }}
                  >
                    {campaign.status === "Scheduled On" ||
                    campaign.status === "Scheduled Off" ? (
                      <>
                        <span>{campaign.status}</span>
                        <label
                          className="toggle-switch"
                          style={{ marginLeft: "15px" }}
                        >
                          <input
                            type="checkbox"
                            checked={campaign.status === "Scheduled On"}
                            onChange={(e) => handleToggle(e, campaign._id)}
                          />
                          <span className="slider"></span>
                        </label>
                      </>
                    ) : (
                      `${campaign.status}-${campaign.progress}% ` // Display status alone for Success/Failed
                    )}

                    {campaign.status === "Failed" && (
                      <button
                        className="resend-btn"
                        onClick={() => handleResend(campaign._id)}
                        disabled={processingCampaigns[campaign._id]} // Disable only for processing campaign
                        style={{ marginLeft: "10px" }}
                      >
                        {processingCampaigns[campaign._id]
                          ? "Resending..."
                          : "Resend"}
                      </button>
                    )}
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

export default CampaignTable;
