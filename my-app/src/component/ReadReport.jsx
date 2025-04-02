import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import apiConfig from "../apiconfig/apiConfig";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./ReadReport.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const ReadReport = () => {
  const { userId, campaignId } = useParams();
  const [openCount, setOpenCount] = useState(0);
  const [campaigns, setCampaigns] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showdelModal, setShowdelModal] = useState(false);
  const [showfailModal, setShowfailModal] = useState(false);
  const [emailData, setEmailData] = useState([]);
  const [urlCount, setUrlCount] = useState(0);
  const [clickedUrls, setClickedUrls] = useState([]); // Stores URLs + email clicks
  const [emailClickData, setEmailClickData] = useState([]); // Emails + timestamps for modal
  const [urlEmails, setUrlEmails] = useState([]); // Stores emails for each URL
  const [showClickModal, setShowClickModal] = useState(false);
  const [showallClickModal, setShowallClickModal] = useState(false);
  const [showOverallClickModal, setShowOverallClickModal] = useState(false);
  const navigate = useNavigate();
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  const processDataForGraph = () => {
    const timeCounts = Array(24).fill(0); // Array to store counts for each hour (0-23)

    emailData.forEach((email) => {
      const hour = new Date(email.timestamp).getHours(); // Get hour in 24-hour format
      timeCounts[hour] += 1; // Increase count for that hour
    });

    return timeCounts.map((count, hour) => {
      // Convert to 12-hour format with AM/PM
      const period = hour < 12 ? "AM" : "PM";
      const formattedHour = hour % 12 === 0 ? 12 : hour % 12; // Convert 0 to 12 for 12AM/PM

      return { hour: `${formattedHour} ${period}`, users: count };
    });
  };

  useEffect(() => {
    if (!userId || !campaignId) return;

    const fetchClickData = () => {
      axios
        .get(
          `${apiConfig.baseURL}/api/stud/get-click?userId=${userId}&campaignId=${campaignId}`
        )
        .then((response) => {
          setUrlCount(response.data.count);
          setClickedUrls(response.data.urls);
          setUrlEmails(response.data.emails);
          // console.log("Click Data", response.data);
        })
        .catch((error) => console.error("Error fetching click data", error));
    };

    fetchClickData();
    const interval = setInterval(fetchClickData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [userId, campaignId]);

  // Handle View button click
  const handleViewClick = (clickData) => {
    setShowallClickModal(false); // Close Modal
    setEmailClickData(clickData); // Set emails + timestamps for modal
    setShowClickModal(true);
  };

  // Close Modal
  const handleCloseClickModal = () => {
    setShowClickModal(false);
    setShowallClickModal(true);
    setEmailClickData([]);
  };
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await axios.get(
          `${apiConfig.baseURL}/api/stud/getcamhistory/${campaignId}`
        );
        setCampaigns(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCampaigns();
  }, [campaignId]);

  useEffect(() => {
    const fetchEmailCount = () => {
      axios
        .get(
          `${apiConfig.baseURL}/api/stud/get-email-open-count?userId=${userId}&campaignId=${campaignId}`
        )
        .then((response) => {
          setOpenCount(response.data.count);
        })
        .catch((error) => console.error("Error fetching open count", error));
    };

    fetchEmailCount();
    const interval = setInterval(fetchEmailCount, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval); // Cleanup on unmount
  }, [userId, campaignId]);

  const fetchEmailClickDetails = () => {
    setShowallClickModal(true);
  };
  const handleCloseallClickModal = () => {
    setShowallClickModal(false); // Close Modal
  };

  const fetchEmailDetails = async () => {
    try {
      const res = await axios.get(
        `${apiConfig.baseURL}/api/stud/get-email-open-count?userId=${userId}&campaignId=${campaignId}`
      );
      console.log("Email open details", res.data);
      if (res.data && res.data.emails) {
        setEmailData(res.data.emails);
      } else {
        setEmailData([]); // Ensure empty array if no data
      }
      setShowModal(true);
    } catch (err) {
      console.error("Error fetching email details", err);
      setEmailData([]); // Prevent errors
    }
  };
  const handleOverallClickDetails = () => {
    setShowallClickModal(false); // Close Modal
    setShowOverallClickModal(true); // Open Overall Click Modal
  };
  const handleCloseoverallModal = () => {
    setShowOverallClickModal(false); // Close Modal
  };

  const handleEditor = (userId, campaignId) => {
    navigate(`/read-editor/${userId}/${campaignId}`);
  };
  const handleoverallEditor = (userId, campaignId) => {
    navigate(`/click-editor/${userId}/${campaignId}`);
  };

  const handleoverallsingleEditor = (userId, campaignId, emails) => {
    navigate(`/clicksingle-editor/${userId}/${campaignId}`, {
      state: { emails },
    });
  };

  const handleBackCampaign = () => {
    navigate("/campaigntable");
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleopendelmodal = () => {
    setShowdelModal(true);
  };
  const handleClosedelModal = () => {
    setShowdelModal(false);
  };
  const handleopenfailmodal = () => {
    setShowfailModal(true);
  };
  const handleClosefailModal = () => {
    setShowfailModal(false);
  };
  // Calculate Read Rate Percentage
  const readRate =
    campaigns.sendcount > 0
      ? ((openCount / campaigns.totalcount) * 100).toFixed(2)
      : "0.00";
  const clickRate =
    campaigns.sendcount > 0
      ? ((urlCount / campaigns.totalcount) * 100).toFixed(2)
      : "0.00";
  const deliveredRate =
    campaigns.sendcount > 0
      ? ((campaigns.sendcount / campaigns.totalcount) * 100).toFixed(2)
      : "0.00";
  const failedRate =
    campaigns.sendcount > 0
      ? ((campaigns.failedcount / campaigns.totalcount) * 100).toFixed(2)
      : "0.00";

  return (
    <>
      <nav className="nav-content">
        <div>
          <p className="Report-heading">
            <span style={{ color: "#f48c06" }}>{campaigns.campaignname}</span>{" "}
            Campaign Report
          </p>
        </div>
        <div>
          <button onClick={handleBackCampaign} className="report-nav-btn">
            <span className="admin-nav-icons">
              <FaArrowLeft />
            </span>
            <span className="nav-names">Back</span>
          </button>
        </div>
      </nav>
      <div>
        <div className="Report-heading-2">
          <p className="Report-heading-head">Email Template</p>
          <p>{campaigns.senddate}</p>
          <hr />
        </div>

        <div className="reports-content">
          <div onClick={fetchEmailDetails}>
            <p className="headings-report">Read Rate</p>
            <p className="report-counts">{readRate} %</p>
            <p className="report-view">{openCount} Opened mail</p>
          </div>
          <div onClick={fetchEmailClickDetails}>
            <p className="headings-report">Click Rate</p>
            <p className="report-counts">{clickRate} %</p>
            <p className="report-view">{urlCount} Clicked mail</p>
          </div>
          <div onClick={handleopendelmodal}>
            <p className="headings-report">Delivered Rate</p>
            <p className="report-counts">{deliveredRate} %</p>
            <p className="report-view">{campaigns.sendcount} Delivered</p>
          </div>
          <div onClick={handleopenfailmodal}>
            <p className="headings-report">Failed Rate</p>
            <p className="report-counts">{failedRate} %</p>
            <p className="report-view">{campaigns.failedcount} Failed</p>
          </div>
        </div>
      </div>
      {/* Modal for Delevered Details */}
      {showdelModal && (
        <div className="modal-overlay-read" onClick={handleClosedelModal}>
          <div
            className="modal-content-read"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-heading-read">Delivered Rate</h2>
            <table className="email-table-read">
              <thead>
                <tr>
                  <th>Mail ID-{campaigns.sendcount}</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.sentEmails && campaigns.sentEmails.length > 0 ? (
                  campaigns.sentEmails.map((email, index) => (
                    <tr key={index}>
                      <td>{email}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2">No Data Available</td>
                  </tr>
                )}
              </tbody>
            </table>
            <button className="target-modal-read" onClick={handleClosedelModal}>
              Close
            </button>
            <button className="close-modal-read" onClick={handleClosedelModal}>
              x
            </button>
          </div>
        </div>
      )}
      {/* Modal for Clicked Details */}
      {showallClickModal && (
        <div className="modal-overlay-read" onClick={handleCloseallClickModal}>
          <div
            className="modal-content-read"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-heading-read">Clicked Rate</h2>
            <table className="email-table-read">
              <thead>
                <tr>
                  <th>Links</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {clickedUrls.length > 0 ? (
                  clickedUrls.map((urlData, index) => (
                    <tr key={index}>
                      <td>{urlData.clickedUrl}</td>
                      <td>
                        <button
                          className="resend-btn"
                          onClick={() => handleViewClick(urlData.clicks)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2">No Clicks Recorded</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="overall-btn">
              <button
                className="overall-modal-read"
                onClick={handleOverallClickDetails}
              >
                Overall Click Mails
              </button>
              <button
                className="overall-cancel"
                onClick={handleCloseallClickModal}
              >
                Close
              </button>
            </div>
            <button
              className="close-modal-read"
              onClick={handleCloseallClickModal}
            >
              x
            </button>
          </div>
        </div>
      )}

      {/* Modal for link view Details */}
      {showClickModal && (
        <div className="modal-overlay-read" onClick={handleCloseClickModal}>
          <div
            className="modal-content-read"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-heading-read">Click Details</h2>
            <table className="email-table-read">
              <thead>
                <tr>
                  <th>Mail ID</th>
                  <th>Clicked Time</th>
                </tr>
              </thead>
              <tbody>
                {emailClickData.length > 0 ? (
                  emailClickData.map((singleemail, index) => (
                    <tr key={index}>
                      <td>{singleemail.emailId}</td>
                      <td>
                        {new Date(singleemail.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2">No Data Available</td>
                  </tr>
                )}
              </tbody>
            </table>
            <button
              className="target-modal-read"
              onClick={() =>
                handleoverallsingleEditor(
                  userId,
                  campaignId,
                  emailClickData.map((singleemail) => singleemail.emailId)
                )
              }
            >
              Retarget
            </button>

            <button
              className="close-modal-read"
              onClick={handleCloseClickModal}
            >
              x
            </button>
          </div>
        </div>
      )}

      {/* Modal for Failed Details */}
      {showfailModal && (
        <div className="modal-overlay-read" onClick={handleClosefailModal}>
          <div
            className="modal-content-read"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-heading-read">Failed Rate</h2>
            <table className="email-table-read">
              <thead>
                <tr>
                  <th>Mail ID-{campaigns.failedcount}</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.failedEmails && campaigns.failedEmails.length > 0 ? (
                  campaigns.failedEmails.map((email, index) => (
                    <tr key={index}>
                      <td>{email}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2">No Data Available</td>
                  </tr>
                )}
              </tbody>
            </table>
            <button
              className="target-modal-read"
              onClick={handleClosefailModal}
            >
              Close
            </button>
            <button className="close-modal-read" onClick={handleClosefailModal}>
              x
            </button>
          </div>
        </div>
      )}
      {/* Modal for Email Details */}
      {showModal && (
        <div className="modal-overlay-read" onClick={handleCloseModal}>
          <div
            className="modal-content-read"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-heading-read">Read Rate</h2>
            <table className="email-table-read">
              <thead>
                <tr>
                  <th>Mail ID</th>
                  <th>Opened Time</th>
                </tr>
              </thead>

              <tbody>
                {Array.isArray(emailData) && emailData.length > 0 ? (
                  emailData.map((email, index) => (
                    <tr key={index}>
                      <td>{email.emailId}</td>
                      <td>{new Date(email.timestamp).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3">No Data Available</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="overall-btn">
              <button
                className="overall-modal-read"
                onClick={() => setShowAnalysisModal(true)}
              >
                Retarget Analysis
              </button>
              <button
                className="overall-cancel"
                onClick={() => handleEditor(userId, campaignId)}
              >
                Retarget
              </button>
            </div>
            <button className="close-modal-read" onClick={handleCloseModal}>
              x
            </button>
          </div>
        </div>
      )}

      {/* Modal for Retarget Analysis */}
      {showAnalysisModal && (
        <div
          className="modal-overlay-read"
          onClick={() => setShowAnalysisModal(false)}
        >
          <div
            className="modal-content-read-graph"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-heading-read">Read Retarget Analysis</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={processDataForGraph()}>
                <XAxis dataKey="hour" />
                <YAxis domain={[0, 100]} tickFormatter={(tick) => `${tick}%`} />
                <Tooltip />
                <Legend verticalAlign="top" align="right" iconType="circle" />
                <Bar dataKey="users" fill="#f48c06" name="User Viewed Time" />
              </BarChart>
            </ResponsiveContainer>

            <button
              className="close-modal-read"
              onClick={() => setShowAnalysisModal(false)}
            >
              x
            </button>
          </div>
        </div>
      )}
      {/* Modal for overall click email Details */}
      {showOverallClickModal && (
        <div className="modal-overlay-read" onClick={handleCloseoverallModal}>
          <div
            className="modal-content-read"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-heading-read">Overall Click Details</h2>
            <table className="email-table-read">
              <thead>
                <tr>
                  <th>Mail ID</th>
                </tr>
              </thead>

              <tbody>
                {Array.isArray(urlEmails) && urlEmails.length > 0 ? (
                  urlEmails.map((email, index) => (
                    <tr key={index}>
                      <td>{email._id}</td> {/* Extract _id property */}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3">No Data Available</td>
                  </tr>
                )}
              </tbody>
            </table>
            <button
              className="target-modal-read"
              onClick={() => handleoverallEditor(userId, campaignId)}
            >
              Retarget
            </button>
            <button
              className="close-modal-read"
              onClick={handleCloseoverallModal}
            >
              x
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ReadReport;
