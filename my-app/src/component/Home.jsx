import React, { useState, useEffect, useRef } from "react";
import {
  FaFileAlt,
  FaHistory,
  FaUserPlus,
  FaEye,
  FaUser,FaUsers,
  FaBirthdayCake,FaBell,
  FaMoneyBillWave,
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
import GroupfilesingleModal from "./GroupfilesingleModal.jsx";
import * as XLSX from "xlsx";
import { FaInfoCircle } from "react-icons/fa";
import sampleexcel from "../Images/excelsheet.png";

const Home = () => {
  const [view, setView] = useState("main");
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showCampaignModalTem, setShowCampaignModalTem] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [showfileGroupModal, setShowfileGroupModal] = useState(false);
  const [showfilesingleGroupModal, setShowfilesingleGroupModal] =useState(false);
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
  const [isPreviewOpenauto, setIsPreviewOpenauto] = useState(false);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const dropdownRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeOption, setActiveOption] = useState("");
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [message, setMessage] = useState("");
  const [emailData, setEmailData] = useState({ attachments: [] }); // Email data object
  const [previewtext, setPreviewtext] = useState("");
  const [aliasName, setAliasName] = useState("");
  const [selectedGroupsub,setSelectedGroupsub]= useState(false);
  const [fieldNames, setFieldNames] = useState({});
  const [students, setStudents] = useState([]); // Stores all students
  const [scheduledTime, setScheduledTime] = useState(""); // Stores the selected time
   const [excelData, setExcelData] = useState([]);
    const [fileName, setFileName] = useState("");
    const [isRuleOpen, setIsRuleOpen] = useState("");
    const [campaigns, setCampaigns] = useState([]);
    
    const [hours, minutes] = scheduledTime.split(":").map(Number); // scheduledTime is "HH:MM"
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
    const fetchGroups = async () => {

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
  };
    fetchGroups();
  }, [user.id]); // Only re-create when `user.id` changes

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

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setActiveOption("");
  };

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
  const handleaddcontact = () => {
    setView("addcontact");
  };

  const handleRemainderrview = () => {
    setView("remainder");
  };
  const handleselectremainder = () => { 
    setView("selectremainder");
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
  const handlePreviewautomate = (template) => {
    setIsPreviewOpenauto(true);
    setSelectedTemplatepre(template);
    setBgColortem(template.bgColor || "#ffffff"); // Update background color
    setPreviewContenttem(template.previewContent || []); // Update previewContent
  };
  const handleCloseModalpre = () => {
    setIsPreviewOpen(false);
    setShowtemModal(true);
  };
  const handleCloseModalpreauto = () => {
    setIsPreviewOpenauto(false);
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
  const handleaddsinglefilecontacts = () => {
    setShowfilesingleGroupModal(true);
  };
  const handleeditbirthdayremainder = () => {
    navigate("/birthdayedit");
  };
  const handleeditpaymentreminder = () => { 
    navigate("/paymentedit");
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
  const handleremainderhistory = () => {
    navigate("/remaindertable");
  };
  const handlesetpaymentremainder = async () => {
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


    if (!previewtext) {
      toast.error("Please Enter Previewtext.");
      return;
    }
    if (!aliasName) {
      toast.error("Please Enter Alias Name.");
      return;
    }
    if (!scheduledTime) {
      toast.error("Please Select Remainder time.");
      return;
    }
 
   if (!message) {
      toast.error("Please Enter Subject.");
      return;
    }
    setIsLoading(true);
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
    const now = new Date(); // Current date

// Set selected time
now.setHours(hours);
now.setMinutes(minutes);
now.setSeconds(0);
now.setMilliseconds(0);

// This gives you a Date object with today's date + selected time
const finalDateTime = now.toISOString(); // or just `now` if you want to send a Date object

 // 1. Fetch existing payment campaigns for this user
 const existingCampaigns = campaigns.filter(
  (campaign) =>
    campaign.campaignname.startsWith("Payment Remainder") &&
    campaign.user === user.id
);

// 2. Determine suffix (if needed)
let campaignName = "Payment Remainder";
if (existingCampaigns.length > 0) {
  campaignName = `Payment Remainder-${existingCampaigns.length}`;
}

    try {
      // Store initial campaign history with "Pending" status
      const campaignHistoryData = {
        campaignname:campaignName,
        groupname: "Instant Send",
        totalcount: rows.filter((row) => row[emailIndex]).length, // Count non-empty emails
        sendcount: 0,
        recipients: "no mail",
        failedcount: 0,
        subject: message,
        previewtext,
        aliasName,
        previewContent: previewContenttem,
        bgColor: bgColortem,
        sentEmails,
        attachments,
        failedEmails,
        scheduledTime: finalDateTime, // Use the final date and time
        status: "Remainder On",
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
      navigate("/remaindertable");
      sessionStorage.removeItem("firstVisit");
      sessionStorage.removeItem("toggled");
    } catch (error) {
      setIsLoading(false);
      toast.error("Failed to set payment remainder email.");
    }
    finally {
      setIsLoading(false);
    }
  };

  const handlesetbirthremainder = async () => {
    if(!selectedGroup) {
      toast.error("Please select a group.");
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
      toast.error("Please Select Remainder time.");
      return;
    }
 
   if (!message) {
      toast.error("Please Enter Subject.");
      return;
    }
    

    try {
      // Fetch students from the selected group
      const studentsResponse = await axios.get(
        `${apiConfig.baseURL}/api/stud/groups/${selectedGroup}/students`
      );
      const students = studentsResponse.data;

      if (students.length === 0) {
        toast.warning("No students found in the selected group.");
        return;
      }
      setIsLoading(true);
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
      const now = new Date(); // Current date

// Set selected time
now.setHours(hours);
now.setMinutes(minutes);
now.setSeconds(0);
now.setMilliseconds(0);

// This gives you a Date object with today's date + selected time
const finalDateTime = now.toISOString(); // or just `now` if you want to send a Date object

 // 1. Fetch existing birthday campaigns for this user


 const existingCampaigns = campaigns.filter(
  (campaign) =>
    campaign.campaignname.startsWith("Birthday Remainder") &&
    campaign.user === user.id
);

// 2. Determine suffix (if needed)
let campaignName = "Birthday Remainder";
if (existingCampaigns.length > 0) {
  campaignName = `Birthday Remainder-${existingCampaigns.length}`;
}

      // Store initial campaign history with "Pending" status
      const campaignHistoryData = {
        campaignname:campaignName,
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
        previewContent: previewContenttem,
        bgColor: bgColortem,
        scheduledTime: finalDateTime, // Use the final date and time
        status: "Remainder On",
        senddate: new Date().toLocaleString(),
        user: user.id,
        progress: 0,
        groupId: selectedGroup,
      };

      const campaignResponse = await axios.post(
        `${apiConfig.baseURL}/api/stud/camhistory`,
        campaignHistoryData
      );
      console.log("Initial remainder Campaign History Saved:", campaignResponse.data);
      navigate("/remaindertable");
      setIsLoading(false);
      sessionStorage.removeItem("firstVisit");
      sessionStorage.removeItem("toggled");
    } catch (error) {
      setIsLoading(false);
      toast.error("Failed to set remainder email.");
    } 
    finally { 
      setIsLoading(false);
    }

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
            <button
              className="sidebar-button contact-button"
              onClick={handleRemainderrview}
            >
              Remainders
            </button>
            <button
              className="sidebar-button contact-button"
              onClick={handleOpenModal}
            >
              Automation
            </button>
          </div>
          <div className="side-img">
            <img src={imghome} alt="Home img" className="home-image" />
          </div>
        </div>

        {isModalOpen && (
        <div className="auto-overlay-unique">
          <div className="auto-modal-unique">
            <button className="auto-close-unique" onClick={handleCloseModal}>
              &times;
            </button>
            <h2 className="auto-title-unique">Choose Automation Option</h2>

            <div className="auto-options-unique">
              <button
                className={`auto-option-btn-unique ${
                  activeOption === "birthday" ? "auto-active-unique" : ""
                }`}
                onClick={() => setActiveOption("birthday")}
              >
                Birthday Remainder
              </button>
              <button
                className={`auto-option-btn-unique ${
                  activeOption === "payment" ? "auto-active-unique" : ""
                }`}
                onClick={() => setActiveOption("payment")}
              >
                Payment Remainder
              </button>
            </div>

            {/* Birthday Remainder */}
            {activeOption === "birthday" && (
              <div className="auto-section-unique">
                <label>Select Template:</label>
                <select
      className="auto-select-unique"
      onChange={(e) => {
        const selectedId = e.target.value;
        const selectedTemplate = templates.find((t) => t._id === selectedId);
        if (selectedTemplate) handlePreviewautomate(selectedTemplate);
      }}
    >
      <option>---Select Template---</option>
      {templates.length > 0 ? (
        templates.map((template) => (
          <option key={template._id} value={template._id}>
            {template.temname}
          </option>
        ))
      ) : (
        <option disabled>No templates found</option>
      )}
    </select>

  <label htmlFor="group-select">Select Contact Group:</label>
          <select
            id="group-select"
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
          >
            <option>---Select Contact---</option>
            {groups.map((group) => (
              <option key={group._id} value={group._id}>
                {group.name}
              </option>
            ))}
          </select>
          <label htmlFor="subject-input">Alias Name:</label>
          <input
            type="text"
            id="aliasName-input"
            value={aliasName}
            onChange={(e) => setAliasName(e.target.value)}
            placeholder="Enter your alias name here"
          />

          <label htmlFor="subject-input">Subject:</label>
          <input
            type="text"
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
          <input
            type="text"
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

  <div>
    <label htmlFor="schedule-time">Set Remainder Time:</label>{" "}
    <input
      type="time"
      id="schedule-time"
      value={scheduledTime}
      onChange={(e) => setScheduledTime(e.target.value)} // Only stores "HH:MM"
    />
  </div>
                <div className="auto-actions-unique">
                  <button
                  className="auto-save-unique" onClick={handlesetbirthremainder}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="loader-create" style={{color:"white"}}></span> // Spinner
                  ) : (
                    "Set Remainder"
                  )}{" "}
                </button>
                  <button className="auto-cancel-unique" onClick={handleCloseModal}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Payment Reminder */}
            {activeOption === "payment" && (
              <div className="auto-section-unique">
                <label>Select Template:</label>
                <select
      className="auto-select-unique"
      onChange={(e) => {
        const selectedId = e.target.value;
        const selectedTemplate = templates.find((t) => t._id === selectedId);
        if (selectedTemplate) handlePreviewautomate(selectedTemplate);
      }}
    >
    <option>---Select Template---</option>
      {templates.length > 0 ? (
        templates.map((template) => (
          <option key={template._id} value={template._id}>
            {template.temname}
          </option>
        ))
      ) : (
        <option disabled>No templates found</option>
      )}
    </select>

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
            Upload contact list
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
  <div>
    <label htmlFor="schedule-time">Set Remainder Time:</label>{" "}
    <input
      type="time"
      id="schedule-time"
      value={scheduledTime}
      onChange={(e) => setScheduledTime(e.target.value)} // Only stores "HH:MM"
    />
  </div>


                <div className="auto-actions-unique">
                  <button className="auto-save-unique" onClick={handlesetpaymentremainder}
                  disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="loader-create" style={{color:"white"}}></span> // Spinner
                    ) : (
                      "Set Remainder"
                    )}{" "}
                  </button>
                  <button className="auto-cancel-unique" onClick={handleCloseModal}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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

               {view === "remainder" && (
              <div className="card-grid">
              <div className="cards" onClick={handleselectremainder}>
  <FaBell className="icons campaign-create-icon" />
  <span className="card-texts">Create Remainder</span>
</div>

                <div className="cards" onClick={handleremainderhistory}>
                  <FaHistory className="icons campaign-history-icon" />
                  <span className="card-texts">Remainder History</span>
                </div>
              </div>
            )}
            
            {view === "selectremainder" && (
  <div className="card-grid">
    <div className="cards" onClick={handleeditbirthdayremainder}>
      <FaBirthdayCake className="icons campaign-create-icon" />
      <span className="card-texts">Birthday Reminder</span>
    </div>
    <div className="cards" onClick={handleeditpaymentreminder}>
      <FaMoneyBillWave className="icons campaign-history-icon" />
      <span className="card-texts">Payment Reminder</span>
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
                <div className="cards" onClick={handleaddcontact}>
                  <FaUser className="icons contact-view-icon" />
                  <span className="card-texts">Existing Group</span>
                </div>
              </div>
            )}
       {view === "addcontact" && (
  <div className="card-grid">
    <div className="cards" onClick={handleaddsinglefilecontacts}>
      <FaUserPlus className="icons contact-create-icon" />
      <span className="card-texts">Add Single Contact</span>
    </div>
    <div className="cards" onClick={handleaddfilecontacts}>
      <FaUsers className="icons contact-view-icon" />
      <span className="card-texts">Add Bulk Contact</span>
    </div>
  </div>
)}


          </div>

          {/* Show bulk add contact existing group modal */}
          {showfileGroupModal && (
            <GroupfileModal onClose={() => setShowfileGroupModal(false)} />
          )}
          {/* Show single add contact existing group modal */}

            {showfilesingleGroupModal && (
            <GroupfilesingleModal onClose={() => setShowfilesingleGroupModal(false)} />
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

{/* show templates in automation */}
{isPreviewOpenauto && (
            <div className="preview-modal-overlay-tem">
              <div className="preview-modal-content-tem">
                {selectedTemplatepre && (
                  <h3 className="temname">
                    {selectedTemplatepre.temname} Preview
                  </h3>
                )}
                <button
                  className="close-modal-read-pre"
                  onClick={handleCloseModalpreauto}
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
                    onClick={() => setIsPreviewOpenauto(false)}
                    className="preview-create-button"
                  >
                    Select
                  </button>
                  <button
                    onClick={() => setIsPreviewOpenauto(false)}
                    className="preview-create-button"
                    style={{ backgroundColor: "#f48c06" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}




{/* show templates sidebar */}
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
          <button
              className="sidebar-button contact-button"
              onClick={handleRemainderrview}
            >
              Remainders
            </button>
            <button
              className="sidebar-button contact-button"
              onClick={handleOpenModal}
            >
              Automation
            </button>
        </div>
      </div>
    </>
  );
};

export default Home;
