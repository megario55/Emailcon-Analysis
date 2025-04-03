import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./GroupModal.css";
import * as XLSX from "xlsx";
import { ToastContainer, toast } from "react-toastify";
import { FaInfoCircle } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";
import sampleexcels from "../Images/excelsheet.png";
import apiConfig from "../apiconfig/apiConfig.js";

const GroupModalnew = ({ onClose }) => {
  const [groupName, setGroupName] = useState("");
  const [uploadedData, setUploadedData] = useState([]);
  const [selectedGroupForUpload, setSelectedGroupForUpload] = useState(null);
  const [groups, setGroups] = useState([]);
  const [fileName, setFileName] = useState("");
  const [isFirstModal, setIsFirstModal] = useState(true);
  const [isSecondModalOpen, setIsSecondModalOpen] = useState(false);
  const [isRuleOpen, setIsRuleOpen] = useState("");
  const user = JSON.parse(localStorage.getItem("user"));
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingsave, setIsLoadingsave] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGroups = async () => {
      if (!user) {
        navigate("/"); // Redirect to login if user is not found
        return;
      }

      try {
        const res = await axios.get(
          `${apiConfig.baseURL}/api/stud/groups/${user.id}`
        );
        setGroups(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch groups");
      }
    };

    fetchGroups();
  }, [user, navigate]); // Ensure useEffect is dependent on `user` and `navigate`

  const handleGroupCreate = () => {
    if (!user || !user.id) {
      toast.error("Please ensure the user is valid");
      return; // Stop further execution if user is invalid
    }
    if (!groupName) {
      toast.error("Group name cannot be empty");
      return; // Stop further execution if group name is empty
    }

    // Proceed with group creation
    setIsLoading(true); // Start loading
    if (groupName && user && user.id) {
      axios
        .post(`${apiConfig.baseURL}/api/stud/groups`, {
          name: groupName,
          userId: user.id,
        })
        .then((response) => {
          setGroups([...groups, response.data]);
          setSelectedGroupForUpload(response.data._id);
          toast.success("Group created");
          setIsFirstModal(false);
          setIsSecondModalOpen(true);
          setGroupName("");
        })
        .catch((error) => {
          setIsLoading(false); // Stop loading
          // Handle error response
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
            toast.error("Failed to create group", { autoClose: 3000 });
          }
        });
    } else {
      toast.error("Please ensure all fields are filled and user is valid");
    }
  };

  const fileInputRef = useRef(null); // Create a reference to the file input
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

      setUploadedData(formattedData);
      console.log(formattedData);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSaveUploadedData = () => {
    setIsLoadingsave(true);
    if (selectedGroupForUpload && uploadedData.length > 1) {
      const headers = uploadedData[0]; // Assuming the first row contains the headers
      const payload = uploadedData.slice(1).map((row) => {
        const studentData = headers.reduce((obj, header, index) => {
          obj[header] = row[index] || ""; // Map headers to corresponding row values
          return obj;
        }, {});
        studentData.group = selectedGroupForUpload; // Add group ID for association
        return studentData;
      });

      console.log("uploaded data", payload);
      axios
        .post(`${apiConfig.baseURL}/api/stud/students/upload`, payload)
        .then(() => {
          setTimeout(() => {
            setIsFirstModal(false);
            setIsSecondModalOpen(false);
          }, 3000);
          setIsLoadingsave(false);
          toast.success("Uploaded data saved successfully");
          setUploadedData([]); // Clear data after saving
          setFileName(""); // Clear file name

          if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Reset file input
          }
        })
        .catch((error) => {
          setIsLoadingsave(false);
          console.error("Error saving uploaded data:", error);
          toast.error("Failed to save uploaded data");
        });
    } else {
      toast.error("Please select a group and ensure excel data is uploaded");
    }
  };

  return (
    <>
      {isFirstModal && (
        <div className="group-modal-overlay">
          <div className="group-modal-content">
            <h2 className="modal-title">Create New Group</h2>
            <label className="modal-label">Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="modal-input modal-group-name-input"
            />
            <button
              className="modal-btn btn-create-group"
              onClick={handleGroupCreate}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="loader-create"></span> // Spinner
              ) : (
                "Create"
              )}{" "}
            </button>
            <button
              onClick={() => setIsFirstModal(false)}
              className="modal-btn-cancel btn-create-group"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isSecondModalOpen && (
        <div className="modal-overlay">
          <div className="modal-group">
            <button className="modal-close-btn" onClick={onClose}>
              &times;
            </button>
            <div className="modal-content">
              <div className="excel-uploader">
                <h3 className="modal-section-title">Add Contact</h3>
                <select
                  value={selectedGroupForUpload || ""}
                  onChange={(e) => setSelectedGroupForUpload(e.target.value)}
                  className="modal-select modal-group-select"
                >
                  <option value="" disabled>
                    Select Group
                  </option>
                  {groups.map((group) => (
                    <option key={group._id} value={group._id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                <div className="excel-modal-body">
                  <h4>
                    Sample excel format
                    <FaInfoCircle
                      className="info-icon-rule"
                      onClick={() => {
                        console.log("Info icon clicked!");
                        setIsRuleOpen(true);
                      }}
                      style={{ cursor: "pointer", marginLeft: "5px" }}
                    />
                  </h4>
                  <img
                    src={sampleexcels}
                    alt="Sample Excel Format"
                    className="sample-excel-image"
                  />
                  <div style={{ display: "flex", gap: "10px" }}>
                    <a href="/file/democsvfile.csv" download>
                      <button className="modal-btn btn-download-sample">
                        Download Sample csv File
                      </button>
                    </a>
                    <a href="/file/demoexcelfile.xlsx" download>
                      <button className="modal-btn btn-download-sample">
                        Download Sample xlsx File
                      </button>
                    </a>
                  </div>

                  {/* Modal */}
                  {isRuleOpen && (
                    <div className="rule-modal-overlay">
                      <div className="rule-modal-container">
                        <h3>Steps to Upload a File</h3>
                        <ol>
                          <li>
                            The First Name, Last Name, and Email fields are
                            mandatory.
                          </li>
                          <li>
                            All other fields are optional. You can create custom
                            fields based on your requirements.
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
                  <h4>
                    Upload excel file
                    <FaInfoCircle
                      className="info-icon-rule"
                      onClick={() => {
                        console.log("Info icon clicked!");
                        setIsRuleOpen(true);
                      }}
                      style={{ cursor: "pointer", marginLeft: "5px" }}
                    />
                  </h4>
                  <input
                    type="file"
                    accept=".xlsx, .xls .csv"
                    ref={fileInputRef} // Attach the reference to the file input
                    onChange={handleFileUpload}
                  />
                  {fileName && <p>Uploaded File: {fileName}</p>}
                  {uploadedData.length > 0 && (
                    <button
                      className="excel-modal-view-btn"
                      onClick={() =>
                        document
                          .getElementById("excel-table")
                          .scrollIntoView({ behavior: "smooth" })
                      }
                    >
                      Uploaded List
                    </button>
                  )}
                </div>
                {uploadedData.length > 0 && (
                  <div className="excel-table-container">
                    <table id="excel-table">
                      <thead>
                        <tr>
                          {uploadedData[0].map((header, index) => (
                            <th key={index}>{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {uploadedData.slice(1).map((row, rowIndex) => (
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
                <button
                  className="modal-btn btn-save-uploaded-data"
                  onClick={handleSaveUploadedData}
                  disabled={isLoadingsave}
                  >
                    {isLoadingsave ? (
                      <span className="loader-create"></span> // Spinner
                    ) : (
                      "Save Upload"
                    )}{" "}
                </button>
                <button
                  onClick={onClose}
                  className="modal-btn-cancel btn-create-group"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
          <ToastContainer
            className="custom-toast"
            position="bottom-center"
            autoClose={3000}
            hideProgressBar={true} // Disable progress bar
            closeOnClick={false}
            closeButton={false}
            pauseOnHover={true}
            draggable={true}
            theme="light" // Optional: Choose theme ('light', 'dark', 'colored')
          />
        </div>
      )}
    </>
  );
};
export default GroupModalnew;
