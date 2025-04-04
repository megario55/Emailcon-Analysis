import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./SendbulkModal.css";
import apiConfig from "../apiconfig/apiConfig";
import { useNavigate } from "react-router-dom";

const SendbulkModal = ({ isOpen, onClose, previewContent = [], bgColor }) => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [message, setMessage] = useState("");
  const [emailData, setEmailData] = useState({ attachments: [] }); // Email data object
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingsch, setIsProcessingsch] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false); // Toggle state
  const [previewtext, setPreviewtext] = useState("");
  const [aliasName, setAliasName] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [selectedGroupsub,setSelectedGroupsub]= useState(false);
  const [fieldNames, setFieldNames] = useState({});
  const [students, setStudents] = useState([]); // Stores all students
  
  const user = JSON.parse(localStorage.getItem("user"));
  const campaign = JSON.parse(localStorage.getItem("campaign"));
  const navigate = useNavigate();
  const dropdownRef=useRef(null);
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setSelectedGroupsub(false); // Close dropdown
          setFieldNames([]);
        }
      };
  
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);
  
  const handleGroupChangesubject = (e) => {
    const groupName = e.target.value;
  
    // Reset and reopen the dropdown instantly
    setSelectedGroupsub("");
    setTimeout(() => setSelectedGroupsub(groupName), 0);
  
    if (!students?.length) {
      console.log("No students available yet.");
      return;
    }
  
    // Filter students by selected group
    const filteredStudents = students.filter(
      (student) => student.group?._id === groupName
    );
  
    // Extract field names from the first student found
    const newFieldNames = filteredStudents.length
      ? Object.keys(filteredStudents[0]).filter(
          (key) => !["_id", "group", "__v"].includes(key)
        )
      : [];
  
    setFieldNames(newFieldNames);
  };

  const handleInsertNamesubject = (value) => {
    setMessage((prev) => (prev ? `${prev} ${value}` : value));
  
    // Reset selected group dropdown properly
    setSelectedGroupsub(false);
  };
  
  useEffect(() => {
    if (!user?.id) return;
  
    const fetchGroupsAndStudents = async () => {
      try {
        const groupsResponse = await axios.get(`${apiConfig.baseURL}/api/stud/groups/${user.id}`);
        setGroups(groupsResponse.data);
  
        const studentsResponse = await axios.get(`${apiConfig.baseURL}/api/stud/students`);
        setStudents(studentsResponse.data);
      } catch (err) {
        console.log("Error fetching data:", err);
      }
    };
  
    fetchGroupsAndStudents();
  }, [user.id]); 
  

  useEffect(() => {
    if (isOpen) {
      console.log("PreviewContent in SendbulkModal:", previewContent); // Log to verify
    }
  }, [isOpen, previewContent]);

  const fetchGroups = useCallback(async () => {
    try {
      const response = await axios.get(
        `${apiConfig.baseURL}/api/stud/groups/${user.id}`
      );
      setGroups(response.data);
    } catch (error) {
      console.error("Error fetching groups:", error);
      if (!toast.isActive("fetchError")) {
        toast.error("Failed to fetch groups.", { toastId: "fetchError" });
      }
    }
  }, [user.id]); // Only re-create when `user.id` changes

  useEffect(() => {
    if (isOpen) {
      fetchGroups();
    }
  }, [isOpen, fetchGroups]);

  const sendscheduleBulk = async () => {
    if (!selectedGroup || !message || !previewtext || !aliasName) {
      toast.warning(
        "Please select a group and enter a aliasName, message and preview text."
      );
      return;
    }

    if (!previewContent || previewContent.length === 0) {
      toast.warning("No preview content available.");
      return;
    }
    if (!scheduledTime) {
      toast.error("Please Select Date And Time");
      return;
    }

    setIsProcessingsch(true);

    try {
      // Fetch students from the selected group
      const studentsResponse = await axios.get(
        `${apiConfig.baseURL}/api/stud/groups/${selectedGroup}/students`
      );
      const students = studentsResponse.data;

      if (students.length === 0) {
        toast.warning("No students found in the selected group.");
        setIsProcessingsch(false);
        return;
      }
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

      // Store initial campaign history with "Pending" status
      const campaignHistoryData = {
        campaignname: campaign.camname,
        groupname: groups.find((group) => group._id === selectedGroup)?.name, // Get the group name from the groups array
        totalcount: students.length,
        recipients: "no mail",
        sendcount: 0,
        failedcount: 0,
        failedEmails: 0,
        sentEmails: 0,
        subject: message,
        aliasName,
        attachments,
        exceldata: [{}],
        previewtext,
        previewContent,
        bgColor,
        scheduledTime: new Date(scheduledTime).toISOString(),
        status: "Scheduled On",
        senddate: new Date().toLocaleString(),
        user: user.id,
        progress: 0,
        groupId: selectedGroup,
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
      setIsProcessingsch(false);
    }
  };

  const handleSend = async () => {
    if (!selectedGroup || !message || !previewtext || !aliasName) {
      toast.warning(
        "Please select a group and enter a aliasName,message and preview text."
      );
      return;
    }

    if (!previewContent || previewContent.length === 0) {
      toast.warning("No preview content available.");
      return;
    }
    setIsProcessing(true);
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

    try {
      // Fetch students from the selected group
      const studentsResponse = await axios.get(
        `${apiConfig.baseURL}/api/stud/groups/${selectedGroup}/students`
      );
      const students = studentsResponse.data;

      if (students.length === 0) {
        toast.warning("No students found in the selected group.");
        setIsProcessing(false);
        return;
      }

      // Store initial campaign history with "Pending" status
      const campaignHistoryData = {
        campaignname: campaign.camname,
        groupname: groups.find((group) => group._id === selectedGroup)?.name, // Get the group name from the groups array
        totalcount: students.length,
        recipients: "no mail",
        sendcount: 0,
        failedcount: 0,
        failedEmails: 0,
        sentEmails: 0,
        subject: message,
        attachments,
        exceldata: [{}],
        previewtext,
        aliasName,
        previewContent,
        bgColor,
        scheduledTime: new Date(),
        status: "Pending",
        progress: 0,
        senddate: new Date().toLocaleString(),
        user: user.id,
        groupId: selectedGroup,
      };

      const campaignResponse = await axios.post(
        `${apiConfig.baseURL}/api/stud/camhistory`,
        campaignHistoryData
      );
      const campaignId = campaignResponse.data.id; // Assume response includes campaign ID
      console.log("Initial Campaign History Saved:", campaignResponse.data);

      await Promise.allSettled(students.map(async (student) => {
          const personalizedContent = previewContent.map((item) => {
            const personalizedItem = { ...item };

            if (item.content) {
              Object.entries(student).forEach(([key, value]) => {
                const placeholderRegex = new RegExp(`\\{?${key}\\}?`, "g");
                const cellValue = value != null ? String(value).trim() : "";
                personalizedItem.content = personalizedItem.content.replace(
                  placeholderRegex,
                  cellValue
                );
              });
            }
            return personalizedItem;
          });
            // Replace placeholders in subject
    let personalizedSubject = message;
    Object.entries(student).forEach(([key, value]) => {
      const placeholderRegex = new RegExp(`\\{?${key}\\}?`, "g");
      const cellValue = value != null ? String(value).trim() : "";
      personalizedSubject = personalizedSubject.replace(
        placeholderRegex,
        cellValue
      );
    });


          const emailData = {
            recipientEmail: student.Email,
            subject: personalizedSubject,
            body: JSON.stringify(personalizedContent),
            bgColor,
            attachments,
            campaignId: campaignId,
            previewtext,
            aliasName,
            userId: user.id,
            groupId: selectedGroup,
          };

          try {
            console.log("Sending email data:", emailData);
            await axios.post(
              `${apiConfig.baseURL}/api/stud/sendbulkEmail`,
              emailData
            );
            sentEmails.push(student.Email);
          } catch (error) {
            console.error(`Failed to send email to ${student.Email}:`, error);
            failedEmails.push(student.Email);
          }
          // **Update progress dynamically**
          const totalEmails = students.length;
          const successProgress = Math.round(
            (sentEmails.length / totalEmails) * 100
          );
          const failProgress = Math.round(
            (failedEmails.length / totalEmails) * 100
          );
          const currentProgress =
            failedEmails.length > 0 ? failProgress : successProgress;

          // **Update the database after each email is processed**
          await axios.put(
            `${apiConfig.baseURL}/api/stud/camhistory/${campaignId}`,
            {
              sendcount: sentEmails.length,
              failedcount: failedEmails.length,
              sentEmails,
              failedEmails,
              status: "In Progress",
              progress: currentProgress, // Updated progress calculation
            }
          );

          console.log(`Progress updated: ${currentProgress}%`);
        })
      );

      // Update campaign history with final status
      const finalStatus = failedEmails.length > 0 ? "Failed" : "Success";
      await axios.put(
        `${apiConfig.baseURL}/api/stud/camhistory/${campaignId}`,
        {
          sendcount: sentEmails.length,
          sentEmails: sentEmails,
          failedEmails: failedEmails.length > 0 ? failedEmails : 0,
          failedcount: failedEmails.length > 0 ? failedEmails.length : 0, // Ensure failedcount is 0, not an empty array
          status: finalStatus,
        }
      );
      console.log("Emails sent successfully");
    } catch (error) {
      console.error("Error sending emails:", error);
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="send-modal-overlay">
      <div className="send-modal-content">
        <button className="send-modal-close-btn" onClick={onClose}>
          &times;
        </button>
        <h2>Send Bulk Mail</h2>
        <div className="send-modal-form">
          <label htmlFor="group-select">Select Group:</label>
          <select
            id="group-select"
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
          >
            <option value="">-- Select Group --</option>
            {groups.map((group) => (
              <option key={group._id} value={group._id}>
                {group.name}
              </option>
            ))}
          </select>
          <label htmlFor="subject-input">Alias Name:</label>
          <textarea
            id="aliasName-input"
            value={aliasName}
            onChange={(e) => setAliasName(e.target.value)}
            placeholder="Enter your alias name here"
          />

          <label htmlFor="subject-input">Subject:</label>
          <textarea
            id="subject-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message here"
          />
           <div className="select-group-container-sub" ref={dropdownRef}>
                    {/* Select Group */}
                    <select
                      onChange={(e) => handleGroupChangesubject(e)}
                      value=""
                      className="select-variable"
                    >
                      <option value="" disabled className="template-title">
                        Add Variable
                      </option>
                      <option value="" disabled>
                        Select Group
                      </option>
                      {groups.map((group, idx) => (
                        <option key={idx} value={group._id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
          
                    {/* Show fields only for the selected heading */}
                    {selectedGroupsub && (
                      <div className="dropdown-container-sub">
                        <p className="template-title">
                          <span>Add</span> Variable
                        </p>
                        {fieldNames&& fieldNames.length > 0 ? (
                          <div>
                            {fieldNames.map((field, idx) => (
                              <div
                                className="list-field"
                                key={idx}
                                onClick={() => handleInsertNamesubject(`{${field}}`)}
                              >
                                {field}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="no-variables">No Variables</p>
                        )}
                      </div>
                    )}
                </div>

          <label htmlFor="preview-text">Preview Text:</label>
          <textarea
            id="preview-text"
            value={previewtext}
            onChange={(e) => setPreviewtext(e.target.value)}
            placeholder="Enter your Preview text here"
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
              <label htmlFor="schedule-time">Set Schedule Time:</label>{" "}
              <input
                type="datetime-local"
                id="schedule-time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
          )}

          <div className="action-btn">
            <button
              className="send-modal-submit-btn"
              onClick={handleSend}
              disabled={isProcessing || isScheduled} // Disable if scheduled is enabled
            >
              {isProcessing ? "Processing..." : "Send Now"}
            </button>

            <button
              onClick={sendscheduleBulk}
              className="send-modal-submit-btn"
              disabled={isProcessingsch || !isScheduled} // Disable if scheduled is not enabled
            >
              {isProcessingsch ? "Processing..." : "Scheduled"}
            </button>
            <button
              onClick={onClose}
              className="modal-create-button-cancel-bulk"
            >
              Cancel
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
};

export default SendbulkModal;
