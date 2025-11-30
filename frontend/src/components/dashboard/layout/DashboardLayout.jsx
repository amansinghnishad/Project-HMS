import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaBell,
  FaSignOutAlt,
  FaTimes,
  FaUserCircle,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { authService } from "../../../services/api/authService";

const defaultTheme = {
  background: "bg-slate-50",
  sidebarGradient: "bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900",
  sidebarText: "text-slate-100",
  sidebarActive: "bg-white/10 text-white shadow-lg",
  sidebarHover: "hover:bg-white/10 hover:text-white",
  mobileToggle: "bg-slate-900 hover:bg-slate-800",
  headerBackground: "bg-white",
  headerShadow: "shadow-md",
  headerText: "text-gray-800",
  headerShortText: "text-gray-800",
  notificationButton: "text-gray-600 hover:bg-gray-100",
  profileButton: "text-gray-600 hover:bg-gray-100",
  logoutButton: "bg-rose-500 hover:bg-rose-600",
  highlightBar: "bg-white/20",
};

const DashboardLayout = ({ config, children }) => {
  const {
    portalTitle = "Dashboard",
    welcomeLabel = "Welcome",
    sidebarLinks = [],
    theme: themeOverrides = {},
    logoSrc = "/universitylogo.png",
    headerTitle = "Hostel Management System",
    headerShortTitle = "HMS",
    profileRoute,
    profileLabel = "My Profile",
    logoutRedirect = "/login",
    footerContent,
    homeRoute,
  } = config || {};

  const location = useLocation();
  const navigate = useNavigate();

  const theme = useMemo(
    () => ({ ...defaultTheme, ...themeOverrides }),
    [themeOverrides]
  );

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

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

    setShowLogoutModal(false);
    navigate(logoutRedirect);
  };

  const isActive = (path) => {
    if (!path) return false;
    const current = location.pathname;
    if (path === "/") {
      return current === path;
    }
    return current === path || current.startsWith(`${path}/`);
  };

  return (
    <div className={`flex h-screen ${theme.background}`}>
      {/* Mobile toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          type="button"
          onClick={toggleMobileMenu}
          className={`p-2 rounded-full text-white shadow-lg transition-all ${theme.mobileToggle}`}
          aria-label="Toggle navigation"
        >
          {isMobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 w-64 ${
          theme.sidebarGradient
        } shadow-2xl transition-transform duration-300 ease-in-out z-40 flex flex-col`}
      >
        <div className="p-6 text-center">
          <Link
            className={`text-2xl font-semibold tracking-wide ${theme.sidebarText}`}
            to={homeRoute || "#"}
            onClick={(event) => {
              if (!homeRoute) {
                event.preventDefault();
              } else {
                closeMobileMenu();
              }
            }}
          >
            {portalTitle}
          </Link>
          <div
            className={`mt-3 h-1 w-16 mx-auto rounded-full ${theme.highlightBar}`}
          />
        </div>

        <div className="px-4">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-white/10 p-1">
              <div className="w-full h-full rounded-full bg-white/10 flex items-center justify-center">
                <FaUserCircle className={`${theme.sidebarText}`} size={48} />
              </div>
            </div>
          </div>
          <p className={`text-center text-sm font-medium ${theme.sidebarText}`}>
            {welcomeLabel}
          </p>
        </div>

        <nav className="mt-6 px-3 flex-1 overflow-y-auto">
          <ul className="space-y-1">
            {sidebarLinks.map(({ label, to, icon: Icon }) => (
              <li key={label}>
                <Link
                  to={to}
                  className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                    theme.sidebarText
                  } ${isActive(to) ? theme.sidebarActive : theme.sidebarHover}`}
                  onClick={closeMobileMenu}
                >
                  {Icon ? <Icon className="mr-3" size={18} /> : null}
                  <span className="text-sm font-medium tracking-wide">
                    {label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto p-4">
          <button
            type="button"
            onClick={() => {
              setShowLogoutModal(true);
              closeMobileMenu();
            }}
            className={`w-full flex items-center justify-center px-4 py-3 rounded-lg text-white transition-colors font-medium shadow-lg ${theme.logoutButton}`}
          >
            <FaSignOutAlt className="mr-2" size={16} />
            Logout
          </button>
          {footerContent ? (
            <p
              className={`mt-4 text-xs text-center opacity-80 ${theme.sidebarText}`}
            >
              {footerContent}
            </p>
          ) : null}
        </div>
      </aside>

      {/* Main content */}
      <section className="flex-1 flex flex-col overflow-hidden">
        <header
          className={`${theme.headerBackground} ${theme.headerShadow} rounded-none lg:rounded-bl-3xl p-4 sm:p-6 flex justify-between items-center`}
        >
          <div className="flex items-center">
            <img
              src={logoSrc}
              alt="University logo"
              className="h-10 w-10 mr-3 rounded-full"
            />
            <h1
              className={`text-xl sm:text-2xl font-semibold hidden sm:block ${theme.headerText}`}
            >
              {headerTitle}
            </h1>
            <h1
              className={`text-xl font-semibold sm:hidden ${theme.headerShortText}`}
            >
              {headerShortTitle}
            </h1>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              type="button"
              className={`p-2 rounded-full transition-colors ${theme.notificationButton}`}
            >
              <FaBell size={18} />
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowProfileMenu((prev) => !prev)}
                className={`p-2 rounded-full flex items-center transition-colors ${theme.profileButton}`}
              >
                <FaUserCircle size={22} />
              </button>
              {showProfileMenu ? (
                <div className="absolute right-0 mt-3 w-48 bg-white rounded-lg shadow-lg py-2 z-30 border border-slate-100">
                  {profileRoute ? (
                    <Link
                      to={profileRoute}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-slate-50"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      {profileLabel}
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      setShowLogoutModal(true);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-slate-50"
                  >
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </section>

      {showLogoutModal ? (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
            <h2 className="text-lg font-semibold text-slate-900 text-center">
              Confirm Logout
            </h2>
            <p className="text-sm text-slate-600 mt-2 text-center">
              Are you sure you want to end this session?
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleLogout}
                className={`w-full sm:flex-1 px-4 py-2.5 rounded-lg text-white font-medium shadow-sm ${theme.logoutButton}`}
              >
                Logout
              </button>
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="w-full sm:flex-1 px-4 py-2.5 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default DashboardLayout;
