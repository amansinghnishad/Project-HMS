import React, { useState, useEffect } from "react";
import {
  FaSearch,
  FaSpinner,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaUser,
  FaEye,
  FaBell,
  FaUserGraduate,
  FaEnvelope,
  FaCalendarAlt,
  FaPaperPlane,
  FaHistory,
  FaFilter,
  FaSort,
  FaArrowUp,
  FaArrowDown,
  FaChevronDown,
  FaChevronUp,
  FaClipboardList,
  FaBed,
  FaGraduationCap,
  FaHashtag,
  FaStar,
  FaFlag,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
  FaSync,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEyeSlash,
  FaChartBar,
  FaTh,
  FaList,
  FaRegCalendarAlt,
  FaUserCheck,
  FaFileAlt,
  FaChevronLeft,
  FaChevronRight,
  FaComments,
  FaBullhorn,
  FaInfoCircle,
  FaHandshake,
  FaChartLine,
  FaUsers,
  FaRegFileAlt,
  FaRegUserCircle,
  FaRegBell,
  FaRegClock,
  FaRegEnvelope,
  FaCogs,
  FaUserFriends,
  FaMailBulk,
  FaBookmark,
  FaLayerGroup,
  FaRocket,
  FaLightbulb,
  FaShieldAlt,
  FaGlobe,
  FaDownload,
  FaExpand,
  FaCompress,
  FaTextWidth,
  FaBold,
  FaItalic,
  FaUnderline,
  FaHighlighter,
  FaQuoteLeft,
  FaSave,
  FaCopy,
  FaPaste,
  FaRedo,
  FaUndo,
  FaHome,
  FaBuilding,
  FaTools,
  FaWifi,
  FaUtensils,
  FaGamepad,
  FaDumbbell,
  FaBook,
  FaLaptop,
  FaCar,
  FaBus,
  FaTrain,
  FaPlane,
  FaPhone,
  FaFax,
  FaMobile,
  FaMapMarker,
  FaGift,
  FaHeart,
  FaThumbsUp,
  FaShare,
  FaLink,
  FaExternalLinkAlt,
  FaCode,
  FaDatabase,
  FaServer,
  FaCloud,
  FaLock,
  FaUnlock,
  FaKey,
  FaFingerprint,
  FaIdCard,
  FaCheckSquare,
  FaCertificate,
  FaAward,
  FaTrophy,
  FaMedal,
  FaRibbon,
  FaCrown,
  FaGem,
  FaShapes,
  FaCoins,
  FaCreditCard,
  FaWallet,
  FaMoneyBill,
  FaBan,
  FaStop,
  FaPause,
  FaPlay,
  FaForward,
  FaBackward,
  FaStepForward,
  FaStepBackward,
  FaFastForward,
  FaFastBackward,
  FaVolumeMute,
  FaVolumeDown,
  FaVolumeUp,
  FaVolumeOff,
  FaMicrophone,
  FaMicrophoneSlash,
  FaHeadphones,
  FaBroadcastTower,
  FaMusic,
  FaVideo,
  FaVideoSlash,
  FaCamera,
  FaCameraRetro,
  FaImage,
  FaImages,
  FaFileImage,
  FaFilm,
  FaTv,
  FaDesktop,
  FaTabletAlt,
  FaMobileAlt,
  FaKeyboard,
  FaMouse,
  FaPrint,
  FaQrcode,
  FaProjectDiagram,
  FaNetworkWired,
  FaRoute,
  FaRoad,
  FaMap,
  FaCompass,
  FaLocationArrow,
  FaCrosshairs,
  FaBullseye,
  FaAnchor,
  FaShip,
  FaHelicopter,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import NoticeViewer from "../../../components/NoticeViewer/NoticeViewer";
import { noticeService } from "../../../services/api/noticeService";
import { allotmentService } from "../../../services/api/allotmentService";

const StudentNotice = () => {
  // Enhanced form state
  const [formData, setFormData] = useState({
    recipientId: "",
    noticeType: "",
    subject: "",
    message: "",
    actionRequired: "",
    isUrgent: false,
  });

  // Enhanced student management state
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  // Enhanced loading and submission state
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Enhanced notice history state
  const [sentNotices, setSentNotices] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historySortBy, setHistorySortBy] = useState("date");
  const [historySortOrder, setHistorySortOrder] = useState("desc");
  const [historyFilter, setHistoryFilter] = useState("all");
  const [historySearchTerm, setHistorySearchTerm] = useState("");

  // Stats and analytics
  const [stats, setStats] = useState({
    totalSent: 0,
    urgent: 0,
    pending: 0,
    delivered: 0,
  });
  // UI state
  const [refreshing, setRefreshing] = useState(false);
  const [showFormDetails, setShowFormDetails] = useState(true);
  const [viewMode, setViewMode] = useState("form"); // form, history, analytics
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedNotices, setSelectedNotices] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);

  // Templates and presets
  const [noticeTemplates, setNoticeTemplates] = useState([
    {
      id: 1,
      name: "Room Inspection Notice",
      type: "Room Inspection",
      subject: "Upcoming Room Inspection",
      message:
        "Your room will be inspected on [DATE]. Please ensure your room is clean and organized.",
      actionRequired: "Clean and organize your room before inspection",
    },
    {
      id: 2,
      name: "Fee Payment Reminder",
      type: "Fee Notice",
      subject: "Hostel Fee Payment Due",
      message:
        "Your hostel fee payment is due. Please clear your dues by [DATE].",
      actionRequired: "Pay outstanding dues immediately",
    },
    {
      id: 3,
      name: "Behavioral Warning",
      type: "Behavioral Warning",
      subject: "Behavioral Concern Notice",
      message:
        "This notice is regarding your recent behavior that violates hostel regulations.",
      actionRequired: "Report to the warden's office within 24 hours",
    },
  ]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  // Load allotted students on component mount
  useEffect(() => {
    loadAllottedStudents();
    loadSentNotices();
  }, []);

  // Enhanced filter students based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredStudents([]);
      setShowStudentDropdown(false);
    } else {
      const filtered = students.filter((student) => {
        const name = student.studentProfileId?.name || "";
        const rollNumber = student.studentProfileId?.rollNumber || "";
        const email = student.studentProfileId?.email || "";
        const room = student.roomNumber || "";
        const course = student.studentProfileId?.course || "";

        return (
          name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          room.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
      setFilteredStudents(filtered);
      setShowStudentDropdown(filtered.length > 0);
    }
  }, [searchTerm, students]);

  // Calculate statistics
  useEffect(() => {
    calculateStats();
  }, [sentNotices]);

  const calculateStats = () => {
    const stats = {
      totalSent: sentNotices.length,
      urgent: sentNotices.filter((notice) => notice.isUrgent).length,
      pending: sentNotices.filter(
        (notice) => notice.status === "pending" || !notice.status
      ).length,
      delivered: sentNotices.filter(
        (notice) => notice.status === "delivered" || notice.status === "read"
      ).length,
    };
    setStats(stats);
  };
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadAllottedStudents(), loadSentNotices()]);
    setRefreshing(false);
    toast.success("Data refreshed successfully");
  };

  const loadAllottedStudents = async () => {
    try {
      setStudentsLoading(true);
      const response = await allotmentService.fetchAllottedStudents();
      setStudents(response.data || []);
    } catch (error) {
      console.error("Error loading students:", error);
      toast.error(
        error.message || error?.payload?.message || "Error loading students"
      );
    } finally {
      setStudentsLoading(false);
    }
  };
  const loadSentNotices = async (page = 1, limit = 20) => {
    try {
      setHistoryLoading(true);
      const response = await noticeService.fetchSentNotices({ page, limit });
      setSentNotices(response.data || []);
    } catch (error) {
      console.error("Error loading sent notices:", error);
      toast.error(
        error.message ||
          error?.payload?.message ||
          "Error loading notice history"
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const getFilteredNotices = () => {
    let filtered = sentNotices;

    // Filter by type
    if (historyFilter !== "all") {
      filtered = filtered.filter(
        (notice) => notice.noticeType === historyFilter
      );
    }

    // Filter by search term
    if (historySearchTerm) {
      filtered = filtered.filter(
        (notice) =>
          notice.subject
            .toLowerCase()
            .includes(historySearchTerm.toLowerCase()) ||
          notice.message
            .toLowerCase()
            .includes(historySearchTerm.toLowerCase()) ||
          notice.recipientId?.name
            ?.toLowerCase()
            .includes(historySearchTerm.toLowerCase())
      );
    }

    // Sort results
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (historySortBy) {
        case "date":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case "type":
          aValue = a.noticeType;
          bValue = b.noticeType;
          break;
        case "urgent":
          aValue = a.isUrgent ? 1 : 0;
          bValue = b.isUrgent ? 1 : 0;
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }

      if (historySortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setSearchTerm(
      `${student.studentProfileId?.name} (${student.studentProfileId?.rollNumber}) - Room ${student.roomNumber}`
    );
    setFormData((prev) => ({
      ...prev,
      recipientId: student.userId,
    }));
    setShowStudentDropdown(false);
  };
  const handleViewNotice = (notice) => {
    console.log("=== DEBUG: Original notice data ===");
    console.log("notice:", notice);
    console.log("notice.subject:", notice.subject);
    console.log("notice.message:", notice.message);
    console.log("notice.noticeType:", notice.noticeType);
    console.log("notice.isUrgent:", notice.isUrgent);
    console.log("================================");

    // Transform the notice data to match NoticeViewer expectations
    const transformedNotice = {
      _id: notice._id || notice.id,
      title: notice.subject || notice.title || "No Title",
      content: notice.message || notice.content || "No Content",
      category: notice.noticeType || notice.category || "General",
      isImportant: notice.isUrgent || notice.isImportant || false,
      publishedAt: notice.createdAt || notice.publishedAt || new Date(),
      createdAt: notice.createdAt || new Date(),
      effectiveDate: notice.effectiveDate || notice.createdAt || new Date(),
      expiryDate: notice.expiryDate || null,
      pdfPath: notice.pdfPath || null,
      actionRequired: notice.actionRequired || null,
      recipientName: notice.recipientId?.name || "Unknown Student",
      status: notice.status || "sent",
      isRead: notice.isRead || false,
    };

    console.log("=== DEBUG: Transformed notice data ===");
    console.log("transformedNotice:", transformedNotice);
    console.log("=========================================");

    setSelectedNotice(transformedNotice);
  };

  const handleCloseNoticeViewer = () => {
    setSelectedNotice(null);
  };

  const clearSelectedStudent = () => {
    setSelectedStudent(null);
    setSearchTerm("");
    setFormData((prev) => ({
      ...prev,
      recipientId: "",
    }));
  };

  const resetForm = () => {
    setFormData({
      recipientId: "",
      noticeType: "",
      subject: "",
      message: "",
      actionRequired: "",
      isUrgent: false,
    });
    clearSelectedStudent();
  };

  const getNoticeTypeColor = (type) => {
    switch (type) {
      case "Behavioral Warning":
        return "bg-amber-100 text-amber-800 border border-amber-200";
      case "Academic Warning":
        return "bg-orange-100 text-orange-800 border border-orange-200";
      case "Disciplinary Action":
        return "bg-red-100 text-red-800 border border-red-200";
      case "General Notice":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "Room Inspection":
        return "bg-purple-100 text-purple-800 border border-purple-200";
      case "Fee Notice":
        return "bg-green-100 text-green-800 border border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const getNoticeTypeIcon = (type) => {
    switch (type) {
      case "Behavioral Warning":
        return <FaExclamationTriangle className="text-amber-500" />;
      case "Academic Warning":
        return <FaGraduationCap className="text-orange-500" />;
      case "Disciplinary Action":
        return <FaFlag className="text-red-500" />;
      case "General Notice":
        return <FaBell className="text-blue-500" />;
      case "Room Inspection":
        return <FaBed className="text-purple-500" />;
      case "Fee Notice":
        return <FaEnvelope className="text-green-500" />;
      default:
        return <FaClipboardList className="text-gray-500" />;
    }
  };
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays <= 7) return `${diffDays - 1} days ago`;

    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const applyTemplate = (template) => {
    setFormData((prev) => ({
      ...prev,
      noticeType: template.type,
      subject: template.subject,
      message: template.message,
      actionRequired: template.actionRequired,
    }));
    setSelectedTemplate(template);
    setShowTemplates(false);
    toast.success(`Template "${template.name}" applied`);
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
    // Handle bulk actions like mark as read, delete, etc.
    console.log(`Bulk action: ${action} on notices:`, selectedNotices);
    setSelectedNotices([]);
    setShowBulkActions(false);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.recipientId) {
      toast.error("Please select a student");
      return;
    }

    if (!formData.noticeType || !formData.subject || !formData.message) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);

      // Add debugging logs
      console.log("Sending notice with data:", formData);
      console.log("Current user token:", localStorage.getItem("token"));

      const response = await noticeService.sendNotice(formData);

      console.log("Notice response:", response);

      toast.success("Notice sent successfully!");
      resetForm();
      if (showHistory) {
        loadSentNotices();
      }
    } catch (error) {
      console.error("Error sending notice:", error);
      toast.error(
        error.message ||
          error?.payload?.message ||
          "An error occurred while sending the notice"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const toggleHistory = () => {
    setShowHistory(!showHistory);
    if (!showHistory && sentNotices.length === 0) {
      loadSentNotices();
    }
  };

  if (studentsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-blue-400 rounded-full animate-spin animate-reverse"></div>
          </div>
          <div className="mt-6 text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Loading Student Notice System
            </h3>
            <p className="text-gray-600">
              Fetching student data and notice templates...
            </p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Modern Header Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                Student Notice Management
              </h1>
              <p className="text-blue-100 text-lg">
                Send personalized notices and track communication with students
              </p>
            </div>
            <div className="mt-4 lg:mt-0 flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-white/10 rounded-lg px-4 py-2">
                <FaUsers className="w-5 h-5" />
                <span className="font-medium">{students.length} Students</span>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
              >
                <FaSync
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Statistics Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sent</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalSent}
                </p>
              </div>
              <FaMailBulk className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Urgent</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.urgent}
                </p>
              </div>
              <FaExclamationTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-amber-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.pending}
                </p>
              </div>
              <FaClock className="w-8 h-8 text-amber-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.delivered}
                </p>
              </div>
              <FaCheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>
      </div>
      {/* View Mode Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-white rounded-2xl shadow-xl p-2">
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode("form")}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                viewMode === "form"
                  ? "bg-blue-500 text-white shadow-lg"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <FaPaperPlane className="w-5 h-5" />
              <span>Send Notice</span>
            </button>
            <button
              onClick={() => setViewMode("history")}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                viewMode === "history"
                  ? "bg-blue-500 text-white shadow-lg"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <FaHistory className="w-5 h-5" />
              <span>Notice History</span>
            </button>
            <button
              onClick={() => setViewMode("analytics")}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                viewMode === "analytics"
                  ? "bg-blue-500 text-white shadow-lg"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <FaChartBar className="w-5 h-5" />
              <span>Analytics</span>
            </button>
          </div>
        </div>
      </div>{" "}
      {/* Content based on view mode */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {viewMode === "form" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Notice Form */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Send Notice
                </h2>
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <FaFileAlt className="w-4 h-4" />
                  <span>Templates</span>
                </button>
              </div>

              {/* Templates Section */}
              {showTemplates && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">
                    Quick Templates
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {noticeTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => applyTemplate(template)}
                        className="text-left p-3 bg-white rounded-lg border hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      >
                        <div className="font-medium text-gray-800">
                          {template.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {template.type}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Student Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search and Select Student *
                </label>
                <div className="relative">
                  <div className="flex space-x-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        placeholder="Search by name, roll number, room..."
                        className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    {selectedStudent && (
                      <button
                        type="button"
                        onClick={clearSelectedStudent}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>

                  {/* Student Dropdown */}
                  {showStudentDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredStudents.map((student) => (
                        <button
                          key={student._id}
                          type="button"
                          onClick={() => handleStudentSelect(student)}
                          className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-800">
                            {student.studentProfileId?.name || "N/A"}
                          </div>
                          <div className="text-sm text-gray-600">
                            Roll:{" "}
                            {student.studentProfileId?.rollNumber || "N/A"} •
                            Room: {student.allottedRoomNumber || "N/A"} • Email:{" "}
                            {student.studentProfileId?.email || "N/A"}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Selected Student Display */}
                  {selectedStudent && (
                    <div className="mt-3 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                      <div className="flex items-center">
                        <FaUser className="text-teal-600 mr-2" />
                        <div>
                          <div className="font-medium text-teal-800">
                            {selectedStudent.studentProfileId?.name}
                          </div>
                          <div className="text-sm text-teal-600">
                            Roll: {selectedStudent.studentProfileId?.rollNumber}{" "}
                            • Room: {selectedStudent.allottedRoomNumber} •
                            Floor: {selectedStudent.floor}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notice Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notice Type *
                    </label>
                    <select
                      name="noticeType"
                      value={formData.noticeType}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Type</option>
                      <option value="Behavioral Warning">
                        Behavioral Warning
                      </option>
                      <option value="Academic Warning">Academic Warning</option>
                      <option value="Disciplinary Action">
                        Disciplinary Action
                      </option>
                      <option value="General Notice">General Notice</option>
                      <option value="Room Inspection">Room Inspection</option>
                      <option value="Fee Notice">Fee Notice</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="urgent"
                        name="isUrgent"
                        checked={formData.isUrgent}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="urgent"
                        className="ml-2 text-sm font-medium text-gray-700 flex items-center"
                      >
                        <FaExclamationTriangle className="text-yellow-500 mr-1" />
                        Mark as Urgent
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notice Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="Enter notice subject"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notice Details *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows="5"
                    placeholder="Describe the issue or notice details..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action Required (Optional)
                  </label>
                  <input
                    type="text"
                    name="actionRequired"
                    value={formData.actionRequired}
                    onChange={handleInputChange}
                    placeholder="What the student needs to do..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={submitting || !selectedStudent}
                    className="w-full sm:flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {submitting ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane className="mr-2" />
                        Send Notice
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full sm:w-auto px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>

            {/* Quick Stats and Recent Notices */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setViewMode("history")}
                    className="w-full flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <FaHistory className="text-blue-500" />
                    <span>View Notice History</span>
                  </button>
                  <button
                    onClick={() => setViewMode("analytics")}
                    className="w-full flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <FaChartBar className="text-green-500" />
                    <span>View Analytics</span>
                  </button>
                </div>
              </div>

              {/* Recent Notices Preview */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Notices</h3>
                {sentNotices.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No notices sent yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {sentNotices.slice(0, 3).map((notice) => (
                      <div
                        key={notice._id}
                        className="border border-gray-200 rounded-lg p-3"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getNoticeTypeColor(
                              notice.noticeType
                            )}`}
                          >
                            {notice.noticeType}
                          </span>
                          {notice.isUrgent && (
                            <FaExclamationTriangle className="text-yellow-500" />
                          )}
                        </div>
                        <h4 className="font-medium text-gray-800 text-sm mb-1">
                          {notice.subject}
                        </h4>{" "}
                        <p className="text-xs text-gray-600 mb-2">
                          To: {notice.recipientId?.name || "N/A"}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">
                            {formatDate(notice.createdAt)}
                          </p>
                          <button
                            onClick={() => handleViewNotice(notice)}
                            className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {viewMode === "history" && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 lg:mb-0">
                Notice History
              </h2>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search notices..."
                    value={historySearchTerm}
                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>

                <select
                  value={historyFilter}
                  onChange={(e) => setHistoryFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="Behavioral Warning">Behavioral Warning</option>
                  <option value="Academic Warning">Academic Warning</option>
                  <option value="Disciplinary Action">
                    Disciplinary Action
                  </option>
                  <option value="General Notice">General Notice</option>
                  <option value="Room Inspection">Room Inspection</option>
                  <option value="Fee Notice">Fee Notice</option>
                </select>
              </div>
            </div>

            {historyLoading ? (
              <div className="text-center py-12">
                <FaSpinner className="animate-spin mx-auto text-3xl text-blue-600 mb-4" />
                <p className="text-gray-600">Loading notice history...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {getPaginatedNotices().map((notice) => (
                  <div
                    key={notice._id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getNoticeTypeIcon(notice.noticeType)}
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getNoticeTypeColor(
                            notice.noticeType
                          )}`}
                        >
                          {notice.noticeType}
                        </span>
                        {notice.isUrgent && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                            Urgent
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDate(notice.createdAt)}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {notice.subject}
                    </h3>
                    <p className="text-gray-600 mb-3">{notice.message}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <FaUser className="mr-1" />
                          {notice.recipientId?.name || "Unknown Student"}
                        </span>
                        {notice.actionRequired && (
                          <span className="flex items-center">
                            <FaClipboardList className="mr-1" />
                            Action Required
                          </span>
                        )}
                      </div>{" "}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewNotice(notice)}
                          className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition-colors"
                        >
                          <FaEye className="mr-1" />
                          View
                        </button>
                        {notice.isRead ? (
                          <span className="flex items-center text-green-600 text-sm">
                            <FaCheckCircle className="mr-1" />
                            Read
                          </span>
                        ) : (
                          <span className="flex items-center text-amber-600 text-sm">
                            <FaClock className="mr-1" />
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {getTotalPages() > 1 && (
                  <div className="flex items-center justify-center space-x-2 mt-6">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                      className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <FaChevronLeft />
                    </button>

                    <span className="px-4 py-2 text-sm text-gray-600">
                      Page {currentPage} of {getTotalPages()}
                    </span>

                    <button
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(getTotalPages(), prev + 1)
                        )
                      }
                      disabled={currentPage === getTotalPages()}
                      className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <FaChevronRight />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {viewMode === "analytics" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Notice Analytics
              </h2>

              {/* Analytics Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">Total Notices</p>
                      <p className="text-3xl font-bold">{stats.totalSent}</p>
                    </div>
                    <FaMailBulk className="w-12 h-12 text-blue-200" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100">Response Rate</p>
                      <p className="text-3xl font-bold">
                        {stats.totalSent > 0
                          ? Math.round(
                              (stats.delivered / stats.totalSent) * 100
                            )
                          : 0}
                        %
                      </p>
                    </div>
                    <FaChartLine className="w-12 h-12 text-green-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100">Active Students</p>
                      <p className="text-3xl font-bold">{students.length}</p>
                    </div>
                    <FaUsers className="w-12 h-12 text-purple-200" />
                  </div>
                </div>
              </div>

              {/* Notice Type Distribution */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">
                  Notice Type Distribution
                </h3>
                <div className="space-y-3">
                  {[
                    "Behavioral Warning",
                    "Academic Warning",
                    "Disciplinary Action",
                    "General Notice",
                    "Room Inspection",
                    "Fee Notice",
                  ].map((type) => {
                    const count = sentNotices.filter(
                      (notice) => notice.noticeType === type
                    ).length;
                    const percentage =
                      stats.totalSent > 0 ? (count / stats.totalSent) * 100 : 0;

                    return (
                      <div
                        key={type}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          {getNoticeTypeIcon(type)}
                          <span className="font-medium">{type}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 w-12 text-right">
                            {count}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>{" "}
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

export default StudentNotice;
