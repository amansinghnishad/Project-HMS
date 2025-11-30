import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  FaBullhorn,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaSearch,
  FaFilter,
  FaSort,
  FaCalendarAlt,
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaFileAlt,
  FaPaperclip,
  FaDownload,
  FaChevronDown,
  FaChevronUp,
  FaSync,
  FaTh,
  FaList,
  FaArrowUp,
  FaArrowDown,
  FaTags,
  FaRegClock,
  FaRegCalendarAlt,
  FaRegFileAlt,
  FaRegBell,
  FaChartBar,
  FaUsers,
  FaBookmark,
  FaStar,
  FaFlag,
  FaLayerGroup,
  FaRocket,
  FaLightbulb,
  FaShieldAlt,
  FaInfoCircle,
  FaHome,
  FaGraduationCap,
  FaBed,
  FaUserGraduate,
  FaTools,
  FaWifi,
  FaUtensils,
  FaBars,
  FaTimes,
  FaEnvelope,
  FaUserFriends,
  FaChartLine,
  FaClipboardList,
  FaCertificate,
} from "react-icons/fa";
import { publicNoticeService } from "../../../services/api/publicNoticeService";
import NoticeViewer from "../../../components/NoticeViewer/NoticeViewer";

const PublicNotice = () => {
  // Add custom styles for animations
  const customStyles = `
    .animate-fadeIn {
      animation: fadeIn 0.5s ease-out;
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .line-clamp-3 {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `;

  // Enhanced state management
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // UI State
  const [showForm, setShowForm] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // grid, list
  const [selectedNotices, setSelectedNotices] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const [selectedNotice, setSelectedNotice] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "General",
    effectiveDate: "",
    expiryDate: "",
    isImportant: false,
    status: "draft",
  });
  const [attachments, setAttachments] = useState([]);

  // Enhanced filtering and search
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState({
    status: "all",
    category: "all",
    importance: "all",
    dateRange: "all",
  });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    drafts: 0,
    expired: 0,
    important: 0,
  });

  // Templates for quick notice creation
  const [noticeTemplates] = useState([
    {
      id: 1,
      name: "General Announcement",
      category: "General",
      title: "General Announcement",
      content:
        "This is to inform all students about [announcement details]. Please take note and follow the instructions accordingly.",
    },
    {
      id: 2,
      name: "Maintenance Notice",
      category: "Facilities",
      title: "Scheduled Maintenance",
      content:
        "There will be scheduled maintenance of [facility/service] on [date] from [time] to [time]. Please plan accordingly.",
    },
    {
      id: 3,
      name: "Event Notification",
      category: "Events",
      title: "Upcoming Event",
      content:
        "We are pleased to announce [event name] scheduled for [date] at [time]. [Event details and registration information].",
    },
    {
      id: 4,
      name: "Academic Notice",
      category: "Academic",
      title: "Academic Notification",
      content:
        "This notice is regarding [academic matter]. All students are requested to [action required].",
    },
    {
      id: 5,
      name: "Urgent Alert",
      category: "Emergency",
      title: "Urgent Notice",
      content:
        "URGENT: [Urgent matter details]. Immediate action required. Please [specific instructions].",
      isImportant: true,
    },
  ]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  useEffect(() => {
    fetchNotices();
  }, [filter, sortBy, sortOrder]);

  useEffect(() => {
    calculateStats();
  }, [notices]);

  const calculateStats = () => {
    const now = new Date();
    const newStats = {
      total: notices.length,
      published: notices.filter((n) => n.status === "published").length,
      drafts: notices.filter((n) => n.status === "draft").length,
      expired: notices.filter(
        (n) => n.expiryDate && new Date(n.expiryDate) < now
      ).length,
      important: notices.filter((n) => n.isImportant).length,
    };
    setStats(newStats);
  };

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.status !== "all") params.status = filter.status;
      if (filter.category !== "all") params.category = filter.category;
      if (sortBy) params.sortBy = sortBy;
      if (sortOrder) params.sortOrder = sortOrder;

      const result = await publicNoticeService.fetchAllNotices(params);
      setNotices(result?.notices || []);
    } catch (error) {
      console.error("Fetch notices error:", error);
      toast.error(error.message || "Failed to fetch notices");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    setAttachments(Array.from(e.target.files));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.content || !formData.effectiveDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    const submitData = new FormData();
    Object.keys(formData).forEach((key) => {
      submitData.append(key, formData[key]);
    });

    attachments.forEach((file) => {
      submitData.append("attachments", file);
    });

    try {
      let result;
      if (editingNotice) {
        result = await publicNoticeService.updateNotice(
          editingNotice._id,
          submitData
        );
        toast.success("Notice updated successfully");
      } else {
        result = await publicNoticeService.createNotice(submitData);
        toast.success("Notice created successfully");
      }

      if (result?.success) {
        resetForm(true);
        fetchNotices();
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(
        editingNotice ? "Failed to update notice" : "Failed to create notice"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      content: notice.content,
      category: notice.category,
      effectiveDate: new Date(notice.effectiveDate).toISOString().split("T")[0],
      expiryDate: notice.expiryDate
        ? new Date(notice.expiryDate).toISOString().split("T")[0]
        : "",
      isImportant: notice.isImportant,
      status: notice.status,
    });
    setShowForm(true);
  };
  const handleDelete = async (noticeId) => {
    if (window.confirm("Are you sure you want to delete this notice?")) {
      try {
        const result = await publicNoticeService.deleteNotice(noticeId);
        if (result?.success) {
          toast.success("Notice deleted successfully");
          fetchNotices();
        }
      } catch (error) {
        console.error("Delete error:", error);
        toast.error(error.message || "Failed to delete notice");
      }
    }
  };
  const handlePublish = async (noticeId) => {
    if (
      !window.confirm(
        "Are you sure you want to publish this notice? Once published, it will be visible to all users."
      )
    ) {
      return;
    }

    try {
      console.log("Publishing notice with ID:", noticeId);
      const result = await publicNoticeService.publishNotice(noticeId);
      console.log("Publish result:", result);

      if (result?.success) {
        toast.success(
          "Notice published successfully! It will now appear on the notice board."
        );
        await fetchNotices(); // Refresh the notices list

        // Also refresh the notice board data if there's a way to trigger it
        window.dispatchEvent(new CustomEvent("refreshNoticeBoard"));
      } else {
        console.error("Publish failed:", result);
        toast.error(
          result.message ||
            "Failed to publish notice. Please check if the server is running."
        );
      }
    } catch (error) {
      console.error("Publish error:", error);
      if (error.response?.status === 401) {
        toast.error("Authentication failed. Please login again.");
      } else if (error.response?.status === 404) {
        toast.error("Notice not found. It may have been deleted.");
      } else if (error.code === "NETWORK_ERROR" || !error.response) {
        toast.error(
          "Cannot connect to server. Please make sure the backend server is running on http://localhost:4000"
        );
      } else {
        toast.error(
          error.response?.data?.message || "Failed to publish notice"
        );
      }
    }
  };
  const resetForm = (closeForm = false) => {
    setFormData({
      title: "",
      content: "",
      category: "General",
      effectiveDate: "",
      expiryDate: "",
      isImportant: false,
      status: "draft",
    });
    setAttachments([]);
    setEditingNotice(null);
    setSelectedTemplate(null);
    setShowTemplates(false);
    if (closeForm) {
      setShowForm(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotices();
    setRefreshing(false);
    toast.success("Data refreshed successfully");
  };
  const applyTemplate = (template) => {
    setFormData((prev) => ({
      ...prev,
      title: template.title,
      content: template.content,
      category: template.category,
      isImportant: template.isImportant || false,
    }));
    setSelectedTemplate(template);
    setShowTemplates(false);
    toast.success(`Template "${template.name}" applied`);
  };
  const handleViewNotice = (notice) => {
    console.log("=== DEBUG: PublicNotice - Original notice data ===");
    console.log("Notice object:", notice);
    console.log("Notice keys:", Object.keys(notice));
    console.log("Notice._id:", notice._id);
    console.log("Notice.title:", notice.title);
    console.log("Notice.content:", notice.content);
    console.log("Notice.category:", notice.category);
    console.log("Notice.isImportant:", notice.isImportant);
    console.log("Notice.effectiveDate:", notice.effectiveDate);
    console.log("Notice.expiryDate:", notice.expiryDate);
    console.log("Notice.status:", notice.status);
    console.log("Notice.attachments:", notice.attachments);
    console.log("=== END DEBUG ===");

    // Transform the notice data to ensure compatibility with NoticeViewer
    const transformedNotice = {
      _id: notice._id || notice.id,
      title: notice.title || "No Title",
      content: notice.content || "No Content",
      category: notice.category || "General",
      isImportant: notice.isImportant || false,
      effectiveDate: notice.effectiveDate,
      expiryDate: notice.expiryDate,
      status: notice.status || "draft",
      attachments: notice.attachments || [],
      createdAt: notice.createdAt,
      updatedAt: notice.updatedAt,
    };

    console.log("=== DEBUG: PublicNotice - Transformed notice data ===");
    console.log("Transformed notice:", transformedNotice);
    console.log("=== END DEBUG ===");

    setSelectedNotice(transformedNotice);
  };

  const handleCloseNoticeViewer = () => {
    setSelectedNotice(null);
  };

  const getFilteredNotices = () => {
    let filtered = notices;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (notice) =>
          notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          notice.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          notice.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filter.status !== "all") {
      filtered = filtered.filter((notice) => notice.status === filter.status);
    }

    // Category filter
    if (filter.category !== "all") {
      filtered = filtered.filter(
        (notice) => notice.category === filter.category
      );
    }

    // Importance filter
    if (filter.importance !== "all") {
      if (filter.importance === "important") {
        filtered = filtered.filter((notice) => notice.isImportant);
      } else {
        filtered = filtered.filter((notice) => !notice.isImportant);
      }
    }

    // Date range filter
    if (filter.dateRange !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      switch (filter.dateRange) {
        case "active":
          filtered = filtered.filter((notice) => {
            const effectiveDate = new Date(notice.effectiveDate);
            const expiryDate = notice.expiryDate
              ? new Date(notice.expiryDate)
              : null;
            return effectiveDate <= now && (!expiryDate || expiryDate >= now);
          });
          break;
        case "expired":
          filtered = filtered.filter((notice) => {
            const expiryDate = notice.expiryDate
              ? new Date(notice.expiryDate)
              : null;
            return expiryDate && expiryDate < now;
          });
          break;
        case "future":
          filtered = filtered.filter((notice) => {
            const effectiveDate = new Date(notice.effectiveDate);
            return effectiveDate > now;
          });
          break;
      }
    }

    return filtered;
  };

  const getPaginatedNotices = () => {
    const filtered = getFilteredNotices();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    const filtered = getFilteredNotices();
    return Math.ceil(filtered.length / itemsPerPage);
  };

  const handleBulkAction = (action) => {
    // Implementation for bulk actions
    console.log(`Bulk action: ${action} for notices:`, selectedNotices);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  return (
    <div className="p-6 space-y-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <style>{customStyles}</style>
      {/* Enhanced Header with Statistics */}
      <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-blue-700 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16"></div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between relative z-10">
          <div className="flex-1">
            <div className="flex items-center mb-3">
              <FaBullhorn className="text-yellow-300 mr-2 text-2xl" />
              <span className="text-teal-100 text-sm font-medium">
                Public Notice Management
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-3">
              Public Notices
            </h1>
            <p className="text-teal-100 text-lg max-w-md">
              Create, manage, and publish important announcements for all
              students and staff.
            </p>{" "}
            {/* Enhanced statistics cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-teal-100 text-sm">Total Notices</p>
                    <p className="text-white text-2xl font-bold">
                      {stats.total}
                    </p>
                  </div>
                  <FaClipboardList className="text-white/70 text-xl" />
                </div>
              </div>{" "}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-teal-100 text-sm">Published</p>
                    <p className="text-white text-2xl font-bold">
                      {stats.published}
                    </p>
                  </div>
                  <FaCertificate className="text-green-300 text-xl" />
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-teal-100 text-sm">Important</p>
                    <p className="text-white text-2xl font-bold">
                      {stats.important}
                    </p>
                  </div>
                  <FaStar className="text-yellow-300 text-xl" />
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-teal-100 text-sm">Drafts</p>
                    <p className="text-white text-2xl font-bold">
                      {stats.drafts}
                    </p>
                  </div>
                  <FaRegFileAlt className="text-yellow-300 text-xl" />
                </div>
              </div>
            </div>
            {/* Quick stats bar - kept for backwards compatibility */}
            <div className="flex flex-wrap gap-6 mt-4">
              <div className="flex items-center text-teal-100">
                <FaCheckCircle className="mr-2" />
                <span className="text-sm">
                  <span className="font-semibold text-white">
                    {stats.published}
                  </span>{" "}
                  Published
                </span>
              </div>
              <div className="flex items-center text-teal-100">
                <FaRegFileAlt className="mr-2" />
                <span className="text-sm">
                  <span className="font-semibold text-white">
                    {stats.drafts}
                  </span>{" "}
                  Drafts
                </span>
              </div>
              <div className="flex items-center text-teal-100">
                <FaExclamationTriangle className="mr-2" />
                <span className="text-sm">
                  <span className="font-semibold text-white">
                    {stats.important}
                  </span>{" "}
                  Important
                </span>
              </div>
            </div>
          </div>{" "}
          <div className="mt-6 lg:mt-0 lg:ml-8 flex flex-col gap-3">
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  if (showForm) {
                    resetForm(true);
                  } else {
                    resetForm();
                    setShowForm(true);
                  }
                }}
                className="flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-300 border border-white/20 font-medium shadow-lg"
              >
                <FaPlus className="mr-2" />
                {showForm ? "Cancel" : "Create Notice"}
              </button>{" "}
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="flex items-center px-4 py-3 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/20 font-medium"
              >
                <FaLayerGroup className="mr-2" />
                Templates
                <FaChevronDown
                  className={`ml-2 transition-transform duration-300 ${
                    showTemplates ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/20 font-medium"
              >
                <FaSync
                  className={`mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </button>

              <button
                onClick={() =>
                  setViewMode(viewMode === "grid" ? "list" : "grid")
                }
                className="flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/20 font-medium"
              >
                {viewMode === "grid" ? (
                  <FaList className="mr-2" />
                ) : (
                  <FaTh className="mr-2" />
                )}
                {viewMode === "grid" ? "List" : "Grid"}
              </button>
            </div>
          </div>{" "}
        </div>
      </div>
      {/* Global Template Selector */}
      {showTemplates && !showForm && (
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 animate-fadeIn">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <FaLayerGroup className="mr-3 text-teal-600" />
                Notice Templates
              </h3>
              <p className="text-gray-600 mt-1">
                Choose a template to quickly create a notice
              </p>
            </div>
            <button
              onClick={() => setShowTemplates(false)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimes />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {noticeTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => {
                  setShowForm(true);
                  applyTemplate(template);
                }}
                className="p-4 border border-gray-200 rounded-xl hover:border-teal-300 hover:shadow-lg transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 group-hover:text-teal-600 transition-colors">
                    {template.name}
                  </h4>
                  {template.isImportant && (
                    <FaStar className="text-yellow-500" />
                  )}
                </div>
                <div className="flex items-center mb-2">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {template.category}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 group-hover:text-gray-700 transition-colors">
                  {template.content}
                </p>
                <div className="mt-3 flex items-center text-teal-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  <FaPlus className="mr-1" />
                  Use Template
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Enhanced Form Section with Animation */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 transform transition-all duration-500 ease-out animate-fadeIn">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <div className="p-2 bg-teal-100 rounded-lg mr-3">
                  <FaFileAlt className="text-teal-600" />
                </div>
                {editingNotice ? "Edit Notice" : "Create New Notice"}
              </h2>
              <p className="text-gray-600 mt-1">
                {editingNotice
                  ? "Update the notice details below"
                  : "Fill in the details to create a new public notice"}
              </p>

              {/* Progress indicator for form completion */}
              <div className="mt-4">
                <div className="flex items-center text-sm text-gray-600">
                  <FaChartLine className="mr-2 text-teal-600" />
                  Form completion:{" "}
                  {Math.round(
                    (((formData.title ? 1 : 0) +
                      (formData.content ? 1 : 0) +
                      (formData.effectiveDate ? 1 : 0)) /
                      3) *
                      100
                  )}
                  %
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-gradient-to-r from-teal-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.round(
                        (((formData.title ? 1 : 0) +
                          (formData.content ? 1 : 0) +
                          (formData.effectiveDate ? 1 : 0)) /
                          3) *
                          100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Template Selector */}
            <div className="relative">
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="flex items-center px-4 py-2 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition-colors text-sm font-medium border border-teal-200"
              >
                <FaLayerGroup className="mr-2" />
                Templates
                <FaChevronDown
                  className={`ml-2 transition-transform ${
                    showTemplates ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showTemplates && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-10 max-h-80 overflow-y-auto">
                  <div className="p-3 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900 text-sm">
                      Quick Templates
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Click to apply a template
                    </p>
                  </div>
                  {noticeTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => applyTemplate(template)}
                      className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-50 last:border-b-0 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">
                            {template.name}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {template.category}
                          </p>
                        </div>
                        {template.isImportant && (
                          <FaStar className="text-yellow-500 text-xs" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notice Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter a clear, descriptive title"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                  required
                >
                  <option value="General">🔔 General</option>
                  <option value="Academic">📚 Academic</option>
                  <option value="Administrative">📋 Administrative</option>
                  <option value="Events">🎉 Events</option>
                  <option value="Facilities">
                    🔧 Facilities / Maintenance
                  </option>
                  <option value="Emergency">⚠️ Emergency</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notice Content *
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                rows="6"
                placeholder="Write the detailed content of your notice here..."
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-y transition-colors"
                required
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Effective Date *
                </label>
                <input
                  type="date"
                  name="effectiveDate"
                  value={formData.effectiveDate}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Attachments (Optional)
              </label>
              <div className="relative">
                <input
                  type="file"
                  name="attachments"
                  multiple
                  onChange={handleFileChange}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 transition-colors border border-gray-300 rounded-xl p-3"
                />
                {attachments.length > 0 && (
                  <div className="mt-3 p-3 bg-teal-50 rounded-lg border border-teal-200">
                    <div className="flex items-center text-teal-700 text-sm font-medium mb-2">
                      <FaPaperclip className="mr-2" />
                      {attachments.length} file(s) selected
                    </div>
                    <div className="space-y-1">
                      {attachments.map((file, index) => (
                        <div
                          key={index}
                          className="text-xs text-teal-600 bg-white rounded px-2 py-1"
                        >
                          {file.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-gray-200">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isImportant"
                  name="isImportant"
                  checked={formData.isImportant}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="isImportant"
                  className="ml-3 text-sm font-medium text-gray-700 flex items-center"
                >
                  <FaStar className="text-yellow-500 mr-1" />
                  Mark as Important
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-sm font-semibold shadow-lg"
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      {editingNotice ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <FaCheckCircle className="mr-2" />
                      {editingNotice ? "Update Notice" : "Create Notice"}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => resetForm(true)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}{" "}
      {/* Enhanced Search and Filters */}
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FaSearch className="mr-2 text-teal-600" />
              Search & Filter Notices
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Find specific notices quickly
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <FaFilter className="mr-2" />
              Advanced Filters
              <FaChevronDown
                className={`ml-2 transition-transform ${
                  showAdvancedFilters ? "rotate-180" : ""
                }`}
              />
            </button>

            <button
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="flex items-center px-4 py-2 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition-colors text-sm font-medium border border-teal-200"
            >
              {viewMode === "grid" ? (
                <FaList className="mr-2" />
              ) : (
                <FaTh className="mr-2" />
              )}
              {viewMode === "grid" ? "List View" : "Grid View"}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search notices by title, content, or category..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
          />
        </div>

        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
          >
            <option value="all">All Statuses</option>
            <option value="draft">📝 Draft</option>
            <option value="published">✅ Published</option>
            <option value="archived">📁 Archived</option>
          </select>

          <select
            value={filter.category}
            onChange={(e) => setFilter({ ...filter, category: e.target.value })}
            className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
          >
            <option value="all">All Categories</option>
            <option value="General">🔔 General</option>
            <option value="Academic">📚 Academic</option>
            <option value="Administrative">📋 Administrative</option>
            <option value="Events">🎉 Events</option>
            <option value="Facilities">🔧 Facilities / Maintenance</option>
            <option value="Emergency">⚠️ Emergency</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
          >
            <option value="createdAt">Sort by Created Date</option>
            <option value="effectiveDate">Sort by Effective Date</option>
            <option value="title">Sort by Title</option>
            <option value="category">Sort by Category</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
          >
            {sortOrder === "asc" ? (
              <FaArrowUp className="mr-2" />
            ) : (
              <FaArrowDown className="mr-2" />
            )}
            {sortOrder === "asc" ? "Ascending" : "Descending"}
          </button>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <select
              value={filter.importance}
              onChange={(e) =>
                setFilter({ ...filter, importance: e.target.value })
              }
              className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors bg-white"
            >
              <option value="all">All Priorities</option>
              <option value="important">⭐ Important Only</option>
              <option value="normal">📄 Normal Priority</option>
            </select>

            <select
              value={filter.dateRange}
              onChange={(e) =>
                setFilter({ ...filter, dateRange: e.target.value })
              }
              className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors bg-white"
            >
              <option value="all">All Time Ranges</option>
              <option value="active">📅 Currently Active</option>
              <option value="future">⏭️ Future Notices</option>
              <option value="expired">❌ Expired Notices</option>
            </select>
          </div>
        )}

        {/* Results Summary */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Showing {getPaginatedNotices().length} of{" "}
            {getFilteredNotices().length} notices
          </p>
          {getFilteredNotices().length > itemsPerPage && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FaChevronDown className="rotate-90" />
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {getTotalPages()}
              </span>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(getTotalPages(), currentPage + 1))
                }
                disabled={currentPage === getTotalPages()}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FaChevronDown className="-rotate-90" />
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Enhanced Notices List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl shadow-xl">
          <div className="text-center">
            <div className="relative">
              <FaSpinner className="animate-spin mx-auto text-4xl text-teal-600 mb-4" />
              <div className="absolute inset-0 rounded-full border-2 border-teal-200 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-lg text-gray-600 font-medium">
              Loading notices...
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Please wait while we fetch the latest notices
            </p>
          </div>
        </div>
      ) : getPaginatedNotices().length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-xl">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaBullhorn className="text-4xl text-gray-300" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No notices found
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filter.status !== "all" || filter.category !== "all"
              ? "Try adjusting your search criteria or filters"
              : "Create your first public notice to get started"}
          </p>
          {!showForm && (
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="inline-flex items-center px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium shadow-lg"
            >
              <FaPlus className="mr-2" />
              Create First Notice
            </button>
          )}
        </div>
      ) : (
        <div
          className={`grid gap-6 ${
            viewMode === "grid"
              ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
              : "grid-cols-1"
          }`}
        >
          {getPaginatedNotices().map((notice) => (
            <NoticeCard
              key={notice._id}
              notice={notice}
              viewMode={viewMode}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onPublish={handlePublish}
              onView={handleViewNotice}
              expandedCard={expandedCard}
              setExpandedCard={setExpandedCard}
            />
          ))}{" "}
        </div>
      )}{" "}
      {/* NoticeViewer Modal */}
      {selectedNotice && (
        <NoticeViewer
          notice={selectedNotice}
          onClose={handleCloseNoticeViewer}
        />
      )}
    </div>
  );
};

// Enhanced Notice Card Component
const NoticeCard = ({
  notice,
  viewMode,
  onEdit,
  onDelete,
  onPublish,
  onView,
  expandedCard,
  setExpandedCard,
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800 border-green-200";
      case "draft":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "archived":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "General":
        return <FaRegBell className="text-blue-500" />;
      case "Academic":
        return <FaGraduationCap className="text-purple-500" />;
      case "Administrative":
        return <FaClipboardList className="text-indigo-500" />;
      case "Events":
        return <FaCalendarAlt className="text-green-500" />;
      case "Facilities":
        return <FaTools className="text-orange-500" />;
      case "Emergency":
        return <FaExclamationTriangle className="text-red-500" />;
      default:
        return <FaRegFileAlt className="text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Tomorrow";
    if (diffDays === 0) return "Today";
    if (diffDays <= 7) return `${diffDays} days ago`;

    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isExpired =
    notice.expiryDate && new Date(notice.expiryDate) < new Date();
  const isActive =
    new Date(notice.effectiveDate) <= new Date() &&
    (!notice.expiryDate || new Date(notice.expiryDate) >= new Date());
  const expanded = expandedCard === notice._id;

  if (viewMode === "list") {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-3 rounded-xl bg-gray-50">
                  {getCategoryIcon(notice.category)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate pr-4">
                      {notice.title}
                      {notice.isImportant && (
                        <FaStar className="inline ml-2 text-yellow-500" />
                      )}
                    </h3>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                          notice.status
                        )}`}
                      >
                        {notice.status.charAt(0).toUpperCase() +
                          notice.status.slice(1)}
                      </span>

                      {isExpired && (
                        <span className="px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded-full border border-red-200">
                          Expired
                        </span>
                      )}

                      {isActive && notice.status === "published" && (
                        <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full border border-green-200">
                          Active
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center">
                      <FaTags className="mr-1" />
                      {notice.category}
                    </span>
                    <span className="flex items-center">
                      <FaCalendarAlt className="mr-1" />
                      {formatDate(notice.effectiveDate)}
                    </span>
                    {notice.expiryDate && (
                      <span className="flex items-center">
                        <FaClock className="mr-1" />
                        Expires {formatDate(notice.expiryDate)}
                      </span>
                    )}
                  </div>

                  <p className="text-gray-700 leading-relaxed">
                    {expanded
                      ? notice.content
                      : `${notice.content.substring(0, 150)}${
                          notice.content.length > 150 ? "..." : ""
                        }`}
                  </p>

                  {notice.content.length > 150 && (
                    <button
                      onClick={() =>
                        setExpandedCard(expanded ? null : notice._id)
                      }
                      className="text-teal-600 hover:text-teal-700 text-sm font-medium mt-2 flex items-center"
                    >
                      {expanded ? (
                        <>
                          <FaChevronUp className="mr-1" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <FaChevronDown className="mr-1" />
                          Read More
                        </>
                      )}
                    </button>
                  )}

                  {notice.attachments && notice.attachments.length > 0 && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <FaPaperclip className="mr-1" />
                        Attachments ({notice.attachments.length})
                      </p>
                      <div className="space-y-1">
                        {notice.attachments.map((att, index) => (
                          <a
                            key={index}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-sm text-teal-600 hover:text-teal-700 hover:underline"
                          >
                            <FaDownload className="mr-2" />
                            {att.filename || `Attachment ${index + 1}`}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-4">
            <div className="text-xs text-gray-500">
              Created {formatDate(notice.createdAt)}
            </div>{" "}
            <div className="flex gap-2">
              <button
                onClick={() => onView(notice)}
                className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition-colors"
              >
                <FaEye className="mr-1" />
                View
              </button>
              {notice.status === "draft" && (
                <button
                  onClick={() => onPublish(notice._id)}
                  className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
                >
                  <FaCheckCircle className="mr-1" />
                  Publish
                </button>
              )}
              <button
                onClick={() => onEdit(notice)}
                className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
              >
                <FaEdit className="mr-1" />
                Edit
              </button>
              <button
                onClick={() => onDelete(notice._id)}
                className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
              >
                <FaTrash className="mr-1" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view (default)
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-50">
              {getCategoryIcon(notice.category)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                {notice.title}
                {notice.isImportant && (
                  <FaStar className="inline ml-2 text-yellow-500" />
                )}
              </h3>
              <p className="text-sm text-gray-600">{notice.category}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 items-end">
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                notice.status
              )}`}
            >
              {notice.status.charAt(0).toUpperCase() + notice.status.slice(1)}
            </span>

            {isExpired && (
              <span className="px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded-full border border-red-200">
                Expired
              </span>
            )}

            {isActive && notice.status === "published" && (
              <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full border border-green-200">
                Active
              </span>
            )}
          </div>
        </div>

        <p className="text-gray-700 leading-relaxed mb-4 line-clamp-3">
          {notice.content}
        </p>

        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex items-center">
            <FaCalendarAlt className="mr-2" />
            <span>Effective: {formatDate(notice.effectiveDate)}</span>
          </div>
          {notice.expiryDate && (
            <div className="flex items-center">
              <FaClock className="mr-2" />
              <span>Expires: {formatDate(notice.expiryDate)}</span>
            </div>
          )}
          <div className="flex items-center">
            <FaRegClock className="mr-2" />
            <span>Created: {formatDate(notice.createdAt)}</span>
          </div>
        </div>

        {notice.attachments && notice.attachments.length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <FaPaperclip className="mr-1" />
              {notice.attachments.length} Attachment(s)
            </p>
            <div className="space-y-1">
              {notice.attachments.slice(0, 2).map((att, index) => (
                <a
                  key={index}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-teal-600 hover:text-teal-700 hover:underline truncate"
                >
                  {att.filename || `Attachment ${index + 1}`}
                </a>
              ))}
              {notice.attachments.length > 2 && (
                <p className="text-xs text-gray-500">
                  +{notice.attachments.length - 2} more files
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="bg-gray-50 p-4 border-t border-gray-200">
        {" "}
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => onView(notice)}
            className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition-colors"
          >
            <FaEye className="mr-1" />
            View
          </button>
          {notice.status === "draft" && (
            <button
              onClick={() => onPublish(notice._id)}
              className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
            >
              <FaCheckCircle className="mr-1" />
              Publish
            </button>
          )}
          <button
            onClick={() => onEdit(notice)}
            className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <FaEdit className="mr-1" />
            Edit
          </button>
          <button
            onClick={() => onDelete(notice._id)}
            className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
          >
            <FaTrash className="mr-1" />
            Delete
          </button>
        </div>
      </div>{" "}
    </div>
  );
};

export default PublicNotice;
