import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Importexcel.css";
import { FaInfoCircle } from "react-icons/fa";
import sampleexcel from "../Images/excelsheet.png";
import apiConfig from "../apiconfig/apiConfig";
import { useNavigate } from "react-router-dom";

const ExcelModal = ({ isOpen, onClose, previewContent = [], bgColor }) => {
  const [excelData, setExcelData] = useState([]);
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState("");
  const [aliasName, setAliasName] = useState("");
  const [isRuleOpen, setIsRuleOpen] = useState("");
  const [emailData, setEmailData] = useState({ attachments: [] }); // Email data object
  const [isScheduled, setIsScheduled] = useState(false); // Toggle state
  const [previewtext, setPreviewtext] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const user = JSON.parse(localStorage.getItem("user"));
  const [isLoading, setIsLoading] = useState(false); // State for loader
  const [isLoadingsch, setIsLoadingsch] = useState(false); // State for loader

  const campaign = JSON.parse(localStorage.getItem("campaign"));
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      console.log("previewContent in SendexcelModal:", previewContent, bgColor);
    }
  }, [isOpen, previewContent, bgColor]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      let headers = jsonData[0]; // Extract headers from first row
      const formattedData = jsonData
        .map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            if (rowIndex > 0) {
              // Avoid modifying headers
              const header = headers[colIndex]?.toLowerCase(); // Normalize headers
              if (header.includes("date") && typeof cell === "number") {
                const jsDate = new Date(
                  Math.round((cell - 25569) * 86400 * 1000)
                );
                return jsDate.toISOString().split("T")[0]; // Convert only if column is a date
              }
            }
            return cell;
          })
        )
        .filter((row) => row.some((cell) => cell));

      setExcelData(formattedData);
      console.log(formattedData);
    };
    reader.readAsArrayBuffer(file);
  };
  const sendscheduleExcel = async () => {
    if (excelData.length === 0) {
      toast.error("Please upload an Excel file first.");
      return;
    }

    if (excelData.length <= 1) {
      toast.error("Ensure excel data is uploaded.");
      return;
    }

    const [headers, ...rows] = excelData;

    if (!headers.includes("Email")) {
      toast.error("Excel file must have an 'Email' column.");
      return;
    }

    const emailIndex = headers.indexOf("Email");

    if (!previewContent || previewContent.length === 0) {
      toast.error("No Preview Content provided.");
      return;
    }

    if (!previewtext) {
      toast.error("Please Enter Previewtext.");
      return;
    }
    if (!aliasName) {
      toast.error("Please Enter Alias Name.");
      return;
    }
    if (!scheduledTime) {
      toast.error("Please Select Date And Time");
      return;
    }

    if (!message) {
      toast.error("Please Enter Subject.");
      return;
    }
    setIsLoadingsch(true); // Show loader
    let sentEmails = [];
    let failedEmails = [];
    let attachments = [];
    if (emailData.attachments && emailData.attachments.length > 0) {
      const formData = new FormData();

      emailData.attachments.forEach((file) => {
        formData.append("attachments", file);
      });

      const uploadResponse = await axios.post(
        `${apiConfig.baseURL}/api/stud/uploadfile`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      console.log("Uploaded Files:", uploadResponse.data);
      // Structure the uploaded files with original name and URL
      attachments = uploadResponse.data.fileUrls.map((file, index) => ({
        originalName: emailData.attachments[index].name, // Get original file name
        fileUrl: file, // Cloudinary URL
      }));
    }

    // Convert Excel data into an array of objects
    const formattedExcelData = rows.map((row) => {
      return headers.reduce((obj, header, index) => {
        obj[header] = row[index] || "";
        return obj;
      }, {});
    });

    try {
      // Store initial campaign history with "Pending" status
      const campaignHistoryData = {
        campaignname: campaign.camname,
        groupname: "Instant Send",
        totalcount: rows.filter((row) => row[emailIndex]).length, // Count non-empty emails
        sendcount: 0,
        recipients: "no mail",
        failedcount: 0,
        subject: message,
        previewtext,
        aliasName,
        previewContent,
        bgColor,
        sentEmails,
        attachments,
        failedEmails,
        scheduledTime: new Date(scheduledTime).toISOString(),
        status: "Scheduled On",
        senddate: new Date().toLocaleString(),
        user: user.id,
        progress: 0,
        groupId: "No id",
        exceldata: formattedExcelData, // Store Excel data inside campaign history
      };

      const campaignResponse = await axios.post(
        `${apiConfig.baseURL}/api/stud/camhistory`,
        campaignHistoryData
      );
      console.log("Initial Campaign History Saved:", campaignResponse.data);
      toast.success("Email scheduled successfully!");
      navigate("/campaigntable");
      sessionStorage.removeItem("firstVisit");
      sessionStorage.removeItem("toggled");
    } catch (error) {
      console.error("Error scheduling email:", error);
      toast.error("Failed to schedule email.");
    } finally {
      setIsLoadingsch(false);
    }
  };

  const handleSend = async () => {
    if (excelData.length === 0) {
      toast.error("Please upload an Excel file first.");
      return;
    }

    if (excelData.length <= 1) {
      toast.error("Ensure excel data is uploaded.");
      return;
    }

    const [headers, ...rows] = excelData;

    if (!headers.includes("Email")) {
      toast.error("Excel file must have an 'Email' column.");
      return;
    }

    const emailIndex = headers.indexOf("Email");

    if (!previewContent || previewContent.length === 0) {
      toast.error("No Preview Content provided.");
      return;
    }

    if (!previewtext) {
      toast.error("Please Enter Previewtext.");
      return;
    }
    if (!aliasName) {
      toast.error("Please Enter Alias Name");
      return;
    }

    if (!message) {
      toast.error("Please Enter Subject.");
      return;
    }
    setIsLoading(true); // Show loader
    navigate("/campaigntable");
    sessionStorage.removeItem("firstVisit");
    sessionStorage.removeItem("toggled");

    let sentEmails = [];
    let failedEmails = [];
    let attachments = [];
    if (emailData.attachments && emailData.attachments.length > 0) {
      const formData = new FormData();

      emailData.attachments.forEach((file) => {
        formData.append("attachments", file);
      });

      const uploadResponse = await axios.post(
        `${apiConfig.baseURL}/api/stud/uploadfile`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      console.log("Uploaded Files:", uploadResponse.data);
      // Structure the uploaded files with original name and URL
      attachments = uploadResponse.data.fileUrls.map((file, index) => ({
        originalName: emailData.attachments[index].name, // Get original file name
        fileUrl: file, // Cloudinary URL
      }));
    }

    // Convert Excel data into an array of objects
    const formattedExcelData = rows.map((row) => {
      return headers.reduce((obj, header, index) => {
        obj[header] = row[index] || "";
        return obj;
      }, {});
    });

    try {
      // Store initial campaign history with "Pending" status
      const campaignHistoryData = {
        campaignname: campaign.camname,
        groupname: "Instant Send",
        totalcount: rows.filter((row) => row[emailIndex]).length, // Count non-empty emails
        sendcount: 0,
        recipients: "no mail",
        failedcount: 0,
        subject: message,
        previewtext,
        previewContent,
        aliasName,
        bgColor,
        sentEmails,
        attachments,
        failedEmails,
        scheduledTime: new Date(),
        status: "Pending",
        progress: 0,
        senddate: new Date().toLocaleString(),
        user: user.id,
        groupId: "No id",
        exceldata: formattedExcelData, // Store Excel data inside campaign history
      };

      const campaignResponse = await axios.post(
        `${apiConfig.baseURL}/api/stud/camhistory`,
        campaignHistoryData
      );
      const campaignId = campaignResponse.data.id; // Assume response includes campaign ID
      console.log("Initial Campaign History Saved:", campaignResponse.data);

      // Process all rows and send emails concurrently
      const emailPromises = rows.map(async (row) => {
        const email = row[emailIndex];
        if (!email) return null; // Skip if email is empty

        // Generate personalized content from template
        const personalizedContent = previewContent.map((item) => {
          const personalizedItem = { ...item }; // Copy the structure

          if (item.content) {
            headers.forEach((header, index) => {
              const placeholder = new RegExp(`{?${header.trim()}\\}?`, "g"); // Match placeholders like {Fname}
              const cellValue = row[index] ? String(row[index]).trim() : ""; // Convert to string and trim
              personalizedItem.content = personalizedItem.content.replace(
                placeholder,
                cellValue
              );
            });
          }
          return personalizedItem;
        });

        const emailData = {
          recipientEmail: email,
          subject: message,
          body: JSON.stringify(personalizedContent),
          bgColor,
          previewtext,
          attachments,
          aliasName,
          userId: user.id,
          campaignId: campaignId,
        };

        try {
          console.log("Sending email data:", emailData);
          await axios.post(
            `${apiConfig.baseURL}/api/stud/sendbulkEmail`,
            emailData
          );
          sentEmails.push(email);
        } catch (error) {
          console.error(`Failed to send email to ${email}:`, error);
          failedEmails.push(email);
        }
      });

      await Promise.allSettled(emailPromises);

      // After all emails are processed, calculate the final progress and status
      const totalEmails = rows.filter((row) => row[emailIndex]).length; // Count non-empty emails
      const successProgress = Math.round(
        (sentEmails.length / totalEmails) * 100
      );
      const failProgress = Math.round(
        (failedEmails.length / totalEmails) * 100
      );
      const finalProgress =
        failedEmails.length > 0 ? failProgress : successProgress;

      // Update campaign history with final status and progress
      await axios.put(
        `${apiConfig.baseURL}/api/stud/camhistory/${campaignId}`,
        {
          sendcount: sentEmails.length,
          sentEmails,
          failedEmails: failedEmails.length > 0 ? failedEmails : [],
          failedcount: failedEmails.length,
          status: "In Progress", // Update status to "In Progress"
          progress: finalProgress, // Updated progress
        }
      );

      console.log(`Final Progress: ${finalProgress}%`);

      // Update campaign history with final status
      const finalStatus = failedEmails.length > 0 ? "Failed" : "Success";
      await axios.put(
        `${apiConfig.baseURL}/api/stud/camhistory/${campaignId}`,
        {
          sendcount: sentEmails.length,
          sentEmails,
          failedEmails: failedEmails.length > 0 ? failedEmails : [],
          failedcount: failedEmails.length,
          status: finalStatus,
        }
      );

      console.log("Emails sent successfully");
    } catch (error) {
      console.error(
        "Error sending emails:",
        error.response?.data || error.message
      );
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="excel-modal-overlay">
      <div className="excel-modal-content">
        <button className="excel-modal-close-btn" onClick={onClose}>
          &times;
        </button>
        <h2>Upload and Send Emails</h2>
        <label htmlFor="aliasName-input">Alias Name:</label>
        <input
          type="text"
          id="aliasName-input"
          value={aliasName}
          onChange={(e) => setAliasName(e.target.value)}
          placeholder="Enter Alias Name"
        />
        <label htmlFor="subject-input">Subject:</label>
        <input
          type="text"
          id="subject-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter subject"
        />
        <label htmlFor="preview-input">Preview Text:</label>
        <input
          type="text"
          id="preview-input"
          value={previewtext}
          onChange={(e) => setPreviewtext(e.target.value)}
          placeholder="Enter Preview Text"
        />
        {/* Attachment File Input */}
        <label htmlFor="attachments">Attach Files(Max-10):</label>
        {/* Attachment File Input */}
        <input
          type="file"
          multiple
          onChange={(e) => {
            const newFiles = Array.from(e.target.files);
            const allFiles = [...(emailData.attachments || []), ...newFiles];

            if (allFiles.length > 10) {
              toast.warning("You can only attach up to 10 files.");
              return;
            }

            setEmailData({ ...emailData, attachments: allFiles });
          }}
        />

        {/* Display Attached Files */}
        <div className="file-list">
          {emailData.attachments && emailData.attachments.length > 0 ? (
            <ol>
              {emailData.attachments.map((file, index) => (
                <li key={index}>
                  {file.name} - {Math.round(file.size / 1024)} KB
                  <button
                    className="attach-close"
                    onClick={() => {
                      const newAttachments = emailData.attachments.filter(
                        (_, i) => i !== index
                      );
                      setEmailData({
                        ...emailData,
                        attachments: newAttachments,
                      });
                    }}
                  >
                    X
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p>No files selected</p>
          )}
        </div>
        <div className="excel-modal-body">
          <h4>
            Sample excel format
            <FaInfoCircle
              className="info-icon-rule"
              onClick={() => {
                setIsRuleOpen(true);
              }}
              style={{ cursor: "pointer", marginLeft: "5px" }}
            />
          </h4>
          {/* Modal */}
          {isRuleOpen && (
            <div className="rule-modal-overlay">
              <div className="rule-modal-container">
                <h3>Steps to Upload a File</h3>
                <ol>
                  <li>
                    The First Name, Last Name, and Email fields are mandatory.
                  </li>
                  <li>
                    All other fields are optional. You can create custom fields
                    based on your requirements.
                  </li>
                </ol>

                <button
                  onClick={() => setIsRuleOpen(false)}
                  className="rule-close-button"
                >
                  Close
                </button>
              </div>
            </div>
          )}
          <img
            src={sampleexcel}
            alt="Sample Excel Format"
            className="sample-excel-image"
          />
          <div style={{ display: "flex", gap: "10px" }}>
            <a href="../file/democsvfile.csv" download>
              <button className="modal-btn btn-download-sample">
                Download Sample csv File
              </button>
            </a>
            <a href="../file/demoexcelfile.xlsx" download>
              <button className="modal-btn btn-download-sample">
                Download Sample xlsx File
              </button>
            </a>
          </div>
          <h4>
            Upload excel file
            <FaInfoCircle
              className="info-icon-rule"
              onClick={() => {
                setIsRuleOpen(true);
              }}
              style={{ cursor: "pointer", marginLeft: "5px" }}
            />
          </h4>
          <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
          {fileName && <p>Uploaded File: {fileName}</p>}
          {excelData.length > 0 && (
            <button
              className="excel-modal-view-btn"
              onClick={() => {
                const table = document.getElementById("excel-table");
                table.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Uploaded List
            </button>
          )}
        </div>
        {excelData.length > 0 && (
          <div className="excel-table-container">
            <table id="excel-table">
              <thead>
                <tr>
                  {excelData[0].map((header, index) => (
                    <th key={index}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {excelData.slice(1).map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* Toggle Button for Scheduled Mail */}
        <div className="toggle-container">
          <span>
            {isScheduled
              ? "Scheduled Mail Enabled :"
              : "Scheduled Mail Disabled :"}
          </span>
          <label className="switch">
            <input
              type="checkbox"
              checked={isScheduled}
              onChange={() => setIsScheduled(!isScheduled)}
            />
            <span className="slider-send round"></span>
          </label>
        </div>
        {/* Show scheduled time input only if the toggle is enabled */}
        {isScheduled && (
          <div>
            <label htmlFor="schedule-time">Set Schedule Time:</label>
            <br />
            <input
              type="datetime-local"
              id="schedule-time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
            />
          </div>
        )}

        <button
          className="excel-modal-send-btn"
          onClick={handleSend}
          disabled={isLoading || isScheduled} // Disable if scheduled is enabled
        >
          {isLoading ? "Processing..." : "Send Now"}
        </button>

        <button
          onClick={sendscheduleExcel}
          className="excel-modal-send-btn"
          disabled={isLoadingsch || !isScheduled} // Disable if scheduled is not enabled
        >
          {isLoadingsch ? "Processing..." : "Scheduled"}
        </button>
        <button
          onClick={onClose}
          className="modal-create-button-cancel-Instant"
        >
          Cancel
        </button>
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
};

export default ExcelModal;
