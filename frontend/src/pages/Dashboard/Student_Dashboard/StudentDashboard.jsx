import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaTools, FaCalendarAlt, FaBell, FaArrowRight } from "react-icons/fa";
import NoticeViewer from "../../../components/NoticeViewer/NoticeViewer";
import {
  maintenanceService,
  leaveService,
  noticeService,
} from "../../../services/api";

const StudentDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [quickStats, setQuickStats] = useState({
    maintenance: 0,
    leave: 0,
    notices: 0,
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [recentNotices, setRecentNotices] = useState([]);
  const [selectedNotice, setSelectedNotice] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUserName(parsedUser?.name || parsedUser?.fullName || "");
          } catch (error) {
            console.warn("Unable to parse stored student user", error);
          }
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

          const requests = [
            ...maintenance.map((item) => ({
              type: "Maintenance",
              detail: item.description || "Maintenance request submitted",
              status: item.status || "pending",
              at: item.createdAt,
            })),
            ...leave.map((item) => ({
              type: "Leave",
              detail: item.reason || "Leave request submitted",
              status: item.status || "pending",
              at: item.createdAt,
            })),
          ]
            .filter((entry) => entry.at)
            .sort((a, b) => new Date(b.at) - new Date(a.at))
            .slice(0, 5);

          const trimmedNotices = notices
            .filter((notice) => notice.createdAt)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 4);

          setQuickStats({
            maintenance: maintenance.length,
            leave: leave.length,
            notices: notices.length,
          });
          setRecentRequests(requests);
          setRecentNotices(trimmedNotices);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-600">Preparing your dashboard…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 p-6">
      <section className="mb-6 rounded-3xl bg-white/80 p-6 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-indigo-500">
              Student overview
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-gray-900">
              {getGreeting()}, {userName || "Student"}.
            </h1>
            <p className="mt-2 max-w-lg text-sm text-indigo-700">
              Quick summary of your hostel activity. Use the shortcuts below to
              jump into key actions.
            </p>
          </div>
          <div className="rounded-xl bg-indigo-100/60 px-4 py-2 text-sm text-indigo-700 shadow-sm">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Maintenance"
            value={quickStats.maintenance}
            helper="Total requests"
            icon={<FaTools className="text-indigo-600" />}
          />
          <StatCard
            label="Leave"
            value={quickStats.leave}
            helper="Submitted applications"
            icon={<FaCalendarAlt className="text-indigo-600" />}
          />
          <StatCard
            label="Notices"
            value={quickStats.notices}
            helper="Received updates"
            icon={<FaBell className="text-indigo-600" />}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent requests
            </h2>
            <Link
              to="/student-login/maintenance-request"
              className="text-sm text-indigo-600 transition-colors hover:text-indigo-700"
            >
              View submissions
            </Link>
          </div>
          {recentRequests.length === 0 ? (
            <p className="mt-6 text-sm text-gray-500">
              No recent activity. New maintenance or leave submissions will
              appear here.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {recentRequests.map((item, index) => {
                const statusLabel = (item.status || "pending").replace(
                  /^(.)/,
                  (match) => match.toUpperCase()
                );
                return (
                  <li
                    key={`${item.type}-${index}`}
                    className="rounded-2xl border border-gray-100 bg-gradient-to-r from-white to-indigo-50/40 p-4 transition-all hover:translate-x-1 hover:border-indigo-200 hover:shadow-md"
                  >
                    <p className="font-medium text-gray-900">{item.type}</p>
                    <p className="mt-1 text-sm text-gray-600">{item.detail}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                      <span>{formatDate(item.at)}</span>
                      <span className="rounded-full bg-indigo-100 px-3 py-1 text-indigo-600">
                        {statusLabel}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent notices
            </h2>
            <Link
              to="/student-login/notices"
              className="text-sm text-indigo-600 transition-colors hover:text-indigo-700"
            >
              View board
            </Link>
          </div>
          {recentNotices.length === 0 ? (
            <p className="mt-6 text-sm text-gray-500">
              No new notices. Important announcements will display here.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {recentNotices.map((notice, index) => (
                <li
                  key={`${notice._id || index}`}
                  className="rounded-2xl border border-gray-100 p-4 transition-all hover:border-indigo-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {notice.subject || notice.title || "Notice"}
                      </p>
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {notice.message || notice.description || "View details"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedNotice(notice)}
                      className="ml-3 text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-700"
                    >
                      Open
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>{formatDate(notice.createdAt)}</span>
                    <span className="flex items-center gap-1 text-indigo-600">
                      Details
                      <FaArrowRight className="text-xs" />
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {selectedNotice ? (
        <NoticeViewer
          notice={selectedNotice}
          isOpen={Boolean(selectedNotice)}
          onClose={() => setSelectedNotice(null)}
        />
      ) : null}
    </div>
  );
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const formatDate = (date) => {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleString();
};

const StatCard = ({ label, value, helper, icon }) => (
  <div className="rounded-2xl border border-white bg-white/90 p-5 shadow-md backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-xl">
    <div className="flex items-center justify-between text-sm text-indigo-700">
      <span>{label}</span>
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
        {icon}
      </span>
    </div>
    <p className="mt-3 text-3xl font-semibold text-gray-900">{value}</p>
    <p className="text-xs uppercase tracking-wide text-indigo-500">{helper}</p>
  </div>
);

const QuickAction = ({ to, label, description, icon }) => (
  <Link
    to={to}
    className="group flex flex-col justify-between rounded-2xl border border-gray-100 bg-gradient-to-r from-white to-indigo-50/40 p-5 shadow-md transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl"
  >
    <div>
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
        {icon}
      </span>
      <p className="mt-3 font-medium text-gray-900">{label}</p>
      <p className="mt-1 text-sm text-gray-600">{description}</p>
    </div>
    <span className="mt-4 flex items-center text-sm text-indigo-600 transition-colors group-hover:text-indigo-700">
      Go
      <FaArrowRight className="ml-2 text-xs transition-transform group-hover:translate-x-1" />
    </span>
  </Link>
);

export default StudentDashboard;
