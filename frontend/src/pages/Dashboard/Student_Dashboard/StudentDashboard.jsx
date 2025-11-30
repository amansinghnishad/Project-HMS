import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaWrench,
  FaCommentAlt,
  FaCalendarAlt,
  FaCreditCard,
  FaBell,
  FaUser,
  FaHome,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaSpinner,
  FaInfoCircle,
} from "react-icons/fa";
import NoticeViewer from "../../../components/NoticeViewer/NoticeViewer";
import {
  maintenanceService,
  leaveService,
  noticeService,
} from "../../../services/api";

const StudentDashboard = () => {
  const [studentInfo, setStudentInfo] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedNotice, setSelectedNotice] = useState(null);

  const handleViewNotice = (notice) => {
    setSelectedNotice(notice);
  };

  const handleCloseNoticeViewer = () => {
    setSelectedNotice(null);
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");

        if (userStr) {
          setUser(JSON.parse(userStr));
        }

        if (token) {
          const [maintenanceRes, leaveRes, noticesRes] = await Promise.all([
            maintenanceService.fetchUserRequests().catch(() => null),
            leaveService.fetchUserLeaveRequests().catch(() => null),
            noticeService
              .fetchReceivedNotices({ page: 1, limit: 20 })
              .catch(() => null),
          ]);
          const maintenance = maintenanceRes?.data || [];
          const leave = leaveRes?.data || [];
          const notices = noticesRes?.data || [];

          // Combine and sort recent requests
          const allRequests = [
            ...maintenance.map((req) => ({
              type: "maintenance",
              title: "Maintenance Request",
              description:
                req.description?.substring(0, 50) + "..." ||
                "Maintenance request",
              status: req.status || "pending",
              date: req.createdAt,
              icon: FaWrench,
              color: "text-orange-500",
            })),
            ...leave.map((req) => ({
              type: "leave",
              title: "Leave Request",
              description: `${req.reason} (${new Date(
                req.fromDate
              ).toLocaleDateString()})`,
              status: req.status || "pending",
              date: req.createdAt,
              icon: FaCalendarAlt,
              color: "text-purple-500",
            })),
          ];

          allRequests.sort((a, b) => new Date(b.date) - new Date(a.date));
          setRecentRequests(allRequests.slice(0, 5));
          setNotifications(notices.slice(0, 3));
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const QuickActionCard = ({
    icon: Icon,
    title,
    description,
    link,
    color,
    bgColor,
  }) => (
    <Link
      to={link}
      className="bg-white p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 group"
    >
      <div className="flex items-start space-x-4">
        <div
          className={`p-3 rounded-lg ${bgColor} group-hover:scale-110 transition-transform`}
        >
          <Icon className="text-white text-xl" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
      </div>
    </Link>
  );

  const RequestItem = ({ request }) => {
    const { icon: Icon } = request;

    const getStatusColor = (status) => {
      switch (status?.toLowerCase()) {
        case "approved":
        case "resolved":
          return "text-green-600 bg-green-100";
        case "pending":
          return "text-yellow-600 bg-yellow-100";
        case "rejected":
          return "text-red-600 bg-red-100";
        default:
          return "text-gray-600 bg-gray-100";
      }
    };

    return (
      <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
        <div className="flex-shrink-0 mt-1">
          <Icon className={request.color} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{request.title}</p>
          <p className="text-sm text-gray-600 truncate">
            {request.description}
          </p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-500">
              {new Date(request.date).toLocaleDateString()}
            </p>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                request.status
              )}`}
            >
              {request.status || "Submitted"}
            </span>
          </div>
        </div>
      </div>
    );
  };
  const NotificationItem = ({ notice }) => (
    <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900">{notice.subject}</p>
          <p className="text-sm text-blue-700 mt-1 line-clamp-2">
            {notice.message}
          </p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-blue-600">
              {new Date(notice.createdAt).toLocaleDateString()}
            </p>
            <button
              onClick={() => handleViewNotice(notice)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
            >
              View Full Notice
            </button>
          </div>
        </div>
        <FaBell className="text-blue-500 ml-2" />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <FaSpinner className="animate-spin mr-3 text-2xl text-indigo-600" />
        <p className="text-lg text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-lg p-6 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              Welcome back{user?.name ? `, ${user.name}` : ""}!
            </h1>
            <p className="text-indigo-100">
              Manage your hostel services and stay updated with the latest
              information.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 text-right">
            <p className="text-indigo-200 text-sm">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <FaHome className="mr-2 text-indigo-600" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            icon={FaWrench}
            title="Maintenance Request"
            description="Report room or facility issues"
            link="/student-login/maintenance-request"
            bgColor="bg-orange-500"
          />
          <QuickActionCard
            icon={FaCommentAlt}
            title="Feedback"
            description="Share your hostel experience"
            link="/student-login/feedback"
            bgColor="bg-blue-500"
          />
          <QuickActionCard
            icon={FaCalendarAlt}
            title="Leave Application"
            description="Apply for leave from hostel"
            link="/student-login/leave-apply"
            bgColor="bg-purple-500"
          />
          <QuickActionCard
            icon={FaCreditCard}
            title="Fees Payment"
            description="Pay hostel fees online"
            link="/student-login/fees-payment"
            bgColor="bg-green-500"
          />
        </div>
      </div>

      {/* Recent Activity and Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Requests */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <FaChartLine className="mr-2 text-indigo-600" />
              Recent Requests
            </h2>
            <Link
              to="/student-login/maintenance-request"
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>

          {recentRequests.length > 0 ? (
            <div className="space-y-1">
              {recentRequests.map((request, index) => (
                <RequestItem key={index} request={request} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FaCheckCircle className="mx-auto text-4xl mb-2 text-gray-300" />
              <p>No recent requests</p>
              <p className="text-sm mt-1">
                Your submitted requests will appear here
              </p>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <FaBell className="mr-2 text-indigo-600" />
              Recent Notices
            </h2>
            <Link
              to="/student-login/notices"
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>

          {notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((notice, index) => (
                <NotificationItem key={index} notice={notice} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FaBell className="mx-auto text-4xl mb-2 text-gray-300" />
              <p>No new notifications</p>
              <p className="text-sm mt-1">Important updates will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center">
            <FaCheckCircle className="text-green-500 text-2xl mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">
                Account Status
              </p>
              <p className="text-lg font-bold text-gray-900">Active</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center">
            <FaHome className="text-blue-500 text-2xl mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Hostel Status</p>
              <p className="text-lg font-bold text-gray-900">Allotted</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex items-center">
            <FaInfoCircle className="text-purple-500 text-2xl mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Services</p>
              <p className="text-lg font-bold text-gray-900">Available</p>
            </div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <FaInfoCircle className="mr-2 text-indigo-600" />
          Need Help?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">
              Emergency Contact
            </h3>
            <p className="text-sm text-gray-600">
              For urgent maintenance issues or emergencies, contact the hostel
              office immediately.
            </p>
            <p className="text-sm font-medium text-indigo-600 mt-2">
              Phone: +91-XXX-XXX-XXXX
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Office Hours</h3>
            <p className="text-sm text-gray-600">
              Hostel office is open for in-person assistance.
            </p>{" "}
            <p className="text-sm font-medium text-indigo-600 mt-2">
              Mon-Fri: 9:00 AM - 6:00 PM
            </p>
          </div>
        </div>
      </div>

      {/* NoticeViewer Modal */}
      {selectedNotice && (
        <NoticeViewer
          notice={selectedNotice}
          isOpen={!!selectedNotice}
          onClose={handleCloseNoticeViewer}
        />
      )}
    </div>
  );
};

export default StudentDashboard;
