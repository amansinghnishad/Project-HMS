import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaBell,
  FaClipboardList,
  FaBullhorn,
  FaUserCircle,
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaDatabase,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { authService } from "../../../services/api/authService";

const ProvostAdminbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Check if a link is active
  const isActive = (path) => {
    return location.pathname.includes(path);
  };
  const handleLogout = async () => {
    try {
      await authService.logout();
      toast.success("Logged out successfully!");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error(
        error.message || error?.payload?.message || "Error during logout"
      );
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-full bg-teal-600 text-white shadow-lg hover:bg-teal-700 transition-all"
        >
          {isMobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <nav
        className={`${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 w-64 bg-gradient-to-b from-teal-800 to-teal-900 shadow-xl transition-transform duration-300 ease-in-out z-40 flex flex-col`}
      >
        <div className="p-6 text-center">
          <Link
            className="text-2xl font-bold text-white ml-8 md:ml-0"
            to="/provost-login"
          >
            Provost Portal
          </Link>
          <div className="mt-2 h-1 w-16 bg-teal-400 mx-auto rounded-full"></div>
        </div>

        <div className="px-4 py-2">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-white p-1">
              <div className="w-full h-full rounded-full bg-gray-300 flex items-center justify-center">
                <FaUserCircle className="text-gray-600" size={50} />
              </div>
            </div>
          </div>
          <p className="text-center text-teal-200 font-medium">
            Welcome, Provost
          </p>
        </div>

        <ul className="mt-8 space-y-1 px-3 flex-grow overflow-y-auto">
          {" "}
          {/* Added flex-grow overflow-y-auto */}
          <li>
            <Link
              to="/provost-login/view-profiles"
              className={`flex items-center px-4 py-3 rounded-lg transition-all ${
                isActive("/view-profiles")
                  ? "bg-teal-700 text-white font-medium shadow-md"
                  : "text-teal-100 hover:bg-teal-700/50 hover:text-white"
              }`}
            >
              <FaSearch className="mr-3" />
              View Student Profiles
            </Link>
          </li>
          <li>
            <Link
              to="/provost-login/student-notice"
              className={`flex items-center px-4 py-3 rounded-lg transition-all ${
                isActive("/student-notice")
                  ? "bg-teal-700 text-white font-medium shadow-md"
                  : "text-teal-100 hover:bg-teal-700/50 hover:text-white"
              }`}
            >
              <FaBell className="mr-3" />
              Student Notice
            </Link>
          </li>
          <li>
            <Link
              to="/provost-login/student-queries"
              className={`flex items-center px-4 py-3 rounded-lg transition-all ${
                isActive("/student-queries")
                  ? "bg-teal-700 text-white font-medium shadow-md"
                  : "text-teal-100 hover:bg-teal-700/50 hover:text-white"
              }`}
            >
              <FaClipboardList className="mr-3" />
              Student Queries
            </Link>
          </li>
          <li>
            <Link
              to="/provost-login/public-notice"
              className={`flex items-center px-4 py-3 rounded-lg transition-all ${
                isActive("/public-notice")
                  ? "bg-teal-700 text-white font-medium shadow-md"
                  : "text-teal-100 hover:bg-teal-700/50 hover:text-white"
              }`}
            >
              <FaBullhorn className="mr-3" />
              Public Notice
            </Link>
          </li>
          <li>
            <Link
              to="/provost-login/allotment-data"
              className={`flex items-center px-4 py-3 rounded-lg transition-all ${
                isActive("/allotment-data")
                  ? "bg-teal-700 text-white font-medium shadow-md"
                  : "text-teal-100 hover:bg-teal-700/50 hover:text-white"
              }`}
            >
              <FaDatabase className="mr-3" />
              Allotment Data
            </Link>
          </li>
        </ul>

        <div className="mt-auto p-4">
          <button
            onClick={() => setShowLogoutMenu(true)}
            className="w-full flex items-center justify-center px-4 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all shadow-md"
          >
            <FaSignOutAlt className="mr-2" />
            Logout
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {/* Header */}
        <header className="bg-white shadow-md rounded-lg p-4 mb-6 flex justify-between items-center">
          <div className="flex items-center">
            <img
              src="/universitylogo.png"
              alt="Logo"
              className="h-10 w-10 mr-3"
            />
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 hidden sm:block">
              Hostel Management System
            </h1>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 block sm:hidden">
              HMS
            </h1>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
              <FaBell size={20} />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowProfileModal(!showProfileModal)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-600 flex items-center"
              >
                <FaUserCircle size={24} />
              </button>
              {showProfileModal && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
                  <Link
                    to="/provost-login/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    My Profile
                  </Link>
                  <button
                    onClick={() => {
                      setShowProfileModal(false);
                      setShowLogoutMenu(true);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <Outlet />
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 text-center">
              Confirm Logout
            </h3>
            <p className="text-gray-600 mb-6 text-center text-sm sm:text-base">
              Are you sure you want to log out?
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleLogout}
                className="w-full sm:flex-1 bg-red-600 text-white py-2.5 px-4 rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
              <button
                onClick={() => setShowLogoutMenu(false)}
                className="w-full sm:flex-1 bg-gray-200 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProvostAdminbar;
