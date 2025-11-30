import React, { useEffect, useMemo, useState } from "react";
import {
  FaBullhorn,
  FaPlus,
  FaSync,
  FaSearch,
  FaStar,
  FaRegFileAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaEye,
  FaEdit,
  FaTrash,
  FaSpinner,
  FaCalendarAlt,
  FaPaperclip,
  FaTimes,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import Pagination from "../../../components/common/Pagination";
import NoticeViewer from "../../../components/NoticeViewer/NoticeViewer";
import { publicNoticeService } from "../../../services/api/publicNoticeService";

const PAGE_SIZE = 10;

const CATEGORY_OPTIONS = [
  "General",
  "Academic",
  "Administrative",
  "Events",
  "Facilities",
  "Emergency",
];

const STATUS_OPTIONS = ["draft", "published", "archived"];

const NOTICE_TEMPLATES = [
  {
    id: 1,
    name: "General announcement",
    category: "General",
    title: "General announcement",
    content:
      "This is to inform all students about [announcement details]. Please take note and follow the instructions accordingly.",
  },
  {
    id: 2,
    name: "Maintenance notice",
    category: "Facilities",
    title: "Scheduled maintenance",
    content:
      "There will be scheduled maintenance of [facility/service] on [date] from [time] to [time]. Please plan accordingly.",
  },
  {
    id: 3,
    name: "Event update",
    category: "Events",
    title: "Upcoming event",
    content:
      "We are pleased to announce [event name] scheduled for [date] at [time]. Add the event to your calendar to stay informed.",
  },
  {
    id: 4,
    name: "Urgent alert",
    category: "Emergency",
    title: "Urgent notice",
    content:
      "URGENT: [Urgent matter details]. Immediate action required. Please review the instructions attached to this notice.",
    isImportant: true,
  },
];

const createEmptyForm = () => ({
  title: "",
  content: "",
  category: "General",
  effectiveDate: "",
  expiryDate: "",
  isImportant: false,
  status: "draft",
});

const PublicNotice = () => {
  const [notices, setNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [formData, setFormData] = useState(createEmptyForm);
  const [attachments, setAttachments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [error, setError] = useState(null);

  const loadNotices = async () => {
    const response = await publicNoticeService.fetchAllNotices();
    setNotices(response?.notices || []);
  };

  useEffect(() => {
    const bootstrap = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await loadNotices();
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to load public notices.";
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter]);

  useEffect(() => {
    if (!isFormOpen) {
      document.body.style.overflow = "";
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        handleCloseForm();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isFormOpen]);

  const stats = useMemo(() => {
    const now = new Date();
    const total = notices.length;
    const published = notices.filter(
      (notice) => (notice.status || "").toLowerCase() === "published"
    ).length;
    const drafts = notices.filter(
      (notice) => (notice.status || "").toLowerCase() === "draft"
    ).length;
    const important = notices.filter((notice) => notice.isImportant).length;
    const expired = notices.filter((notice) => {
      if (!notice.expiryDate) {
        return false;
      }
      return new Date(notice.expiryDate) < now;
    }).length;
    return { total, published, drafts, important, expired };
  }, [notices]);

  const filteredNotices = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return notices
      .filter((notice) => {
        const matchesQuery = query
          ? [notice.title, notice.content, notice.category]
              .filter(Boolean)
              .map((value) => value.toLowerCase())
              .some((value) => value.includes(query))
          : true;

        if (!matchesQuery) {
          return false;
        }

        if (statusFilter !== "all") {
          const status = (notice.status || "").toLowerCase();
          if (status !== statusFilter) {
            return false;
          }
        }

        if (categoryFilter !== "all") {
          const category = notice.category || "General";
          if (category !== categoryFilter) {
            return false;
          }
        }

        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );
  }, [notices, searchTerm, statusFilter, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredNotices.length / PAGE_SIZE));
  const paginatedNotices = filteredNotices.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadNotices();
      toast.success("Public notices refreshed.");
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to refresh notices.";
      toast.error(message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    setAttachments(files);
  };

  const applyTemplate = (template) => {
    setFormData((prev) => ({
      ...prev,
      title: template.title,
      content: template.content,
      category: template.category,
      isImportant: Boolean(template.isImportant),
    }));
    setShowTemplates(false);
    toast.success(`Template "${template.name}" applied.`);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleEdit = (notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title || "",
      content: notice.content || "",
      category: notice.category || "General",
      effectiveDate: notice.effectiveDate
        ? new Date(notice.effectiveDate).toISOString().split("T")[0]
        : "",
      expiryDate: notice.expiryDate
        ? new Date(notice.expiryDate).toISOString().split("T")[0]
        : "",
      isImportant: Boolean(notice.isImportant),
      status: notice.status || "draft",
    });
    setAttachments([]);
    setIsFormOpen(true);
  };

  const handleDelete = async (noticeId) => {
    if (!window.confirm("Delete this notice?")) {
      return;
    }

    try {
      await publicNoticeService.deleteNotice(noticeId);
      toast.success("Notice deleted.");
      await loadNotices();
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to delete.";
      toast.error(message);
    }
  };

  const handlePublish = async (noticeId) => {
    if (
      !window.confirm(
        "Publish this notice? It will become visible to all users."
      )
    ) {
      return;
    }

    try {
      await publicNoticeService.publishNotice(noticeId);
      toast.success("Notice published.");
      await loadNotices();
      window.dispatchEvent(new CustomEvent("refreshNoticeBoard"));
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to publish.";
      toast.error(message);
    }
  };

  const handleSubmit = async (event, overrideStatus) => {
    event.preventDefault();
    if (typeof event.stopPropagation === "function") {
      event.stopPropagation();
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Title and content are required.");
      return;
    }

    if (!formData.effectiveDate) {
      toast.error("Select the effective date for the notice.");
      return;
    }

    const nextStatus = overrideStatus || formData.status || "draft";
    setIsSubmitting(true);
    const payload = new FormData();
    Object.entries({ ...formData, status: nextStatus }).forEach(
      ([key, value]) => {
        payload.append(key, value ?? "");
      }
    );
    attachments.forEach((file) => payload.append("attachments", file));

    try {
      if (editingNotice) {
        await publicNoticeService.updateNotice(editingNotice._id, payload);
        toast.success("Notice updated.");
      } else {
        await publicNoticeService.createNotice(payload);
        toast.success("Notice created.");
      }

      await loadNotices();
      handleCloseForm();
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        (editingNotice
          ? "Failed to update notice."
          : "Failed to create notice.");
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewNotice = (notice) => {
    const payload = {
      _id: notice._id || notice.id,
      title: notice.title || "",
      content: notice.content || "",
      category: notice.category || "General",
      isImportant: Boolean(notice.isImportant),
      effectiveDate: notice.effectiveDate,
      expiryDate: notice.expiryDate,
      status: notice.status || "draft",
      attachments: notice.attachments || [],
      createdAt: notice.createdAt,
      updatedAt: notice.updatedAt,
    };
    setSelectedNotice(payload);
  };

  const handleCloseNoticeViewer = () => {
    setSelectedNotice(null);
  };

  const resetForm = () => {
    setFormData(createEmptyForm());
    setAttachments([]);
    setEditingNotice(null);
    setShowTemplates(false);
  };

  const handleCloseForm = () => {
    resetForm();
    setIsFormOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center rounded-2xl border border-emerald-100 bg-white">
        <div className="flex items-center gap-3 text-emerald-700">
          <span className="h-3 w-3 animate-ping rounded-full bg-emerald-500" />
          <span className="text-sm font-medium">Loading public notices...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
        <p className="text-base font-semibold">Unable to load public notices</p>
        <p className="mt-2 text-sm opacity-80">{error}</p>
        <button
          type="button"
          onClick={handleRefresh}
          className="mt-4 rounded-lg border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-emerald-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-emerald-900">
          <FaBullhorn className="h-4 w-4 text-emerald-500" />
          <h1 className="text-lg font-semibold">Public notices</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:text-emerald-300"
          >
            <FaSync className={isRefreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600"
          >
            <FaPlus />
            New notice
          </button>
        </div>
      </header>

      <section className="flex flex-wrap gap-2">
        <StatPill
          label="Total"
          value={stats.total}
          icon={<FaRegFileAlt className="h-3.5 w-3.5" />}
        />
        <StatPill
          label="Published"
          value={stats.published}
          icon={<FaCheckCircle className="h-3.5 w-3.5" />}
          tone="emerald"
        />
        <StatPill
          label="Drafts"
          value={stats.drafts}
          icon={<FaRegFileAlt className="h-3.5 w-3.5" />}
          tone="sky"
        />
        <StatPill
          label="Important"
          value={stats.important}
          icon={<FaStar className="h-3.5 w-3.5" />}
          tone="amber"
        />
        <StatPill
          label="Expired"
          value={stats.expired}
          icon={<FaExclamationTriangle className="h-3.5 w-3.5" />}
          tone="rose"
        />
      </section>

      <section className="rounded-2xl border border-emerald-100 bg-white">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-emerald-900">
            Notice history
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <FaSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-emerald-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by title or content"
                className="w-full rounded-xl border border-emerald-100 bg-emerald-50/30 py-2.5 pl-9 pr-3 text-sm text-emerald-900 placeholder:text-emerald-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-emerald-100 bg-emerald-50/30 px-3 py-2.5 text-sm text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            >
              <option value="all">All statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="rounded-xl border border-emerald-100 bg-emerald-50/30 px-3 py-2.5 text-sm text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            >
              <option value="all">All categories</option>
              {CATEGORY_OPTIONS.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredNotices.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 p-6 text-emerald-600">
            <p className="text-sm font-medium">No notices match the filters</p>
            <p className="text-xs opacity-70">
              Adjust the filters or create a new notice to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-emerald-50 text-sm text-emerald-900">
              <thead className="bg-emerald-50/60 text-left text-xs font-semibold uppercase tracking-wide text-emerald-600">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Notice</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Effective</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {paginatedNotices.map((notice, index) => {
                  const rowNumber = (currentPage - 1) * PAGE_SIZE + index + 1;
                  const isExpired = Boolean(
                    notice.expiryDate &&
                      new Date(notice.expiryDate) < new Date()
                  );
                  const isScheduled = Boolean(
                    notice.effectiveDate &&
                      new Date(notice.effectiveDate) > new Date()
                  );

                  return (
                    <tr key={notice._id} className="hover:bg-emerald-50/40">
                      <td className="px-4 py-3 text-xs font-semibold text-emerald-500">
                        {rowNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-emerald-900">
                            {notice.title || "Untitled notice"}
                          </p>
                          {notice.isImportant ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-700">
                              <FaStar className="h-3 w-3" />
                              Important
                            </span>
                          ) : null}
                          {Array.isArray(notice.attachments) &&
                          notice.attachments.length > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-600">
                              <FaPaperclip className="h-3 w-3" />
                              {notice.attachments.length}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-emerald-500 line-clamp-1">
                          {notice.content || "No description provided."}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={categoryBadgeClass(notice.category)}>
                          {notice.category || "General"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-emerald-500">
                        {formatDate(notice.effectiveDate)}
                        {notice.expiryDate ? (
                          <div className="text-[11px] text-emerald-400">
                            Expires {formatDate(notice.expiryDate)}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={statusBadgeClass(notice.status)}>
                            {formatStatus(notice.status)}
                          </span>
                          {isExpired ? (
                            <span className="text-[11px] font-semibold text-rose-600">
                              Expired
                            </span>
                          ) : isScheduled ? (
                            <span className="text-[11px] font-semibold text-sky-600">
                              Scheduled
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewNotice(notice)}
                            className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50"
                          >
                            <FaEye className="h-3.5 w-3.5" />
                            View
                          </button>
                          {String(notice.status).toLowerCase() === "draft" ? (
                            <button
                              type="button"
                              onClick={() => handlePublish(notice._id)}
                              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600"
                            >
                              <FaCheckCircle className="h-3.5 w-3.5" />
                              Publish
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => handleEdit(notice)}
                            className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50"
                          >
                            <FaEdit className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(notice._id)}
                            className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:border-rose-300 hover:bg-rose-50"
                          >
                            <FaTrash className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          pageSize={PAGE_SIZE}
          totalItems={filteredNotices.length}
          onPageChange={setCurrentPage}
        />
      </section>

      {isFormOpen ? (
        <Modal onClose={handleCloseForm}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-emerald-900">
                {editingNotice ? "Edit notice" : "Create notice"}
              </h2>
              <p className="text-xs text-emerald-600">
                Provide the announcement details and publish when ready.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCloseForm}
              className="rounded-lg border border-emerald-100 p-2 text-emerald-500 transition hover:border-emerald-200 hover:text-emerald-700"
            >
              <FaTimes />
            </button>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowTemplates((state) => !state)}
              className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              {showTemplates ? "Hide templates" : "Show templates"}
            </button>

            {showTemplates ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {NOTICE_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => applyTemplate(template)}
                    className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 text-left text-xs font-medium text-emerald-800 transition hover:border-emerald-200 hover:bg-emerald-50"
                  >
                    <p>{template.name}</p>
                    <p className="mt-1 text-[11px] text-emerald-500">
                      {template.category}
                    </p>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
                  Title
                </span>
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  placeholder="Enter a concise title"
                  className="mt-2 w-full rounded-xl border border-emerald-100 bg-emerald-50/30 px-3 py-2.5 text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  required
                />
              </label>
              <label className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
                  Category
                </span>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  className="mt-2 w-full rounded-xl border border-emerald-100 bg-emerald-50/30 px-3 py-2.5 text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  required
                >
                  {CATEGORY_OPTIONS.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
                Content
              </span>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleFormChange}
                rows={6}
                placeholder="Write the main announcement here"
                className="mt-2 w-full rounded-xl border border-emerald-100 bg-emerald-50/30 px-3 py-2.5 text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                required
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
                  Effective date
                </span>
                <input
                  type="date"
                  name="effectiveDate"
                  value={formData.effectiveDate}
                  onChange={handleFormChange}
                  className="mt-2 w-full rounded-xl border border-emerald-100 bg-emerald-50/30 px-3 py-2.5 text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  required
                />
              </label>
              <label className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
                  Expiry date (optional)
                </span>
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleFormChange}
                  className="mt-2 w-full rounded-xl border border-emerald-100 bg-emerald-50/30 px-3 py-2.5 text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>
            </div>

            <label className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
                Attachments (optional)
              </span>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="mt-2 w-full rounded-xl border border-emerald-100 bg-white px-3 py-2.5 text-emerald-900 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-emerald-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
              {attachments.length > 0 ? (
                <div className="mt-2 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-xs text-emerald-700">
                  <p className="font-semibold">
                    {attachments.length} file(s) ready to upload
                  </p>
                  <ul className="mt-1 space-y-1">
                    {attachments.map((file) => (
                      <li key={file.name} className="truncate">
                        {file.name}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {editingNotice?.attachments?.length ? (
                <p className="mt-2 text-[11px] text-emerald-500">
                  This notice has {editingNotice.attachments.length} existing
                  attachment(s). They remain unless you upload replacements.
                </p>
              ) : null}
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 pt-4 text-xs font-semibold text-emerald-600">
                <input
                  type="checkbox"
                  name="isImportant"
                  checked={formData.isImportant}
                  onChange={handleFormChange}
                  className="h-4 w-4 rounded border border-emerald-200 text-emerald-500 focus:ring-emerald-400"
                />
                <span>Mark as important</span>
              </label>
              <label className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
                  Status
                </span>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  className="mt-2 w-full rounded-xl border border-emerald-100 bg-emerald-50/30 px-3 py-2.5 text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    {editingNotice ? "Saving..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <FaCheckCircle />
                    {editingNotice ? "Save as draft" : "Create draft"}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={(event) => handleSubmit(event, "published")}
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <FaBullhorn />
                    {editingNotice ? "Save & publish" : "Publish now"}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50"
              >
                Reset
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {selectedNotice ? (
        <NoticeViewer
          notice={selectedNotice}
          onClose={handleCloseNoticeViewer}
        />
      ) : null}
    </div>
  );
};

const Modal = ({ children, onClose }) => (
  <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 px-4 backdrop-blur-sm">
    <div className="absolute inset-0" aria-hidden="true" onClick={onClose} />
    <div
      className="relative z-10 w-full max-w-3xl rounded-2xl border border-emerald-100 bg-white p-6 shadow-2xl"
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>
  </div>
);

const StatPill = ({ label, value, icon, tone = "emerald" }) => {
  const toneStyles = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    sky: "bg-sky-50 text-sky-700 border-sky-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
  };

  const iconStyles = {
    emerald: "text-emerald-500",
    amber: "text-amber-500",
    sky: "text-sky-500",
    rose: "text-rose-500",
  };

  const style = toneStyles[tone] || toneStyles.emerald;
  const iconClass = iconStyles[tone] || iconStyles.emerald;

  return (
    <div
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${style}`}
    >
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs ${iconClass}`}
      >
        {icon}
      </span>
      <span>{label}</span>
      <span className="text-slate-900">{value}</span>
    </div>
  );
};

const formatDate = (value) => {
  if (!value) {
    return "--";
  }
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch (err) {
    return "--";
  }
};

const formatStatus = (status) => {
  const value = (status || "draft").toLowerCase();
  if (value === "published") {
    return "Published";
  }
  if (value === "archived") {
    return "Archived";
  }
  return "Draft";
};

const statusBadgeClass = (status) => {
  const value = (status || "draft").toLowerCase();
  if (value === "published") {
    return "inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700";
  }
  if (value === "archived") {
    return "inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700";
  }
  return "inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700";
};

const categoryBadgeClass = (category) => {
  switch (category) {
    case "Academic":
      return "inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700";
    case "Administrative":
      return "inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700";
    case "Events":
      return "inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700";
    case "Facilities":
      return "inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700";
    case "Emergency":
      return "inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700";
    default:
      return "inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700";
  }
};

export default PublicNotice;
