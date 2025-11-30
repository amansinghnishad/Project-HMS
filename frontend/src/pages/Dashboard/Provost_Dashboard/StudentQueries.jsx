import React, { useEffect, useMemo, useState } from "react";
import {
  FaBed,
  FaCalendarAlt,
  FaEnvelope,
  FaExclamationTriangle,
  FaSearch,
  FaSync,
  FaUser,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import Pagination from "../../../components/common/Pagination";
import { apiConnector } from "../../../services/apiconnector";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = {
  maintenance: [
    { value: "pending", label: "Pending" },
    { value: "in-progress", label: "In progress" },
    { value: "completed", label: "Completed" },
  ],
  leave: [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ],
  feedback: [
    { value: "pending", label: "Pending" },
    { value: "in-progress", label: "In progress" },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" },
  ],
};

const DEFAULT_STATUS = {
  maintenance: "completed",
  leave: "approved",
  feedback: "resolved",
};

const StudentQueries = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchRequests = async (showToast = false) => {
    setError(null);
    if (showToast) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required. Please sign in again.");
      }

      const headers = { Authorization: `Bearer ${token}` };
      const [maintenanceRes, leaveRes, feedbackRes] = await Promise.all([
        apiConnector("GET", "/service-requests/all", null, headers),
        apiConnector("GET", "/leave/all", null, headers),
        apiConnector("GET", "/feedback/all", null, headers),
      ]);

      const maintenanceItems = (maintenanceRes?.data?.data || []).map(
        (item) => ({
          id: item._id,
          raw: item,
          type: "maintenance",
          typeLabel: "Maintenance",
          studentName: item.userId?.name || "Not available",
          studentEmail: item.userId?.email || "Not available",
          studentRoom: item.userId?.studentProfile?.roomNumber || "—",
          submittedAt: item.createdAt,
          status: (item.status || "pending").toLowerCase(),
          subject: item.issueType || item.category || "Maintenance request",
          summary: item.description || "No description provided.",
          attachments: item.photoUrl ? [item.photoUrl] : [],
        })
      );

      const leaveItems = (leaveRes?.data?.data || []).map((item) => ({
        id: item._id,
        raw: item,
        type: "leave",
        typeLabel: "Leave",
        studentName: item.studentId?.name || "Not available",
        studentEmail: item.studentId?.email || "Not available",
        studentRoom: item.studentId?.studentProfile?.roomNumber || "—",
        submittedAt: item.createdAt,
        status: (item.status || "pending").toLowerCase(),
        subject: item.reason || "Leave request",
        summary: buildLeaveSummary(item),
        attachments: [],
      }));

      const feedbackItems = (feedbackRes?.data?.data || []).map((item) => ({
        id: item._id,
        raw: item,
        type: "feedback",
        typeLabel: "Feedback",
        studentName: item.userId?.name || "Anonymous",
        studentEmail: item.userId?.email || "Not available",
        studentRoom: item.userId?.studentProfile?.roomNumber || "—",
        submittedAt: item.createdAt,
        status: (item.status || "pending").toLowerCase(),
        subject: item.subject || item.feedbackType || "Feedback",
        summary: item.message || "No message provided.",
        attachments: [],
      }));

      const combined = [
        ...maintenanceItems,
        ...leaveItems,
        ...feedbackItems,
      ].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

      setRequests(combined);
      if (showToast) {
        toast.success("Requests refreshed.");
      }
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to load student queries.";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, statusFilter]);

  useEffect(() => {
    if (!selectedRequest) {
      return;
    }
    const stillPresent = requests.some(
      (item) => item.id === selectedRequest.id
    );
    if (!stillPresent) {
      setSelectedRequest(null);
    }
  }, [requests, selectedRequest]);

  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      const matchesType = typeFilter === "all" || item.type === typeFilter;
      const matchesStatus = matchStatusFilter(item.status, statusFilter);
      const matchesSearch = matchSearch(item, searchTerm);
      return matchesType && matchesStatus && matchesSearch;
    });
  }, [requests, typeFilter, statusFilter, searchTerm]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRequests.length / PAGE_SIZE)
  );
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedRequests = filteredRequests.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center rounded-2xl border border-emerald-100 bg-white">
        <div className="flex items-center gap-3 text-emerald-700">
          <span className="h-3 w-3 animate-ping rounded-full bg-emerald-500" />
          <span className="text-sm font-medium">Loading student queries…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
        <FaExclamationTriangle className="mx-auto mb-3 h-8 w-8" />
        <p className="text-base font-semibold">Unable to load queries</p>
        <p className="mt-2 text-sm opacity-80">{error}</p>
        <button
          type="button"
          onClick={() => fetchRequests(false)}
          className="mt-4 rounded-lg border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-emerald-100 bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
              Provost dashboard
            </p>
            <h1 className="mt-1 text-xl font-semibold text-emerald-900">
              Student Queries
            </h1>
            <p className="text-xs text-emerald-600">
              Review maintenance, leave, and feedback requests in one place.
            </p>
          </div>
          <button
            type="button"
            onClick={() => fetchRequests(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:text-emerald-300"
          >
            <FaSync className={isRefreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <div className="relative lg:col-span-1">
            <FaSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-emerald-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by student, email, ID, or summary"
              className="w-full rounded-xl border border-emerald-100 bg-emerald-50/30 py-2.5 pl-9 pr-3 text-sm text-emerald-900 placeholder:text-emerald-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:col-span-2">
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="w-full rounded-xl border border-emerald-100 bg-emerald-50/30 px-3 py-2.5 text-sm text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            >
              <option value="all">All request types</option>
              <option value="maintenance">Maintenance</option>
              <option value="leave">Leave</option>
              <option value="feedback">Feedback</option>
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-xl border border-emerald-100 bg-emerald-50/30 px-3 py-2.5 text-sm text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In progress</option>
              <option value="resolved">Resolved / Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white">
        {filteredRequests.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 p-6 text-emerald-600">
            <p className="text-sm font-medium">No matching requests</p>
            <p className="text-xs opacity-70">
              Adjust the filters or search term to see results.
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-emerald-50 text-sm text-emerald-900">
            <thead className="bg-emerald-50/60 text-left text-xs font-semibold uppercase tracking-wide text-emerald-600">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Request</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 hidden md:table-cell">Submitted</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50">
              {paginatedRequests.map((item, index) => (
                <RequestRow
                  key={item.id}
                  index={startIndex + index}
                  request={item}
                  onSelect={setSelectedRequest}
                />
              ))}
            </tbody>
          </table>
        )}
      </section>

      <Pagination
        currentPage={currentPage}
        pageSize={PAGE_SIZE}
        totalItems={filteredRequests.length}
        onPageChange={setCurrentPage}
      />

      {selectedRequest ? (
        <RequestDrawer
          request={selectedRequest}
          onDismiss={() => setSelectedRequest(null)}
          onUpdate={async (payload) =>
            handleStatusUpdate(selectedRequest, payload)
          }
        />
      ) : null}
    </div>
  );

  async function handleStatusUpdate(request, payload) {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required. Please sign in again.");
      }

      const headers = { Authorization: `Bearer ${token}` };
      let endpoint = "";
      const body = { status: payload.status };

      if (request.type === "maintenance") {
        endpoint = `/service-requests/resolve/${request.id}`;
        if (payload.resolution?.trim()) {
          body.resolution = payload.resolution.trim();
        }
      } else if (request.type === "leave") {
        endpoint = `/leave/resolve/${request.id}`;
        if (payload.provostComments?.trim()) {
          body.provostComments = payload.provostComments.trim();
        }
      } else if (request.type === "feedback") {
        endpoint = `/feedback/resolve/${request.id}`;
        if (payload.response?.trim()) {
          body.response = payload.response.trim();
        }
      }

      const { data } = await apiConnector("PUT", endpoint, body, headers);

      if (!data?.success) {
        throw new Error(data?.message || "Failed to update request.");
      }

      setRequests((prev) =>
        prev.map((item) =>
          item.id === request.id ? { ...item, status: payload.status } : item
        )
      );
      setSelectedRequest((current) =>
        current && current.id === request.id
          ? { ...current, status: payload.status }
          : current
      );

      toast.success(data?.message || "Request updated.");
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to update.";
      toast.error(message);
      throw err;
    }
  }
};

const RequestRow = ({ index, request, onSelect }) => {
  return (
    <tr className="hover:bg-emerald-50/40">
      <td className="px-4 py-3 text-xs font-semibold text-emerald-500">
        {index + 1}
      </td>
      <td className="px-4 py-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-emerald-900">
            {request.typeLabel}
          </p>
          <p className="text-xs text-emerald-500 line-clamp-1">
            {request.subject}
          </p>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="space-y-1">
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-900">
            <FaUser className="text-emerald-400" />
            <span>{request.studentName}</span>
          </p>
          <p className="flex items-center gap-2 text-xs text-emerald-500">
            <FaEnvelope className="text-emerald-300" />
            <span className="truncate">{request.studentEmail}</span>
          </p>
          <p className="flex items-center gap-2 text-xs text-emerald-500">
            <FaBed className="text-emerald-300" />
            <span>{request.studentRoom}</span>
          </p>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={statusBadgeClass(request.status)}>
          {formatStatus(request.status)}
        </span>
      </td>
      <td className="hidden px-4 py-3 text-xs text-emerald-600 md:table-cell">
        <div className="flex items-center gap-2">
          <FaCalendarAlt className="text-emerald-300" />
          <span>{formatDate(request.submittedAt)}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          onClick={() => onSelect(request)}
          className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50"
        >
          View
        </button>
      </td>
    </tr>
  );
};

const RequestDrawer = ({ request, onDismiss, onUpdate }) => {
  const [formState, setFormState] = useState(() => buildInitialState(request));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormState(buildInitialState(request));
  }, [request]);

  const options = STATUS_OPTIONS[request.type] || [];

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formState.status) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdate(formState);
      onDismiss();
    } catch (err) {
      // Errors already surfaced via toast; keep drawer open for correction.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 px-4 pb-6 sm:items-center">
      <div className="w-full max-w-lg rounded-2xl border border-emerald-100 bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-emerald-50 p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
              {request.typeLabel}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-emerald-900">
              {request.subject}
            </h2>
            <p className="text-xs text-emerald-600">#{request.id.slice(-8)}</p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-full border border-emerald-100 px-3 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50"
          >
            Close
          </button>
        </div>

        <div className="grid gap-4 p-6 text-sm text-emerald-900">
          <DrawerDetail label="Student">
            <span className="font-semibold">{request.studentName}</span>
            <span className="mt-1 block text-xs text-emerald-500">
              {request.studentEmail}
            </span>
          </DrawerDetail>
          <DrawerDetail label="Room">{request.studentRoom}</DrawerDetail>
          <DrawerDetail label="Submitted on">
            {formatDate(request.submittedAt)}
          </DrawerDetail>
          <DrawerDetail label="Summary">{request.summary}</DrawerDetail>
          {request.attachments.length > 0 ? (
            <DrawerDetail label="Attachments">
              {request.attachments.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-emerald-600 underline"
                >
                  View attachment
                </a>
              ))}
            </DrawerDetail>
          ) : null}
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-t border-emerald-50 p-6"
        >
          <label className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
            Update status
          </label>
          <select
            value={formState.status}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, status: event.target.value }))
            }
            className="mt-2 w-full rounded-xl border border-emerald-100 bg-emerald-50/40 px-3 py-2.5 text-sm text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            required
          >
            <option value="">Select status</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {request.type === "maintenance" ? (
            <textarea
              value={formState.resolution}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  resolution: event.target.value,
                }))
              }
              placeholder="Add resolution details"
              className="mt-3 h-24 w-full rounded-xl border border-emerald-100 bg-emerald-50/40 px-3 py-2 text-sm text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          ) : null}

          {request.type === "leave" ? (
            <textarea
              value={formState.provostComments}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  provostComments: event.target.value,
                }))
              }
              placeholder="Add comments for the student"
              className="mt-3 h-24 w-full rounded-xl border border-emerald-100 bg-emerald-50/40 px-3 py-2 text-sm text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          ) : null}

          {request.type === "feedback" ? (
            <textarea
              value={formState.response}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  response: event.target.value,
                }))
              }
              placeholder="Write a response"
              className="mt-3 h-24 w-full rounded-xl border border-emerald-100 bg-emerald-50/40 px-3 py-2 text-sm text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          ) : null}

          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              {isSubmitting ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DrawerDetail = ({ label, children }) => (
  <div className="rounded-xl bg-emerald-50/40 p-3">
    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
      {label}
    </p>
    <div className="mt-1 text-sm font-medium text-emerald-900">{children}</div>
  </div>
);

const matchStatusFilter = (status, filter) => {
  if (filter === "all") {
    return true;
  }
  const value = (status || "pending").toLowerCase();
  if (filter === "resolved") {
    return ["resolved", "completed", "approved"].includes(value);
  }
  return value === filter;
};

const matchSearch = (item, term) => {
  if (!term.trim()) {
    return true;
  }
  const query = term.trim().toLowerCase();
  return [
    item.studentName,
    item.studentEmail,
    item.subject,
    item.summary,
    item.id,
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase())
    .some((value) => value.includes(query));
};

const formatStatus = (status) => {
  if (!status) {
    return "Pending";
  }
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const statusBadgeClass = (status) => {
  const value = (status || "pending").toLowerCase();
  switch (value) {
    case "pending":
      return "inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700";
    case "in-progress":
      return "inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700";
    case "resolved":
    case "completed":
    case "approved":
      return "inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700";
    case "rejected":
      return "inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700";
    default:
      return "inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700";
  }
};

const formatDate = (value) => {
  if (!value) {
    return "—";
  }
  try {
    const date = new Date(value);
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch (err) {
    return "—";
  }
};

const buildInitialState = (request) => ({
  status: (
    request.status ||
    DEFAULT_STATUS[request.type] ||
    STATUS_OPTIONS[request.type]?.[0]?.value ||
    "pending"
  )
    .toString()
    .toLowerCase(),
  resolution: "",
  provostComments: "",
  response: "",
});

const formatShortDate = (value) => {
  if (!value) {
    return "—";
  }
  try {
    const date = new Date(value);
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch (err) {
    return "—";
  }
};

const buildLeaveSummary = (item) => {
  const from = item.fromDate ? formatShortDate(item.fromDate) : null;
  const to = item.toDate ? formatShortDate(item.toDate) : null;
  if (from && to) {
    return `${item.reason || "Leave request"} (${from} – ${to})`;
  }
  return item.reason || "Leave request";
};

export default StudentQueries;
