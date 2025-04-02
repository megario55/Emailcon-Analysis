import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AdminDashboard.css"; // Import the CSS file
import { FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import apiconfig from "../apiconfig/apiConfig.js";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false); // State for the loader
  const [loadingUserId, setLoadingUserId] = useState(null); // State for the specific user being updated
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the adminToken is present in localStorage
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      navigate("/admin-login"); // Redirect to login page if no adminToken
    } else {
      const fetchUsers = async () => {
        const response = await axios.get(
          `${apiconfig.baseURL}/api/admin/users`
        );
        setUsers(response.data);
      };
      fetchUsers();
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/"); // Redirect to homepage or login page after logout
  };

  const handleStatusChange = async (id, status) => {
    setLoading(true);
    setLoadingUserId(id); // Set the ID of the user being updated

    try {
      await axios.post(`${apiconfig.baseURL}/api/admin/update-status`, {
        id,
        status,
      });
      toast.success(`Account ${status ? "Activated" : "Deactivated"}`, {
        autoClose: 3000,
      });
      setUsers((prev) =>
        prev.map((user) =>
          user._id === id ? { ...user, isActive: status } : user
        )
      );
    } catch (error) {
      toast.error("Error updating status", { autoClose: 3000 });
    } finally {
      setLoading(false);
      setLoadingUserId(null); // Reset the ID after update
    }
  };

  return (
    <div className="admin-dashboard-page">
      <div className="admin-navnew">
        <h2 className="admin-dashboard-header">Admin Dashboard</h2>
        <button onClick={handleLogout} className="admin-nav-buttonnew">
          <span className="admin-nav-icons">
            <FaSignOutAlt />
          </span>{" "}
          <span className="nav-names">Logout</span>
        </button>
      </div>
      <h2 className="admin-dashboard-heading">Emailcon Signup Details</h2>
      <div className="cam-scroll" style={{ overflowX: "auto" }}>
        <table className="admin-dashboard-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Username</th>
              <th>Password</th>
              <th>smtp passcode</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>{user.email}</td>
                <td>{user.username}</td>
                <td>{user.password}</td>
                <td>
                  {user.smtppassword ? user.smtppassword.substring(0, 8) : ""}
                </td>
                <td>{user.isActive ? "Active" : "Inactive"}</td>
                <td>
                  {loading && loadingUserId === user._id ? (
                    <div className="loader"></div> // Render a loader for the specific user
                  ) : (
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={user.isActive}
                        onChange={() =>
                          handleStatusChange(user._id, !user.isActive)
                        }
                      />
                      <span className="slider"></span>
                    </label>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
  );
}

export default AdminDashboard;
