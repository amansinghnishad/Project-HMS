import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import StudentLayout from "./pages/Dashboard/Student_Dashboard/StudentLayout";
import MaintenanceRequest from "./pages/Dashboard/Student_Dashboard/MaintenanceRequest";
import Feedback from "./pages/Dashboard/Student_Dashboard/Feedback";
import LeaveApply from "./pages/Dashboard/Student_Dashboard/LeaveApply";
import FeesPayment from "./pages/Dashboard/Student_Dashboard/FeesPayment";
import StudentNotices from "./pages/Dashboard/Student_Dashboard/StudentNotices";
import StudentDashboard from "./pages/Dashboard/Student_Dashboard/StudentDashboard";
import ProvostLayout from "./pages/Dashboard/Provost_Dashboard/ProvostLayout";
import ViewProfiles from "./pages/Dashboard/Provost_Dashboard/ViewProfiles";
import StudentQueries from "./pages/Dashboard/Provost_Dashboard/StudentQueries";
import Notice from "./pages/Dashboard/Provost_Dashboard/Notice";
import ProvostDashboard from "./pages/Dashboard/Provost_Dashboard/ProvostDashboard";

import Register from "./pages/Register/Register";
import Login from "./pages/Login/Login";
import StudentLogin from "./pages/Login/StudentLogin";
import ChiefProvostLogin from "./pages/Login/ChiefProvostLogin";
import ProvostLogin from "./pages/Login/ProvostLogin";
import OtherLogin from "./pages/Login/OtherLogin";
import Home from "./pages/Home/Home";
import MultiStepForm from "./pages/Registration/Registration";
import StudentTable from "./pages/DatabasePage/StudentTable";
import HostelAdminDashboard from "./pages/DatabasePage/HostelAdminDashboard";
import HostelAllotment from "./pages/DatabasePage/HostelAllotment";
import HostelDetailsPage from "./pages/HostelDetails/HostelDetailsPage";
import FacilityDetailsPage from "./pages/Facilities/FacilityDetailsPage";
import RuleDetailsPage from "./pages/Rules/RuleDetailsPage";
import ProtectedRoute from "./components/ProtectedRoutes/ProtectedRoute";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login/student-login" element={<StudentLogin />} />
        <Route
          path="/login/chief-provost-login"
          element={<ChiefProvostLogin />}
        />
        <Route path="/login/provost-login" element={<ProvostLogin />} />
        <Route path="/login/other-login" element={<OtherLogin />} />
        <Route path="/hostel/:hostelId" element={<HostelDetailsPage />} />
        <Route path="/facility/:facilityId" element={<FacilityDetailsPage />} />
        <Route path="/rules/:ruleId" element={<RuleDetailsPage />} />{" "}
        {/* Added route */} {/* Student Dashboard Routes */}{" "}
        <Route element={<ProtectedRoute />}>
          <Route path="/student-login" element={<StudentLayout />}>
            <Route index element={<StudentDashboard />} />
            <Route
              path="maintenance-request"
              element={<MaintenanceRequest />}
            />
            <Route path="feedback" element={<Feedback />} />
            <Route path="leave-apply" element={<LeaveApply />} />
            <Route path="fees-payment" element={<FeesPayment />} />
            <Route path="notices" element={<StudentNotices />} />
          </Route>
        </Route>{" "}
        {/* Provost Dashboard Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/provost-login" element={<ProvostLayout />}>
            <Route index element={<ProvostDashboard />} />
            <Route path="view-profiles" element={<ViewProfiles />} />
            <Route path="student-queries" element={<StudentQueries />} />
            <Route path="notice" element={<Notice />} />
            <Route path="allotment-data" element={<HostelAdminDashboard />}>
              <Route path="students" element={<StudentTable />} />
              <Route
                path="alloted_hostels_list"
                element={<HostelAllotment />}
              />
            </Route>
          </Route>
        </Route>
        <Route path="/registration" element={<MultiStepForm />} />
      </Routes>
    </Router>
  );
};

export default App;
