import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signup from "../component/Signup";
import Login from "../component/Login";
import AdminLogin from "../component/AdminLogin";
import AdminDashboard from "../component/AdminDashboard";
import Mainpage from "./Mainpage";
import Home from "../component/Home";
import CampaignTable from "../component/CampaignTable";
import ErrorPage from "../component/ErrorPage";  // Import the error page
import Campaign from "../component/Campaign";
import ReadReport from "../component/ReadReport";
import Readmainpage from "./Readmainpage";
import Clickmainpage from "./Clickmainpage";
import Clicksinglemainpage from "./Clicksinglemainpage";
import TemMainpage from "./TemMainpage";

function RoutesPage() {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<Login />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/editor" element={<Mainpage />} />
        <Route path="/read-editor/:userId/:campaignId" element={<Readmainpage/>} />
        <Route path="/click-editor/:userId/:campaignId" element={<Clickmainpage/>} />
        <Route path="/clicksingle-editor/:userId/:campaignId" element={<Clicksinglemainpage/>} />
        <Route path="/home" element={<Home />} />
        <Route path="/campaigntable" element={<CampaignTable />} />
        <Route path="/campaign" element={<Campaign/>} />
        <Route path="/TemMainpage" element={<TemMainpage/>} />
        <Route path="/readreport/:userId/:campaignId" element={<ReadReport />} />
        {/* Wildcard route to handle all other unknown paths */}
        <Route path="*" element={<ErrorPage />} />
        
      </Routes>
    </Router>
  );
}

export default RoutesPage;
