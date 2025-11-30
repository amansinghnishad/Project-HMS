import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaBell,
  FaChevronLeft,
  FaChevronRight,
  FaExclamationTriangle,
  FaEye,
  FaSearch,
  FaSpinner,
  FaTimes,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import NoticeViewer from "../../../components/NoticeViewer/NoticeViewer";
import { noticeService } from "../../../services/api";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
];

const StudentNotices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalNotices: 0,
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const loadNotices = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const response = await noticeService.fetchReceivedNotices({
        page,
        limit: 20,
      });

      if (response?.success) {
        setNotices(response.data || []);
        const serverPagination = response.pagination || {};
        setPagination({
          currentPage: serverPagination.currentPage || page,
          totalPages: serverPagination.totalPages || 1,
          totalNotices:
            serverPagination.totalNotices || serverPagination.total || 0,
        });
      } else {
        toast.error(response?.message || "Failed to load notices");
      }
    } catch (error) {
      console.error("Error loading notices:", error);
      toast.error("Error loading notices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  const handleCloseNoticeViewer = useCallback(() => {
    setSelectedNotice(null);
  }, []);

  useEffect(() => {
    if (!selectedNotice) {
      document.body.style.overflow = "";
      return undefined;
    }

    const handleKeyPress = (event) => {
      if (event.key === "Escape") {
        handleCloseNoticeViewer();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
      document.body.style.overflow = "";
    };
  }, [handleCloseNoticeViewer, selectedNotice]);

  const handleNoticeClick = useCallback(async (notice) => {
    setSelectedNotice(notice);

    if (notice?.isRead) {
      return;
    }

    try {
      const response = await noticeService.markNoticeAsRead(notice._id);
      if (response?.success) {
        const readAt = new Date().toISOString();
        setNotices((prev) =>
          prev.map((item) =>
            item._id === notice._id ? { ...item, isRead: true, readAt } : item
          )
        );
        setSelectedNotice((current) =>
          current && current._id === notice._id
            ? { ...current, isRead: true, readAt }
            : current
        );
      }
    } catch (error) {
      console.error("Error marking notice as read:", error);
    }
  }, []);

  const availableTypes = useMemo(() => {
    const typeSet = new Set();
    notices.forEach((notice) => {
      if (notice?.noticeType) {
        typeSet.add(notice.noticeType);
      }
    });
    return ["all", ...Array.from(typeSet)];
  }, [notices]);

  const filteredNotices = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return notices
      .filter((notice) => {
        if (statusFilter === "unread" && notice.isRead) {
          return false;
        }
        if (statusFilter === "read" && !notice.isRead) {
          return false;
        }
        if (typeFilter !== "all" && notice.noticeType !== typeFilter) {
          return false;
        }
        if (!normalizedSearch) {
          return true;
        }

        const haystack = `${notice.subject || ""} ${notice.message || ""} ${
          notice.actionRequired || ""
        }`.toLowerCase();
        return haystack.includes(normalizedSearch);
      })
      .sort((a, b) => {
        const left = new Date(a.createdAt).getTime();
        const right = new Date(b.createdAt).getTime();
        return Number.isNaN(right) ? -1 : right - left;
      });
  }, [notices, searchTerm, statusFilter, typeFilter]);

  const summary = useMemo(() => {
    if (!notices.length) {
      return {
        total: 0,
        unread: 0,
        urgent: 0,
        lastPublished: null,
      };
    }

    let latest = null;
    let unread = 0;
    let urgent = 0;

    notices.forEach((notice) => {
      if (!notice.isRead) {
        unread += 1;
      }
      if (notice.isUrgent) {
        urgent += 1;
      }
      const timestamp = new Date(notice.createdAt).getTime();
      if (timestamp && (!latest || timestamp > latest)) {
        latest = timestamp;
      }
    });

    return {
      total: notices.length,
      unread,
      urgent,
      lastPublished: latest,
    };
  }, [notices]);

  const filterApplied =
    statusFilter !== "all" || typeFilter !== "all" || searchTerm.trim();

  const handlePageChange = (targetPage) => {
    if (targetPage < 1 || targetPage > pagination.totalPages || loading) {
      return;
    }
    loadNotices(targetPage);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="rounded-3xl bg-white p-6 shadow-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                <FaBell size={24} />
              </span>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
                  Student notices
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Stay informed about announcements, alerts, and required
                  actions.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => handlePageChange(pagination.currentPage)}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-200 px-4 py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FaSpinner className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
              {summary.unread > 0 ? (
                <span className="inline-flex items-center justify-center rounded-2xl bg-red-100 px-4 py-2 text-xs font-semibold text-red-700">
                  {summary.unread} unread
                </span>
              ) : null}
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-xl">
          <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 md:text-xl">
                Browse notices
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Filter by status, type, or search within the current batch.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              {STATUS_FILTERS.map((option) => {
                const isActive = statusFilter === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatusFilter(option.value)}
                    className={`rounded-2xl px-4 py-2 font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                      isActive
                        ? "bg-blue-600 text-white shadow-lg"
                        : "border border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-600"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </header>

          <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search subject, summary, or action"
                className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-9 pr-4 text-sm text-gray-700 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                Type
                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {availableTypes.map((type) => (
                    <option key={type} value={type}>
                      {type === "all" ? "All" : type}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("all");
                  setTypeFilter("all");
                  setSearchTerm("");
                }}
                disabled={!filterApplied}
                className="inline-flex items-center justify-center rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Clear filters
              </button>
            </div>
          </div>

          <div className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 p-12 text-sm text-gray-600">
                <FaSpinner className="mr-2 animate-spin" /> Fetching notices...
              </div>
            ) : filteredNotices.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-blue-200 bg-blue-50/40 p-10 text-center text-sm text-gray-600">
                No notices found for the selected filters.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotices.map((notice) => {
                  const isUnread = !notice.isRead;
                  const typeStyles = getNoticeTypeStyles(notice.noticeType);

                  return (
                    <article
                      key={notice._id}
                      className={`rounded-2xl border p-4 transition hover:shadow-md ${
                        isUnread
                          ? "border-orange-200 bg-orange-50/40"
                          : "border-gray-100 bg-white"
                      }`}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${typeStyles.badge}`}
                            >
                              {typeStyles.icon}
                              {notice.noticeType || "General"}
                            </span>
                            {notice.isUrgent ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                                <FaExclamationTriangle /> Urgent
                              </span>
                            ) : null}
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                                isUnread
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {isUnread ? "Unread" : "Read"}
                            </span>
                          </div>

                          <h3 className="mt-3 text-base font-semibold text-gray-900">
                            {notice.subject || "Untitled notice"}
                          </h3>
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                            {notice.message || "No summary available."}
                          </p>

                          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                            <span>
                              Posted {formatDateDisplay(notice.createdAt)}
                            </span>
                            {notice.readAt ? (
                              <span>
                                Read {formatDateDisplay(notice.readAt)}
                              </span>
                            ) : null}
                            {notice.actionRequired ? (
                              <span className="inline-flex items-center gap-1 text-amber-600">
                                <FaExclamationTriangle size={10} /> Action
                                required
                              </span>
                            ) : null}
                          </div>

                          {notice.actionRequired ? (
                            <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-700">
                              <strong>Action:</strong> {notice.actionRequired}
                            </div>
                          ) : null}
                        </div>

                        <div className="flex items-center justify-end gap-3 self-start lg:self-auto">
                          <button
                            type="button"
                            onClick={() => handleNoticeClick(notice)}
                            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          >
                            <FaEye size={12} /> View
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {pagination.totalPages > 1 ? (
            <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/70 p-4 text-sm text-gray-600 sm:flex-row sm:justify-between">
              <p>
                Page {pagination.currentPage} of {pagination.totalPages}
                {pagination.totalNotices
                  ? ` • ${pagination.totalNotices} notices total`
                  : ""}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1 || loading}
                  className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 font-semibold text-gray-600 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FaChevronLeft /> Prev
                </button>
                <span className="rounded-xl bg-white px-3 py-2 font-semibold text-blue-600">
                  {pagination.currentPage}
                </span>
                <button
                  type="button"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={
                    pagination.currentPage === pagination.totalPages || loading
                  }
                  className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 font-semibold text-gray-600 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Next <FaChevronRight />
                </button>
              </div>
            </div>
          ) : null}

          {filterApplied ? (
            <p className="mt-4 text-xs text-gray-500">
              Filters and search apply to the notices in the currently loaded
              page.
            </p>
          ) : null}
        </section>
      </div>

      {selectedNotice ? (
        <NoticeViewer
          notice={selectedNotice}
          isOpen
          onClose={handleCloseNoticeViewer}
        />
      ) : null}
    </div>
  );
};

const getNoticeTypeStyles = (type) => {
  switch (type) {
    case "Behavioral Warning":
      return {
        badge: "bg-yellow-100 text-yellow-700",
        icon: <FaExclamationTriangle className="text-yellow-500" size={12} />,
      };
    case "Academic Warning":
      return {
        badge: "bg-orange-100 text-orange-700",
        icon: <FaExclamationTriangle className="text-orange-500" size={12} />,
      };
    case "Disciplinary Action":
      return {
        badge: "bg-rose-100 text-rose-700",
        icon: <FaTimes className="text-rose-500" size={12} />,
      };
    case "General Notice":
      return {
        badge: "bg-blue-100 text-blue-700",
        icon: <FaBell className="text-blue-500" size={12} />,
      };
    default:
      return {
        badge: "bg-gray-100 text-gray-700",
        icon: <FaBell className="text-gray-500" size={12} />,
      };
  }
};

const formatDateDisplay = (value) => {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default StudentNotices;
