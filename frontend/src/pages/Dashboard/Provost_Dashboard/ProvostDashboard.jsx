import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaCalendarAlt,
  FaComments,
  FaTools,
  FaArrowRight,
} from "react-icons/fa";
import { apiConnector } from "../../../services/apiconnector";
import { toast } from "react-hot-toast";

const ProvostDashboard = () => {
  const [timeOfDay, setTimeOfDay] = useState("Hello");
  const [loading, setLoading] = useState(true);
  const [provostName, setProvostName] = useState("");
  const [quickStats, setQuickStats] = useState({
    maintenance: 0,
    leave: 0,
    feedback: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setProvostName(parsedUser?.name || parsedUser?.fullName || "");
      } catch (error) {
        console.warn("Unable to parse stored user", error);
      }
    }

    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay("Good morning");
    else if (hour < 18) setTimeOfDay("Good afternoon");
    else setTimeOfDay("Good evening");

    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const [maintenanceRes, leaveRes, feedbackRes] = await Promise.all([
          apiConnector("GET", "/service-requests/all", null, headers).catch(
            () => ({ data: { data: [] } })
          ),
          apiConnector("GET", "/leave/all", null, headers).catch(() => ({
            data: { data: [] },
          })),
          apiConnector("GET", "/feedback/all", null, headers).catch(() => ({
            data: { data: [] },
          })),
        ]);

        const maintenance =
          maintenanceRes.data?.data || maintenanceRes.data || [];
        const leave = leaveRes.data?.data || leaveRes.data || [];
        const feedback = feedbackRes.data?.data || feedbackRes.data || [];

        setQuickStats({
          maintenance: maintenance.length,
          leave: leave.length,
          feedback: feedback.length,
        });

        const activity = [
          ...maintenance.map((item) => ({
            label: "Maintenance request",
            detail: item.description || "Request submitted",
            at: item.createdAt,
          })),
          ...leave.map((item) => ({
            label: "Leave request",
            detail: item.reason || "Pending review",
            at: item.createdAt,
          })),
          ...feedback.map((item) => ({
            label: "Feedback received",
            detail: item.message || "New feedback",
            at: item.createdAt,
          })),
        ]
          .filter((entry) => entry.at)
          .sort((a, b) => new Date(b.at) - new Date(a.at))
          .slice(0, 6);

        setRecentActivity(activity);
      } catch (error) {
        console.error("Failed to load provost dashboard", error);
        toast.error("Unable to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-600">Preparing your dashboard…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50 p-6">
      <section className="mb-6 rounded-3xl bg-gradient-to-r from-white to-teal-50 p-6 shadow-xl transition-all">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-teal-500">
              Provost overview
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-gray-900">
              {timeOfDay}, {provostName || "Provost"}.
            </h1>
          </div>
          <div className="rounded-xl bg-white/70 px-4 py-2 text-sm text-teal-700 shadow-sm">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatPreview
            icon={<FaTools className="text-teal-600" />}
            label="Maintenance"
            value={quickStats.maintenance}
            helper="Awaiting review"
          />
          <StatPreview
            icon={<FaCalendarAlt className="text-teal-600" />}
            label="Leave"
            value={quickStats.leave}
            helper="Pending decisions"
          />
          <StatPreview
            icon={<FaComments className="text-teal-600" />}
            label="Feedback"
            value={quickStats.feedback}
            helper="Messages to review"
          />
        </div>
      </section>

      <section className="mb-6 rounded-3xl bg-white p-6 shadow-xl transition-shadow hover:shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Quick actions</h2>
          <span className="text-xs uppercase tracking-wide text-teal-500">
            Direct shortcuts
          </span>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <DashboardAction
            label="Review requests"
            to="/provost-login/student-queries"
            description="Maintenance and leave submissions"
          />
          <DashboardAction
            label="Manage notices"
            to="/provost-login/notice"
            description="Create or publish announcements"
          />
          <DashboardAction
            label="View student profiles"
            to="/provost-login/view-profiles"
            description="Quick access to records"
          />
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent activity
          </h2>
          <Link
            to="/provost-login/student-queries"
            className="text-sm text-teal-600 transition-colors hover:text-teal-700"
          >
            View submissions
          </Link>
        </div>
        {recentActivity.length === 0 ? (
          <p className="mt-6 text-sm text-gray-500">
            No recent activity. Latest submissions will appear here when
            available.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {recentActivity.map((item, index) => (
              <li
                key={index}
                className="flex items-start justify-between rounded-2xl border border-gray-100 bg-gradient-to-r from-white to-teal-50/30 p-4 transition-all hover:translate-x-1 hover:border-teal-200 hover:shadow-md"
              >
                <div>
                  <p className="font-medium text-gray-900">{item.label}</p>
                  <p className="mt-1 text-sm text-gray-600">{item.detail}</p>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(item.at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

const DashboardAction = ({ label, to, description }) => (
  <Link
    to={to}
    className="group flex flex-col justify-between rounded-2xl border border-gray-100 bg-gradient-to-r from-white to-teal-50/40 p-5 shadow-md transition-all hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl"
  >
    <div>
      <p className="font-medium text-gray-900">{label}</p>
      <p className="mt-1 text-sm text-gray-600">{description}</p>
    </div>
    <span className="mt-4 flex items-center text-sm text-teal-600 transition-colors group-hover:text-teal-700">
      Go
      <FaArrowRight className="ml-2 text-xs transition-transform group-hover:translate-x-1" />
    </span>
  </Link>
);

const StatPreview = ({ icon, label, value, helper }) => (
  <div className="rounded-2xl border border-white bg-white/80 p-5 shadow-md backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-xl">
    <div className="flex items-center justify-between text-sm text-teal-700">
      <span>{label}</span>
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100">
        {icon}
      </span>
    </div>
    <p className="mt-3 text-3xl font-semibold text-gray-900">{value}</p>
    <p className="text-xs uppercase tracking-wide text-teal-500">{helper}</p>
  </div>
);

export default ProvostDashboard;
