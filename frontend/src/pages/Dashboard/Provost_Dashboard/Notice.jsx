import React, { useEffect, useMemo, useState } from "react";
import {
  FaBell,
  FaBullhorn,
  FaCheckCircle,
  FaEdit,
  FaEnvelope,
  FaExclamationTriangle,
  FaEye,
  FaPaperPlane,
  FaPlus,
  FaRegFileAlt,
  FaSearch,
  FaSpinner,
  FaStar,
  FaSync,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import Pagination from "../../../components/common/Pagination";
import NoticeViewer from "../../../components/NoticeViewer/NoticeViewer";
import { noticeService } from "../../../services/api/noticeService";
import { publicNoticeService } from "../../../services/api/publicNoticeService";
import { allotmentService } from "../../../services/api/allotmentService";

const PAGE_SIZE = 10;

const STUDENT_NOTICE_TYPES = [
  "Behavioral Warning",
  "Academic Warning",
  "Disciplinary Action",
  "General Notice",
  "Room Inspection",
  "Fee Notice",
];

const STUDENT_NOTICE_TEMPLATES = [
  {
    id: 1,
    name: "Room inspection",
    type: "Room Inspection",
    subject: "Upcoming room inspection",
    message:
      "Your room will be inspected on [DATE]. Please ensure the space is clean and tidy.",
    actionRequired: "Prepare the room before the inspection window.",
  },
  {
    id: 2,
    name: "Fee reminder",
    type: "Fee Notice",
    subject: "Hostel fee payment due",
    message:
      "Your hostel fee payment is due. Kindly clear the outstanding amount by [DATE].",
    actionRequired: "Complete the fee payment before the deadline.",
  },
  {
    id: 3,
    name: "Behavior advisory",
    type: "Behavioral Warning",
    subject: "Guidance on recent conduct",
    message:
      "This notice addresses a recent incident that does not align with hostel guidelines.",
    actionRequired: "Report to the warden's office within 24 hours.",
  },
];

const PUBLIC_NOTICE_CATEGORY_OPTIONS = [
  "General",
  "Academic",
  "Administrative",
  "Events",
  "Facilities",
  "Emergency",
];

const PUBLIC_NOTICE_STATUS_OPTIONS = ["draft", "published", "archived"];

const PUBLIC_NOTICE_TEMPLATES = [
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

const createStudentForm = () => ({
  recipientId: "",
  noticeType: "",
  subject: "",
  message: "",
  actionRequired: "",
  isUrgent: false,
});

const createPublicForm = () => ({
  title: "",
  content: "",
  category: "General",
  effectiveDate: "",
  expiryDate: "",
  isImportant: false,
  status: "draft",
});

const Notice = () => {
  const [activeTab, setActiveTab] = useState("public");
  const [modalMode, setModalMode] = useState(null);
  const [selectedNotice, setSelectedNotice] = useState(null);

  const [students, setStudents] = useState([]);
  const [studentNotices, setStudentNotices] = useState([]);
  const [studentError, setStudentError] = useState(null);
  const [isStudentLoading, setIsStudentLoading] = useState(true);
  const [isStudentRefreshing, setIsStudentRefreshing] = useState(false);
  const [isStudentSubmitting, setIsStudentSubmitting] = useState(false);
  const [studentFilterType, setStudentFilterType] = useState("all");
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [studentCurrentPage, setStudentCurrentPage] = useState(1);
  const [studentFormData, setStudentFormData] = useState(createStudentForm);
  const [studentQuery, setStudentQuery] = useState("");
  const [studentShowTemplates, setStudentShowTemplates] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [publicNotices, setPublicNotices] = useState([]);
  const [publicError, setPublicError] = useState(null);
  const [isPublicLoading, setIsPublicLoading] = useState(true);
  const [isPublicRefreshing, setIsPublicRefreshing] = useState(false);
  const [isPublicSubmitting, setIsPublicSubmitting] = useState(false);
  const [publicStatusFilter, setPublicStatusFilter] = useState("all");
  const [publicCategoryFilter, setPublicCategoryFilter] = useState("all");
  const [publicSearchTerm, setPublicSearchTerm] = useState("");
  const [publicCurrentPage, setPublicCurrentPage] = useState(1);
  const [publicFormData, setPublicFormData] = useState(createPublicForm);
  const [publicAttachments, setPublicAttachments] = useState([]);
  const [publicShowTemplates, setPublicShowTemplates] = useState(false);
  const [editingPublicNotice, setEditingPublicNotice] = useState(null);

  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      setIsBootstrapping(true);
      await Promise.all([
        loadStudents(),
        loadStudentNotices(),
        loadPublicNotices(),
      ]);
      setIsBootstrapping(false);
    };

    bootstrap();
  }, []);

  useEffect(() => {
    setStudentCurrentPage(1);
  }, [studentFilterType, studentSearchTerm]);

  useEffect(() => {
    setPublicCurrentPage(1);
  }, [publicStatusFilter, publicCategoryFilter, publicSearchTerm]);

  useEffect(() => {
    if (!modalMode) {
      document.body.style.overflow = "";
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        handleCloseModal();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [modalMode]);

  const loadStudents = async () => {
    try {
      const response = await allotmentService.fetchAllottedStudents();
      setStudents(response?.data || []);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to load students for notices.";
      setStudentError((prev) => prev || message);
      toast.error(message);
    }
  };

  const loadStudentNotices = async () => {
    setIsStudentLoading(true);
    setStudentError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required. Please sign in again.");
      }
      const response = await noticeService.fetchSentNotices({
        page: 1,
        limit: 100,
      });
      setStudentNotices(response?.data || []);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to load student notices.";
      setStudentError(message);
      toast.error(message);
    } finally {
      setIsStudentLoading(false);
    }
  };

  const loadPublicNotices = async () => {
    setIsPublicLoading(true);
    setPublicError(null);
    try {
      const response = await publicNoticeService.fetchAllNotices();
      setPublicNotices(response?.notices || []);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to load public notices.";
      setPublicError(message);
      toast.error(message);
    } finally {
      setIsPublicLoading(false);
    }
  };

  const studentOptions = useMemo(() => {
    if (!studentQuery.trim()) {
      return [];
    }
    const query = studentQuery.trim().toLowerCase();
    return students
      .filter((student) => {
        const profile = student.studentProfileId || {};
        const haystack = [
          profile.name,
          profile.rollNumber,
          profile.email,
          student.allottedRoomNumber,
          profile.courseName,
        ]
          .filter(Boolean)
          .map((value) => String(value).toLowerCase());
        return haystack.some((value) => value.includes(query));
      })
      .slice(0, 8);
  }, [students, studentQuery]);

  const studentStats = useMemo(() => {
    const total = studentNotices.length;
    const urgent = studentNotices.filter((notice) => notice.isUrgent).length;
    const resolved = studentNotices.filter((notice) =>
      ["delivered", "read"].includes((notice.status || "").toLowerCase())
    ).length;
    const pending = studentNotices.filter((notice) =>
      ["pending", "sent", ""].includes((notice.status || "sent").toLowerCase())
    ).length;
    return { total, urgent, resolved, pending };
  }, [studentNotices]);

  const publicStats = useMemo(() => {
    const now = new Date();
    const total = publicNotices.length;
    const published = publicNotices.filter(
      (notice) => (notice.status || "").toLowerCase() === "published"
    ).length;
    const drafts = publicNotices.filter(
      (notice) => (notice.status || "").toLowerCase() === "draft"
    ).length;
    const important = publicNotices.filter(
      (notice) => notice.isImportant
    ).length;
    const expired = publicNotices.filter((notice) => {
      if (!notice.expiryDate) {
        return false;
      }
      return new Date(notice.expiryDate) < now;
    }).length;
    return { total, published, drafts, important, expired };
  }, [publicNotices]);

  const filteredStudentNotices = useMemo(() => {
    return studentNotices
      .filter((notice) => {
        const typeMatches =
          studentFilterType === "all" ||
          notice.noticeType === studentFilterType;
        if (!typeMatches) {
          return false;
        }

        if (!studentSearchTerm.trim()) {
          return true;
        }

        const query = studentSearchTerm.trim().toLowerCase();
        const haystack = [
          notice.subject,
          notice.message,
          notice.recipientId?.name,
          notice.noticeType,
          notice._id,
        ]
          .filter(Boolean)
          .map((value) => String(value).toLowerCase());

        return haystack.some((value) => value.includes(query));
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );
  }, [studentNotices, studentFilterType, studentSearchTerm]);

  const filteredPublicNotices = useMemo(() => {
    const query = publicSearchTerm.trim().toLowerCase();
    return publicNotices
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

        if (publicStatusFilter !== "all") {
          const status = (notice.status || "").toLowerCase();
          if (status !== publicStatusFilter) {
            return false;
          }
        }

        if (publicCategoryFilter !== "all") {
          const category = notice.category || "General";
          if (category !== publicCategoryFilter) {
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
  }, [
    publicNotices,
    publicSearchTerm,
    publicStatusFilter,
    publicCategoryFilter,
  ]);

  const studentTotalPages = Math.max(
    1,
    Math.ceil(filteredStudentNotices.length / PAGE_SIZE)
  );
  const publicTotalPages = Math.max(
    1,
    Math.ceil(filteredPublicNotices.length / PAGE_SIZE)
  );

  useEffect(() => {
    if (studentCurrentPage > studentTotalPages) {
      setStudentCurrentPage(studentTotalPages);
    }
  }, [studentCurrentPage, studentTotalPages]);

  useEffect(() => {
    if (publicCurrentPage > publicTotalPages) {
      setPublicCurrentPage(publicTotalPages);
    }
  }, [publicCurrentPage, publicTotalPages]);

  const paginatedStudentNotices = filteredStudentNotices.slice(
    (studentCurrentPage - 1) * PAGE_SIZE,
    studentCurrentPage * PAGE_SIZE
  );

  const paginatedPublicNotices = filteredPublicNotices.slice(
    (publicCurrentPage - 1) * PAGE_SIZE,
    publicCurrentPage * PAGE_SIZE
  );

  const handleStudentSubmit = async (event) => {
    event.preventDefault();

    if (!studentFormData.recipientId) {
      toast.error("Select a student before sending the notice.");
      return;
    }

    if (
      !studentFormData.noticeType ||
      !studentFormData.subject.trim() ||
      !studentFormData.message.trim()
    ) {
      toast.error("Notice type, subject, and message are required.");
      return;
    }

    setIsStudentSubmitting(true);
    try {
      await noticeService.sendNotice(studentFormData);
      toast.success("Notice sent successfully.");
      await loadStudentNotices();
      handleCloseModal();
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to send the notice.";
      toast.error(message);
    } finally {
      setIsStudentSubmitting(false);
    }
  };

  const handleStudentRefresh = async () => {
    setIsStudentRefreshing(true);
    try {
      await loadStudentNotices();
      toast.success("Student notices refreshed.");
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to refresh student notices.";
      toast.error(message);
    } finally {
      setIsStudentRefreshing(false);
    }
  };

  const handleStudentSelect = (student) => {
    const resolvedUserId =
      typeof student.userId === "string"
        ? student.userId
        : student.userId?._id || "";

    setSelectedStudent(student);
    setStudentFormData((prev) => ({
      ...prev,
      recipientId: resolvedUserId,
    }));
    const profile = student.studentProfileId || {};
    setStudentQuery(
      `${profile.name || "Unknown"} (${profile.rollNumber || "—"}) · Room ${
        student.allottedRoomNumber || "—"
      }`
    );
  };

  const clearSelectedStudent = () => {
    setSelectedStudent(null);
    setStudentQuery("");
    setStudentFormData(createStudentForm());
  };

  const applyStudentTemplate = (template) => {
    setStudentFormData((prev) => ({
      ...prev,
      noticeType: template.type,
      subject: template.subject,
      message: template.message,
      actionRequired: template.actionRequired,
    }));
    setStudentShowTemplates(false);
  };

  const handlePublicSubmit = async (event, overrideStatus) => {
    event.preventDefault();
    if (typeof event.stopPropagation === "function") {
      event.stopPropagation();
    }

    if (!publicFormData.title.trim() || !publicFormData.content.trim()) {
      toast.error("Title and content are required.");
      return;
    }

    if (!publicFormData.effectiveDate) {
      toast.error("Select the effective date for the notice.");
      return;
    }

    const nextStatus = overrideStatus || publicFormData.status || "draft";
    setIsPublicSubmitting(true);
    const payload = new FormData();
    Object.entries({ ...publicFormData, status: nextStatus }).forEach(
      ([key, value]) => {
        payload.append(key, value ?? "");
      }
    );
    publicAttachments.forEach((file) => payload.append("attachments", file));

    try {
      if (editingPublicNotice) {
        await publicNoticeService.updateNotice(
          editingPublicNotice._id,
          payload
        );
        toast.success("Notice updated.");
      } else {
        await publicNoticeService.createNotice(payload);
        toast.success("Notice created.");
      }

      if (nextStatus === "published") {
        window.dispatchEvent(new CustomEvent("refreshNoticeBoard"));
      }

      await loadPublicNotices();
      handleCloseModal();
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        (editingPublicNotice
          ? "Failed to update notice."
          : "Failed to create notice.");
      toast.error(message);
    } finally {
      setIsPublicSubmitting(false);
    }
  };

  const handlePublicRefresh = async () => {
    setIsPublicRefreshing(true);
    try {
      await loadPublicNotices();
      toast.success("Public notices refreshed.");
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to refresh public notices.";
      toast.error(message);
    } finally {
      setIsPublicRefreshing(false);
    }
  };

  const handleEditPublicNotice = (notice) => {
    setEditingPublicNotice(notice);
    setPublicFormData({
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
    setPublicAttachments([]);
    setPublicShowTemplates(false);
    setModalMode("public");
  };

  const handleDeletePublicNotice = async (noticeId) => {
    if (!window.confirm("Delete this notice?")) {
      return;
    }

    try {
      await publicNoticeService.deleteNotice(noticeId);
      toast.success("Notice deleted.");
      await loadPublicNotices();
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete the notice.";
      toast.error(message);
    }
  };

  const handlePublishPublicNotice = async (noticeId) => {
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
      await loadPublicNotices();
      window.dispatchEvent(new CustomEvent("refreshNoticeBoard"));
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to publish.";
      toast.error(message);
    }
  };

  const handleViewNotice = (notice, scope) => {
    if (scope === "student") {
      const payload = {
        _id: notice._id || notice.id,
        title: notice.subject || "Notice",
        content: notice.message || "",
        category: notice.noticeType || "General",
        isImportant: Boolean(notice.isUrgent),
        actionRequired: notice.actionRequired || null,
        recipientName: notice.recipientId?.name || "",
        createdAt: notice.createdAt,
        publishedAt: notice.createdAt,
        effectiveDate: notice.effectiveDate || notice.createdAt,
        expiryDate: notice.expiryDate || null,
        pdfPath: notice.pdfPath || null,
        status: notice.status || "sent",
        isRead: Boolean(notice.isRead),
      };
      setSelectedNotice(payload);
      return;
    }

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

  const handleCloseModal = () => {
    if (modalMode === "student") {
      resetStudentForm();
    }
    if (modalMode === "public") {
      resetPublicForm();
    }
    setModalMode(null);
    setEditingPublicNotice(null);
  };

  const resetStudentForm = () => {
    setStudentFormData(createStudentForm());
    setSelectedStudent(null);
    setStudentQuery("");
    setStudentShowTemplates(false);
  };

  const resetPublicForm = () => {
    setPublicFormData(createPublicForm());
    setPublicAttachments([]);
    setPublicShowTemplates(false);
    setEditingPublicNotice(null);
  };

  const openCreateModal = () => {
    if (activeTab === "student") {
      resetStudentForm();
      setModalMode("student");
      return;
    }

    resetPublicForm();
    setModalMode("public");
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    setPublicAttachments(files);
  };

  if (isBootstrapping) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center rounded-2xl border border-emerald-100 bg-white">
        <div className="flex items-center gap-3 text-emerald-700">
          <span className="h-3 w-3 animate-ping rounded-full bg-emerald-500" />
          <span className="text-sm font-medium">
            Preparing notices workspace...
          </span>
        </div>
      </div>
    );
  }

  const renderStats = () => {
    if (activeTab === "student") {
      return (
        <section className="flex flex-wrap gap-2">
          <StatPill
            label="Notices"
            value={studentStats.total}
            icon={<FaEnvelope className="h-3.5 w-3.5" />}
          />
          <StatPill
            label="Urgent"
            value={studentStats.urgent}
            icon={<FaExclamationTriangle className="h-3.5 w-3.5" />}
            tone="amber"
          />
          <StatPill
            label="Pending"
            value={studentStats.pending}
            icon={<FaBell className="h-3.5 w-3.5" />}
            tone="sky"
          />
          <StatPill
            label="Resolved"
            value={studentStats.resolved}
            icon={<FaCheckCircle className="h-3.5 w-3.5" />}
            tone="emerald"
          />
        </section>
      );
    }

    return (
      <section className="flex flex-wrap gap-2">
        <StatPill
          label="Total"
          value={publicStats.total}
          icon={<FaRegFileAlt className="h-3.5 w-3.5" />}
        />
        <StatPill
          label="Published"
          value={publicStats.published}
          icon={<FaCheckCircle className="h-3.5 w-3.5" />}
          tone="emerald"
        />
        <StatPill
          label="Drafts"
          value={publicStats.drafts}
          icon={<FaRegFileAlt className="h-3.5 w-3.5" />}
          tone="sky"
        />
        <StatPill
          label="Important"
          value={publicStats.important}
          icon={<FaStar className="h-3.5 w-3.5" />}
          tone="amber"
        />
        <StatPill
          label="Expired"
          value={publicStats.expired}
          icon={<FaExclamationTriangle className="h-3.5 w-3.5" />}
          tone="rose"
        />
      </section>
    );
  };

  const renderActiveTable = () => {
    if (activeTab === "student") {
      if (isStudentLoading) {
        return (
          <div className="flex min-h-[220px] items-center justify-center text-sm text-emerald-600">
            Loading student notices...
          </div>
        );
      }

      if (studentError) {
        return (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
            <p className="text-base font-semibold">Unable to load notices</p>
            <p className="mt-2 text-sm opacity-80">{studentError}</p>
            <button
              type="button"
              onClick={handleStudentRefresh}
              className="mt-4 rounded-lg border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
            >
              Retry
            </button>
          </div>
        );
      }

      return (
        <section className="rounded-2xl border border-emerald-100 bg-white">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold text-emerald-900">
              Student notice history
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <FaSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-emerald-400" />
                <input
                  value={studentSearchTerm}
                  onChange={(event) => setStudentSearchTerm(event.target.value)}
                  placeholder="Search notices"
                  className="w-full rounded-xl border border-emerald-100 bg-emerald-50/30 py-2.5 pl-9 pr-3 text-sm text-emerald-900 placeholder:text-emerald-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <select
                value={studentFilterType}
                onChange={(event) => setStudentFilterType(event.target.value)}
                className="rounded-xl border border-emerald-100 bg-emerald-50/30 px-3 py-2.5 text-sm text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              >
                <option value="all">All types</option>
                {STUDENT_NOTICE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredStudentNotices.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 p-6 text-emerald-600">
              <p className="text-sm font-medium">No matching notices</p>
              <p className="text-xs opacity-70">
                Adjust the filters or search term to see results.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-emerald-50 text-sm text-emerald-900">
                <thead className="bg-emerald-50/60 text-left text-xs font-semibold uppercase tracking-wide text-emerald-600">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Sent on</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {paginatedStudentNotices.map((notice, index) => (
                    <tr key={notice._id} className="hover:bg-emerald-50/40">
                      <td className="px-4 py-3 text-xs font-semibold text-emerald-500">
                        {(studentCurrentPage - 1) * PAGE_SIZE + index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-emerald-900">
                          {notice.subject}
                        </p>
                        <p className="text-xs text-emerald-500 line-clamp-1">
                          {notice.message}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-emerald-900">
                          {notice.recipientId?.name || "Unknown"}
                        </p>
                        <p className="text-xs text-emerald-500">
                          {notice.recipientId?.email || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={studentTypeBadgeClass(notice.noticeType)}
                        >
                          {notice.noticeType || "General"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={studentStatusBadgeClass(notice.status)}
                        >
                          {formatStudentStatus(notice.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-emerald-500">
                        {formatDateTime(notice.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleViewNotice(notice, "student")}
                          className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50"
                        >
                          <FaEye className="h-3.5 w-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Pagination
            currentPage={studentCurrentPage}
            pageSize={PAGE_SIZE}
            totalItems={filteredStudentNotices.length}
            onPageChange={setStudentCurrentPage}
          />
        </section>
      );
    }

    if (isPublicLoading) {
      return (
        <div className="flex min-h-[220px] items-center justify-center text-sm text-emerald-600">
          Loading public notices...
        </div>
      );
    }

    if (publicError) {
      return (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
          <p className="text-base font-semibold">
            Unable to load public notices
          </p>
          <p className="mt-2 text-sm opacity-80">{publicError}</p>
          <button
            type="button"
            onClick={handlePublicRefresh}
            className="mt-4 rounded-lg border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
          >
            Retry
          </button>
        </div>
      );
    }

    return (
      <section className="rounded-2xl border border-emerald-100 bg-white">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-emerald-900">
            Public notice history
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <FaSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-emerald-400" />
              <input
                value={publicSearchTerm}
                onChange={(event) => setPublicSearchTerm(event.target.value)}
                placeholder="Search by title or content"
                className="w-full rounded-xl border border-emerald-100 bg-emerald-50/30 py-2.5 pl-9 pr-3 text-sm text-emerald-900 placeholder:text-emerald-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <select
              value={publicStatusFilter}
              onChange={(event) => setPublicStatusFilter(event.target.value)}
              className="rounded-xl border border-emerald-100 bg-emerald-50/30 px-3 py-2.5 text-sm text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            >
              <option value="all">All statuses</option>
              {PUBLIC_NOTICE_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={publicCategoryFilter}
              onChange={(event) => setPublicCategoryFilter(event.target.value)}
              className="rounded-xl border border-emerald-100 bg-emerald-50/30 px-3 py-2.5 text-sm text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            >
              <option value="all">All categories</option>
              {PUBLIC_NOTICE_CATEGORY_OPTIONS.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredPublicNotices.length === 0 ? (
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
                {paginatedPublicNotices.map((notice, index) => (
                  <tr key={notice._id} className="hover:bg-emerald-50/40">
                    <td className="px-4 py-3 text-xs font-semibold text-emerald-500">
                      {(publicCurrentPage - 1) * PAGE_SIZE + index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-emerald-900">
                        {notice.title}
                      </p>
                      <p className="text-xs text-emerald-500 line-clamp-1">
                        {notice.content}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={publicCategoryBadgeClass(notice.category)}
                      >
                        {notice.category || "General"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-emerald-500">
                      {formatDateOnly(notice.effectiveDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={publicStatusBadgeClass(notice.status)}>
                        {formatPublicStatus(notice.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleViewNotice(notice, "public")}
                          className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50"
                        >
                          <FaEye className="h-3.5 w-3.5" />
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditPublicNotice(notice)}
                          className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50"
                        >
                          <FaEdit className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        {(notice.status || "").toLowerCase() !== "published" &&
                        (notice.status || "").toLowerCase() !== "archived" ? (
                          <button
                            type="button"
                            onClick={() =>
                              handlePublishPublicNotice(notice._id)
                            }
                            className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50"
                          >
                            <FaBullhorn className="h-3.5 w-3.5" />
                            Publish
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => handleDeletePublicNotice(notice._id)}
                          className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:border-rose-300 hover:bg-rose-50"
                        >
                          <FaTrash className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={publicCurrentPage}
          pageSize={PAGE_SIZE}
          totalItems={filteredPublicNotices.length}
          onPageChange={setPublicCurrentPage}
        />
      </section>
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-emerald-100 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-emerald-900">Notices</h1>
          <p className="text-xs text-emerald-600">
            Manage student and public announcements from a single workspace.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex overflow-hidden rounded-lg border border-emerald-200">
            <button
              type="button"
              onClick={() => setActiveTab("student")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold transition ${
                activeTab === "student"
                  ? "bg-emerald-500 text-white"
                  : "bg-white text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              <FaPaperPlane className="h-3.5 w-3.5" />
              Student
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("public")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold transition ${
                activeTab === "public"
                  ? "bg-emerald-500 text-white"
                  : "bg-white text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              <FaBullhorn className="h-3.5 w-3.5" />
              Public
            </button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={
                activeTab === "student"
                  ? handleStudentRefresh
                  : handlePublicRefresh
              }
              disabled={
                activeTab === "student"
                  ? isStudentRefreshing
                  : isPublicRefreshing
              }
              className="flex items-center justify-center gap-2 rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:text-emerald-300"
            >
              <FaSync
                className={
                  activeTab === "student" && isStudentRefreshing
                    ? "animate-spin"
                    : activeTab === "public" && isPublicRefreshing
                    ? "animate-spin"
                    : ""
                }
              />
              Refresh
            </button>
            <button
              type="button"
              onClick={openCreateModal}
              className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600"
            >
              <FaPlus />
              {activeTab === "student" ? "Send notice" : "New notice"}
            </button>
          </div>
        </div>
      </header>

      {renderStats()}

      {renderActiveTable()}

      {modalMode ? (
        <Modal onClose={handleCloseModal}>
          {modalMode === "student" ? (
            <div className="flex flex-col gap-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-emerald-900">
                    Send student notice
                  </h2>
                  <p className="text-xs text-emerald-600">
                    Choose a student and compose the announcement.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-lg border border-emerald-100 p-2 text-emerald-500 transition hover:border-emerald-200 hover:text-emerald-700"
                >
                  <FaTimes />
                </button>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setStudentShowTemplates((current) => !current)}
                  className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50"
                >
                  {studentShowTemplates ? "Hide templates" : "Show templates"}
                </button>

                {studentShowTemplates ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {STUDENT_NOTICE_TEMPLATES.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => applyStudentTemplate(template)}
                        className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 text-left text-xs font-medium text-emerald-800 transition hover:border-emerald-200 hover:bg-emerald-50"
                      >
                        <p>{template.name}</p>
                        <p className="mt-1 text-[11px] text-emerald-500">
                          {template.type}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <form
                onSubmit={handleStudentSubmit}
                className="grid gap-4 text-sm"
              >
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
                    Student
                  </label>
                  <div className="relative mt-2">
                    <input
                      value={studentQuery}
                      onChange={(event) => {
                        setStudentQuery(event.target.value);
                        setSelectedStudent(null);
                        setStudentFormData((prev) => ({
                          ...prev,
                          recipientId: "",
                        }));
                      }}
                      placeholder="Search by name, roll number, or room"
                      className="w-full rounded-xl border border-emerald-100 bg-emerald-50/30 py-2.5 pl-9 pr-3 text-emerald-900 placeholder:text-emerald-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    />
                    <FaSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-emerald-400" />
                    {studentOptions.length > 0 ? (
                      <div className="absolute z-20 mt-2 max-h-52 w-full overflow-y-auto rounded-xl border border-emerald-100 bg-white shadow-lg">
                        {studentOptions.map((student) => (
                          <button
                            key={student._id}
                            type="button"
                            onClick={() => handleStudentSelect(student)}
                            className="w-full border-b border-emerald-50 px-4 py-2 text-left text-xs text-emerald-700 hover:bg-emerald-50"
                          >
                            <p className="font-semibold text-emerald-900">
                              {student.studentProfileId?.name || "Unknown"}
                            </p>
                            <p className="text-[11px] text-emerald-500">
                              Roll {student.studentProfileId?.rollNumber || "—"}{" "}
                              · Room {student.allottedRoomNumber || "—"}
                            </p>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  {selectedStudent ? (
                    <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/40 px-3 py-2 text-xs text-emerald-700">
                      <span>
                        {selectedStudent.studentProfileId?.name} · Room{" "}
                        {selectedStudent.allottedRoomNumber || "—"}
                      </span>
                      <button
                        type="button"
                        onClick={clearSelectedStudent}
                        className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-800"
                      >
                        Clear
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
                      Notice type
                    </label>
                    <select
                      name="noticeType"
                      value={studentFormData.noticeType}
                      onChange={(event) =>
                        setStudentFormData((prev) => ({
                          ...prev,
                          noticeType: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-xl border border-emerald-100 bg-emerald-50/30 px-3 py-2.5 text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      required
                    >
                      <option value="">Select type</option>
                      {STUDENT_NOTICE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <label className="flex items-center gap-2 pt-6 text-xs font-semibold text-emerald-600">
                    <input
                      type="checkbox"
                      name="isUrgent"
                      checked={studentFormData.isUrgent}
                      onChange={(event) =>
                        setStudentFormData((prev) => ({
                          ...prev,
                          isUrgent: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border border-emerald-200 text-emerald-500 focus:ring-emerald-400"
                    />
                    <span>Mark as urgent</span>
                  </label>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
                    Subject
                  </label>
                  <input
                    name="subject"
                    value={studentFormData.subject}
                    onChange={(event) =>
                      setStudentFormData((prev) => ({
                        ...prev,
                        subject: event.target.value,
                      }))
                    }
                    placeholder="Enter a concise subject"
                    className="mt-2 w-full rounded-xl border border-emerald-100 bg-emerald-50/30 px-3 py-2.5 text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={studentFormData.message}
                    onChange={(event) =>
                      setStudentFormData((prev) => ({
                        ...prev,
                        message: event.target.value,
                      }))
                    }
                    rows={5}
                    placeholder="Add context or guidance for the student"
                    className="mt-2 w-full rounded-xl border border-emerald-100 bg-emerald-50/30 px-3 py-2.5 text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
                    Action required (optional)
                  </label>
                  <input
                    name="actionRequired"
                    value={studentFormData.actionRequired}
                    onChange={(event) =>
                      setStudentFormData((prev) => ({
                        ...prev,
                        actionRequired: event.target.value,
                      }))
                    }
                    placeholder="Suggested next steps for the student"
                    className="mt-2 w-full rounded-xl border border-emerald-100 bg-emerald-50/30 px-3 py-2.5 text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    disabled={
                      isStudentSubmitting || !studentFormData.recipientId
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300"
                  >
                    {isStudentSubmitting ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <FaPaperPlane />
                        Send notice
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={resetStudentForm}
                    className="rounded-lg border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-emerald-900">
                    {editingPublicNotice
                      ? "Edit public notice"
                      : "Create public notice"}
                  </h2>
                  <p className="text-xs text-emerald-600">
                    Provide the announcement details and publish when ready.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-lg border border-emerald-100 p-2 text-emerald-500 transition hover:border-emerald-200 hover:text-emerald-700"
                >
                  <FaTimes />
                </button>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setPublicShowTemplates((current) => !current)}
                  className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50"
                >
                  {publicShowTemplates ? "Hide templates" : "Show templates"}
                </button>

                {publicShowTemplates ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {PUBLIC_NOTICE_TEMPLATES.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => {
                          setPublicFormData((prev) => ({
                            ...prev,
                            title: template.title,
                            content: template.content,
                            category: template.category,
                            isImportant: Boolean(template.isImportant),
                          }));
                          setPublicShowTemplates(false);
                          toast.success(`Template "${template.name}" applied.`);
                        }}
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

              <form
                onSubmit={handlePublicSubmit}
                className="grid gap-4 text-sm"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col">
                    <span className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
                      Title
                    </span>
                    <input
                      name="title"
                      value={publicFormData.title}
                      onChange={(event) =>
                        setPublicFormData((prev) => ({
                          ...prev,
                          title: event.target.value,
                        }))
                      }
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
                      value={publicFormData.category}
                      onChange={(event) =>
                        setPublicFormData((prev) => ({
                          ...prev,
                          category: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-xl border border-emerald-100 bg-emerald-50/30 px-3 py-2.5 text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      required
                    >
                      {PUBLIC_NOTICE_CATEGORY_OPTIONS.map((category) => (
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
                    value={publicFormData.content}
                    onChange={(event) =>
                      setPublicFormData((prev) => ({
                        ...prev,
                        content: event.target.value,
                      }))
                    }
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
                      value={publicFormData.effectiveDate}
                      onChange={(event) =>
                        setPublicFormData((prev) => ({
                          ...prev,
                          effectiveDate: event.target.value,
                        }))
                      }
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
                      value={publicFormData.expiryDate}
                      onChange={(event) =>
                        setPublicFormData((prev) => ({
                          ...prev,
                          expiryDate: event.target.value,
                        }))
                      }
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
                  {publicAttachments.length > 0 ? (
                    <div className="mt-2 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-xs text-emerald-700">
                      <p className="font-semibold">
                        {publicAttachments.length} file(s) ready to upload
                      </p>
                      <ul className="mt-1 space-y-1">
                        {publicAttachments.map((file) => (
                          <li key={file.name} className="truncate">
                            {file.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {editingPublicNotice?.attachments?.length ? (
                    <p className="mt-2 text-[11px] text-emerald-500">
                      This notice has {editingPublicNotice.attachments.length}{" "}
                      existing attachment(s). They remain unless you upload
                      replacements.
                    </p>
                  ) : null}
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex items-center gap-2 pt-4 text-xs font-semibold text-emerald-600">
                    <input
                      type="checkbox"
                      name="isImportant"
                      checked={publicFormData.isImportant}
                      onChange={(event) =>
                        setPublicFormData((prev) => ({
                          ...prev,
                          isImportant: event.target.checked,
                        }))
                      }
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
                      value={publicFormData.status}
                      onChange={(event) =>
                        setPublicFormData((prev) => ({
                          ...prev,
                          status: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-xl border border-emerald-100 bg-emerald-50/30 px-3 py-2.5 text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    >
                      {PUBLIC_NOTICE_STATUS_OPTIONS.map((status) => (
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
                    disabled={isPublicSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300"
                  >
                    {isPublicSubmitting ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        {editingPublicNotice ? "Saving..." : "Creating..."}
                      </>
                    ) : (
                      <>
                        <FaCheckCircle />
                        {editingPublicNotice ? "Save as draft" : "Create draft"}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(event) => handlePublicSubmit(event, "published")}
                    disabled={isPublicSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                  >
                    {isPublicSubmitting ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <FaBullhorn />
                        {editingPublicNotice ? "Save & publish" : "Publish now"}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={resetPublicForm}
                    className="rounded-lg border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>
          )}
        </Modal>
      ) : null}

      {selectedNotice ? (
        <NoticeViewer
          notice={selectedNotice}
          onClose={() => setSelectedNotice(null)}
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

const formatDateTime = (value) => {
  if (!value) {
    return "—";
  }
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch (err) {
    return "—";
  }
};

const formatDateOnly = (value) => {
  if (!value) {
    return "—";
  }
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch (err) {
    return "—";
  }
};

const formatStudentStatus = (status) => {
  const value = (status || "pending").toLowerCase();
  if (["resolved", "delivered", "read"].includes(value)) {
    return "Resolved";
  }
  if (["pending", "sent"].includes(value)) {
    return "Pending";
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const studentStatusBadgeClass = (status) => {
  const value = (status || "pending").toLowerCase();
  if (["resolved", "delivered", "read"].includes(value)) {
    return "inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700";
  }
  if (["pending", "sent"].includes(value)) {
    return "inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700";
  }
  if (value === "rejected") {
    return "inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700";
  }
  return "inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700";
};

const studentTypeBadgeClass = (type) => {
  switch (type) {
    case "Behavioral Warning":
      return "inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700";
    case "Academic Warning":
      return "inline-flex rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700";
    case "Disciplinary Action":
      return "inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700";
    case "Room Inspection":
      return "inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700";
    case "Fee Notice":
      return "inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700";
    default:
      return "inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700";
  }
};

const formatPublicStatus = (status) => {
  const value = (status || "draft").toLowerCase();
  if (value === "published") {
    return "Published";
  }
  if (value === "archived") {
    return "Archived";
  }
  return "Draft";
};

const publicStatusBadgeClass = (status) => {
  const value = (status || "draft").toLowerCase();
  if (value === "published") {
    return "inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700";
  }
  if (value === "archived") {
    return "inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700";
  }
  return "inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700";
};

const publicCategoryBadgeClass = (category) => {
  switch (category) {
    case "Academic":
      return "inline-flex rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700";
    case "Administrative":
      return "inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700";
    case "Events":
      return "inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700";
    case "Facilities":
      return "inline-flex rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700";
    case "Emergency":
      return "inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700";
    default:
      return "inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700";
  }
};

export default Notice;
