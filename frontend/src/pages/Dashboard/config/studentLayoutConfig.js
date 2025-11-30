import {
  FaBell,
  FaCalendarAlt,
  FaCommentAlt,
  FaCreditCard,
  FaHome,
  FaWrench,
} from "react-icons/fa";

export const studentLayoutConfig = {
  portalTitle: "Student Workspace",
  welcomeLabel: "Welcome, Student",
  sidebarLinks: [
    {
      label: "Overview",
      to: "/student-login",
      icon: FaHome,
    },
    {
      label: "Maintenance Request",
      to: "/student-login/maintenance-request",
      icon: FaWrench,
    },
    {
      label: "Feedback",
      to: "/student-login/feedback",
      icon: FaCommentAlt,
    },
    {
      label: "Leave Apply",
      to: "/student-login/leave-apply",
      icon: FaCalendarAlt,
    },
    {
      label: "Fees Payment",
      to: "/student-login/fees-payment",
      icon: FaCreditCard,
    },
    {
      label: "Notices",
      to: "/student-login/notices",
      icon: FaBell,
    },
  ],
  theme: {
    background: "bg-slate-50",
    sidebarGradient:
      "bg-gradient-to-b from-indigo-950 via-indigo-900 to-indigo-950",
    sidebarText: "text-indigo-100",
    sidebarActive: "bg-indigo-800/70 text-white shadow-lg",
    sidebarHover: "hover:bg-indigo-800/40 hover:text-white",
    mobileToggle: "bg-indigo-800 hover:bg-indigo-700",
    headerBackground: "bg-white",
    headerText: "text-slate-900",
    headerShortText: "text-slate-900",
    notificationButton: "text-indigo-800 hover:bg-indigo-50",
    profileButton: "text-indigo-800 hover:bg-indigo-50",
    logoutButton: "bg-rose-500 hover:bg-rose-600",
    highlightBar: "bg-indigo-500",
  },
  profileRoute: "/student-login/profile",
  profileLabel: "View Profile",
  logoutRedirect: "/login",
  footerContent: "Resident Services • University of Lucknow",
  homeRoute: "/student-login",
};
