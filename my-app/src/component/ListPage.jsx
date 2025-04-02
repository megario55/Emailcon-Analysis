import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./ListPage.css";
import { FiEdit, FiTrash2, FiRefreshCw, FiEye } from "react-icons/fi"; // Importing icons
import apiConfig from "../apiconfig/apiConfig";

const ConfirmationModal = ({ isOpen, onClose, onConfirm, message }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-confirm">
        <p>{message}</p>
        <div className="confirm">
          <button className="editbtn" onClick={onConfirm}>
            Yes
          </button>
          <button className="cancelbtn" onClick={onClose}>
            No
          </button>
        </div>
      </div>
    </div>
  );
};

const ListPage = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState("groups");
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(
    groups.length > 0 ? groups[0]._id : ""
  );
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupName, setGroupName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [showDeletingToast, setShowDeletingToast] = useState(false);
  const [showEditingToast, setShowEditingToast] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    // If there's no selected group or if students are empty, we should set to the first group
    if (!selectedGroup && groups.length > 0) {
      setSelectedGroup(groups[0]._id); // Set the first group's id as the default
    }
  }, [groups, selectedGroup]); // Re-run this effect if groups or selectedGroup change

  useEffect(() => {
    const fetchGroupsAndStudents = () => {
      axios
        .get(`${apiConfig.baseURL}/api/stud/groups/${user.id}`)
        .then((response) => setGroups(response.data))
        .catch((err) => console.log(err));

      axios
        .get(`${apiConfig.baseURL}/api/stud/students`)
        .then((response) => {
          setStudents(response.data);
        })
        .catch((err) => console.log(err));
    };
    fetchGroupsAndStudents();
  }, [user]);

  const handleRefresh = () => {
    axios
      .get(`${apiConfig.baseURL}/api/stud/groups/${user.id}`)
      .then((response) => setGroups(response.data))
      .catch((err) => console.log(err));

    axios
      .get(`${apiConfig.baseURL}/api/stud/students`)
      .then((response) => {
        setStudents(response.data);
      })
      .catch((err) => console.log(err));
  };

  // Delete a group
  const handleDeleteGroup = (groupId) => {
    setGroupToDelete(groupId);
    setIsModalOpen(true);
  };

  const confirmDeleteGroup = () => {
    if (groupToDelete) {
      axios
        .delete(`${apiConfig.baseURL}/api/stud/groups/${groupToDelete}`)
        .then(() => {
          setGroups(groups.filter((group) => group._id !== groupToDelete));
          toast.success("Group and its students deleted");
        })
        .catch((err) => {
          console.error(err);
          toast.error("Failed to delete group");
        })
        .finally(() => {
          setIsModalOpen(false);
          setGroupToDelete(null);
        });
    }
  };
  // Delete selected students
  const handleDeleteSelectedStudents = () => {
    if (selectedStudents.length === 0) {
      toast.error("Please select contacts to delete.");
      return;
    }

    setShowDeletingToast(true); // Show toast

    // Optimistically update UI before making the request
    const updatedStudents = students.filter(
      (student) => !selectedStudents.includes(student._id)
    );
    setStudents(updatedStudents);
    setSelectedStudents([]);

    axios
      .delete(`${apiConfig.baseURL}/api/stud/students`, {
        data: { studentIds: selectedStudents },
      })
      .then(() => {
        toast.success("Selected contacts deleted!");
      })
      .catch(() => {
        // If deletion fails, revert UI changes
        toast.error("Failed to delete contacts");
        setStudents(students); // Restore previous state
      })
      .finally(() => {
        setShowDeletingToast(false); // Hide toast
      });
  };

  // Edit group name
  const handleEditGroupName = (group) => {
    setEditingGroup(group);
    setGroupName(group.name);
  };

  const handleSaveGroupName = () => {
    if (groupName.trim()) {
      axios
        .put(`${apiConfig.baseURL}/api/stud/groups/${editingGroup._id}`, {
          name: groupName,
        })
        .then(() => {
          setGroups(
            groups.map((group) =>
              group._id === editingGroup._id
                ? { ...group, name: groupName }
                : group
            )
          );
          setEditingGroup(null);
          setGroupName("");
          toast.success("Group name updated successfully!");
        })
        .catch((err) => toast.error("Failed to update group name"));
    }
  };
  const handleEditStudent = (student) => {
    // toast.success("Edit contact detail in bottom of tab");
    console.log(student); // Debug log
    setEditingStudent(student);

    // Clone the student object and remove `_id`
    const { _id, __v, ...updatedFormData } = student;

    // Ensure 'group' field gets the correct ID
    if (student.group?._id) {
      updatedFormData.group = student.group._id;
    }

    setEditFormData(updatedFormData); // Set the form data without `_id`
  };

  const handleSaveStudent = () => {
    if (Object.values(editFormData).some((val) => val === "")) {
      toast.error("All fields are required");
      return;
    }

    setShowEditingToast(true); // Show toast

    axios
      .put(
        `${apiConfig.baseURL}/api/stud/students/${editingStudent._id}`,
        editFormData
      )
      .then((response) => {
        const updatedStudent = response.data;

        // Update the students list
        setStudents((students) =>
          students.map((student) =>
            student._id === updatedStudent._id ? updatedStudent : student
          )
        );

        setEditingStudent(null); // Close the edit form
        toast.success("Details updated successfully!");
      })
      .catch((err) => {
        console.error("Error updating student:", err);
        toast.error("Failed to update student");
      })
      .finally(() => {
        setShowEditingToast(false); // Hide toast
      });
  };

  const filteredStudents = selectedGroup
    ? students.filter(
        (student) => student.group && student.group._id === selectedGroup
      )
    : [];

  const handleViewcontact = (group) => {
    setActiveTab("students");
    setSelectedGroup(group._id);
  };

  const getStudentCount = (groupId) => {
    return students.filter(
      (student) => student.group && student.group._id === groupId
    ).length;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-content-list">
        <button className="close-btn" onClick={onClose}>
          &times;
        </button>
        <h2>List Contacts</h2>
        <div className="btn-tabs">
          <button
            className={`btn ${activeTab === "groups" ? "active" : ""}`}
            onClick={() => setActiveTab("groups")}
          >
            Groups
          </button>
          <button
            className={`btn-contact ${
              activeTab === "students" ? "active" : ""
            }`}
            onClick={() => setActiveTab("students")}
          >
            Contacts
          </button>
        </div>

        {activeTab === "groups" && (
          <div>
            <h3>Groups</h3>
            {groups.length === 0 ? (
              <p>No groups available</p>
            ) : (
              <div className="student-list">
                <table>
                  <thead>
                    <tr>
                      <th>Group Name</th>
                      <th>Total Contact</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((group) => (
                      <tr key={group._id}>
                        <td>{group.name}</td>
                        <td>{getStudentCount(group._id)}</td>
                        <td>
                          <button
                            className={`editstudent ${
                              activeTab === "students" ? "active" : ""
                            }`}
                            onClick={() => handleViewcontact(group)}
                          >
                            {" "}
                            <FiEye size={18} color="#282a74" />
                          </button>
                          <button
                            className="editstudent"
                            onClick={() => handleEditGroupName(group)}
                          >
                            <FiEdit size={18} color="green" />
                          </button>
                          <button
                            className="editstudent"
                            onClick={() => handleDeleteGroup(group._id)}
                          >
                            <FiTrash2 size={18} color="red" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {editingGroup && (
              <div className="edit-student-modal-overlay">
                <div className="edit-student-modal-contents">
                  <h3>Edit Group</h3>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                  <div className="edit-student-modal-buttons">
                    <button className="editbtn" onClick={handleSaveGroupName}>
                      Save
                    </button>
                    <button
                      className="cancelbtn"
                      onClick={() => setEditingGroup(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "students" && (
          <div>
            <h3>Contacts</h3>
            <div>
              <label>Filter by Group:</label>
              <select
                value={selectedGroup || ""}
                onChange={(e) => setSelectedGroup(e.target.value)}
              >
                {/* <option value="">All</option> */}
                {groups.map((group) => (
                  <option key={group._id} value={group._id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
            {filteredStudents.length === 0 ? (
              <p>No Contacts available</p>
            ) : (
              <>
                <button className="btn" onClick={handleDeleteSelectedStudents}>
                  Delete Selected Contacts
                </button>
                <button className="btn-ref" onClick={handleRefresh}>
                  <FiRefreshCw /> Refresh
                </button>
                <div className="student-list">
                  <table>
                    <thead>
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            onChange={(e) =>
                              setSelectedStudents(
                                e.target.checked
                                  ? filteredStudents.map((s) => s._id)
                                  : []
                              )
                            }
                          />
                        </th>
                        {/* Extract headers dynamically from filteredStudents to reflect the selected group */}
                        {filteredStudents.length > 0 &&
                          Object.keys(filteredStudents[0])
                            .filter(
                              (key) =>
                                key !== "_id" &&
                                key !== "group" &&
                                key !== "__v" // Exclude unwanted fields
                            )
                            .map((key, index) => <th key={index}>{key}</th>)}
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student) => (
                        <tr key={student._id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student._id)}
                              onChange={(e) =>
                                setSelectedStudents((prev) =>
                                  e.target.checked
                                    ? [...prev, student._id]
                                    : prev.filter((id) => id !== student._id)
                                )
                              }
                            />
                          </td>
                          {Object.keys(student)
                            .filter(
                              (key) =>
                                key !== "_id" &&
                                key !== "group" &&
                                key !== "__v"
                            )
                            .map((key, index) => (
                              <td key={index}>{student[key]}</td>
                            ))}
                          <td>
                            <button
                              className="editstudent"
                              onClick={() => handleEditStudent(student)}
                            >
                              <FiEdit size={18} color="green" />
                            </button>
                            <button
                              className="editstudent"
                              onClick={handleDeleteSelectedStudents}
                            >
                              <FiTrash2 size={18} color="red" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {editingStudent && (
              <div className="edit-student-modal-overlay">
                <div className="edit-student-modal-content">
                  <h3>Edit Student</h3>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveStudent();
                    }}
                  >
                    {/* Render input fields dynamically (excluding `_id`) */}
                    {Object.keys(editFormData).map(
                      (key) =>
                        key !== "group" && (
                          <input
                            key={key}
                            type="text"
                            name={key}
                            value={editFormData[key] || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                [key]: e.target.value,
                              })
                            }
                            placeholder={`Enter ${key}`}
                            className="edit-student-input"
                          />
                        )
                    )}

                    {/* Group Dropdown */}
                    <select
                      name="group"
                      value={editFormData.group || ""}
                      onChange={(e) => {
                        const selectedGroup = groups.find(
                          (group) => group._id === e.target.value
                        );
                        setEditFormData({
                          ...editFormData,
                          group: selectedGroup?._id || "",
                        });
                      }}
                      className="edit-student-select"
                    >
                      <option value="">Select Group</option>
                      {groups.map((group) => (
                        <option key={group._id} value={group._id}>
                          {group.name}
                        </option>
                      ))}
                    </select>

                    {/* Buttons */}
                    <div className="edit-student-modal-buttons">
                      <button className="editbtn" type="submit">
                        Save
                      </button>
                      <button
                        className="cancelbtn"
                        type="button"
                        onClick={() => setEditingStudent(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={confirmDeleteGroup}
          message="Are you sure you want to delete this group?"
        />

        {/* deleting modal */}
        {showDeletingToast && (
          <div className="deleting-toast">
            Deleting selected contacts, please wait...
          </div>
        )}
        {/* editing modal */}
        {showEditingToast && (
          <div className="deleting-toast">Updated please wait...</div>
        )}
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
  );
};

export default ListPage;
