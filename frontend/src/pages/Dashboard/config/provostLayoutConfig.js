import {
  FaBullhorn,
  FaChartPie,
  FaClipboardList,
  FaDatabase,
  FaSearch,
} from "react-icons/fa";

export const provostLayoutConfig = {
  portalTitle: "Provost Workspace",
  welcomeLabel: "Welcome",
  sidebarLinks: [
    {
      label: "Overview",
      to: "/provost-login",
      icon: FaChartPie,
    },
    {
      label: "Student Profiles",
      to: "/provost-login/view-profiles",
      icon: FaSearch,
    },
    {
      label: "Student Queries",
      to: "/provost-login/student-queries",
      icon: FaClipboardList,
    },
    {
      label: "Notices",
      to: "/provost-login/notice",
      icon: FaBullhorn,
    },
    {
      label: "Allotment Data",
      to: "/provost-login/allotment-data",
      icon: FaDatabase,
    },
  ],
  theme: {
    background: "bg-slate-50",
    sidebarGradient:
      "bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950",
    sidebarText: "text-emerald-100",
    sidebarActive: "bg-emerald-800/70 text-white shadow-lg",
    sidebarHover: "hover:bg-emerald-800/40 hover:text-white",
    mobileToggle: "bg-emerald-800 hover:bg-emerald-700",
    headerBackground: "bg-white",
    headerText: "text-slate-900",
    headerShortText: "text-slate-900",
    notificationButton: "text-emerald-800 hover:bg-emerald-50",
    profileButton: "text-emerald-800 hover:bg-emerald-50",
    logoutButton: "bg-rose-500 hover:bg-rose-600",
    highlightBar: "bg-emerald-500",
  },
  profileRoute: "/provost-login/profile",
  profileLabel: "View Profile",
  logoutRedirect: "/login",
  footerContent: "Hostel Administration • University of Lucknow",
  homeRoute: "/provost-login",
};
