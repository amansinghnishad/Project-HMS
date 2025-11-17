import React, { useState, useEffect } from "react";
import { apiConnector } from "../../../services/apiconnector";
import {
  FaSpinner,
  FaTimes,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaGraduationCap,
  FaBuilding,
  FaBed,
  FaSearch,
  FaFilter,
  FaEye,
  FaBell,
  FaUserCheck,
  FaCalendarAlt,
  FaIdCard,
  FaUsers,
  FaSortAmountDown,
  FaDownload,
  FaTh,
  FaListUl,
  FaUserGraduate,
  FaChevronDown,
  FaCheckCircle,
  FaExclamationCircle,
  FaStar,
  FaHome,
  FaHashtag,
} from "react-icons/fa";
import { toast } from "react-hot-toast";

const ViewProfiles = () => {
  const [allStudents, setAllStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Enhanced state management
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [sortBy, setSortBy] = useState("name"); // name, rollNumber, room, allotmentDate
  const [filterBy, setFilterBy] = useState("all"); // all, male, female, course-wise
  const [courseFilter, setCourseFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [stats, setStats] = useState({
    totalStudents: 0,
    maleStudents: 0,
    femaleStudents: 0,
    courses: [],
  });

  const pickValue = (...candidates) => {
    for (const candidate of candidates) {
      if (candidate === undefined || candidate === null) {
        continue;
      }

      if (typeof candidate === "string") {
        const trimmed = candidate.trim();
        if (trimmed.length > 0) {
          return trimmed;
        }
      } else if (typeof candidate === "number") {
        if (!Number.isNaN(candidate)) {
          return candidate;
        }
      }
    }

    return "N/A";
  };

  const formatTitleCase = (value) => {
    if (typeof value !== "string") {
      return value ?? "N/A";
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return "N/A";
    }

    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  };

  const formatSgpa = (value) =>
    typeof value === "number" && value > 0 ? value.toFixed(2) : "N/A";
  useEffect(() => {
    const fetchAllottedStudents = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Authentication token not found. Please log in.");
          setLoading(false);
          return;
        }

        const response = await apiConnector(
          "GET",
          "/allotment/allotted-students",
          null,
          { Authorization: `Bearer ${token}` }
        );

        const studentsData = response.data?.data || [];
        setAllStudents(studentsData);
        setFilteredStudents(studentsData);

        // Calculate statistics
        const totalStudents = studentsData.length;
        const maleStudents = studentsData.filter(
          (student) =>
            student.studentProfileId?.gender?.toLowerCase() === "male"
        ).length;
        const femaleStudents = studentsData.filter(
          (student) =>
            student.studentProfileId?.gender?.toLowerCase() === "female"
        ).length;
        const courses = [
          ...new Set(
            studentsData
              .map((student) => student.studentProfileId?.courseName)
              .filter(Boolean)
          ),
        ];

        setStats({
          totalStudents,
          maleStudents,
          femaleStudents,
          courses,
        });

        toast.success(`Loaded ${totalStudents} student profiles`);
      } catch (err) {
        console.error("Error fetching allotted students:", err);
        const errorMessage =
          err.response?.data?.message ||
          "Failed to fetch student profiles. Please ensure the API endpoint is correct and you are authorized.";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchAllottedStudents();
  }, []);
  // Enhanced filtering and sorting logic
  useEffect(() => {
    let filtered = [...allStudents];

    // Apply search filter
    if (searchTerm) {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter((student) => {
        const nameMatch = student.studentProfileId?.name
          ?.toLowerCase()
          .includes(lowercasedSearchTerm);
        const rollNumberMatch = student.studentProfileId?.rollNumber
          ?.toLowerCase()
          .includes(lowercasedSearchTerm);
        const emailMatch = student.studentProfileId?.email
          ?.toLowerCase()
          .includes(lowercasedSearchTerm);
        const courseMatch = student.studentProfileId?.courseName
          ?.toLowerCase()
          .includes(lowercasedSearchTerm);
        const roomMatch = student.allottedRoomNumber
          ?.toString()
          .includes(lowercasedSearchTerm);

        return (
          nameMatch || rollNumberMatch || emailMatch || courseMatch || roomMatch
        );
      });
    }

    // Apply additional filters
    if (filterBy === "male") {
      filtered = filtered.filter(
        (student) => student.studentProfileId?.gender?.toLowerCase() === "male"
      );
    } else if (filterBy === "female") {
      filtered = filtered.filter(
        (student) =>
          student.studentProfileId?.gender?.toLowerCase() === "female"
      );
    }

    if (courseFilter) {
      filtered = filtered.filter(
        (student) => student.studentProfileId?.courseName === courseFilter
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.studentProfileId?.name || "").localeCompare(
            b.studentProfileId?.name || ""
          );
        case "rollNumber":
          return (a.studentProfileId?.rollNumber || "").localeCompare(
            b.studentProfileId?.rollNumber || ""
          );
        case "room":
          return (a.allottedRoomNumber || 0) - (b.allottedRoomNumber || 0);
        case "allotmentDate":
          return (
            new Date(b.allotmentDate || 0) - new Date(a.allotmentDate || 0)
          );
        default:
          return 0;
      }
    });

    setFilteredStudents(filtered);
  }, [searchTerm, allStudents, filterBy, courseFilter, sortBy]);
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Enhanced action handlers
  const handleViewFullProfile = (student) => {
    setSelectedStudent(student);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedStudent(null);
  };

  const handleSendNotice = (studentId) => {
    toast.success("Notice sending feature will be implemented!");
    console.log("Send notice to student:", studentId);
    // TODO: Implement functionality to send a notice
  };

  const handleBulkAction = (action) => {
    if (selectedStudents.size === 0) {
      toast.error("Please select students first");
      return;
    }

    switch (action) {
      case "notice":
        toast.success(`Sending notice to ${selectedStudents.size} students`);
        break;
      case "export":
        toast.success(`Exporting ${selectedStudents.size} student profiles`);
        break;
      default:
        break;
    }

    setSelectedStudents(new Set());
  };

  const toggleStudentSelection = (studentId) => {
    const newSelection = new Set(selectedStudents);
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId);
    } else {
      newSelection.add(studentId);
    }
    setSelectedStudents(newSelection);
  };

  const selectAllStudents = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map((s) => s._id)));
    }
  };

  // Add keyboard shortcut for closing modal
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === "Escape" && modalOpen) {
        handleCloseModal();
      }
    };

    if (modalOpen) {
      document.addEventListener("keydown", handleKeyPress);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
      document.body.style.overflow = "unset";
    };
  }, [modalOpen]);

  const selectedProfile = selectedStudent?.studentProfileId;
  const selectedUser = selectedStudent?.userId;
  const studentName = pickValue(
    selectedProfile?.name,
    selectedStudent?.name,
    selectedUser?.name
  );
  const rollNumber = pickValue(
    selectedProfile?.rollNumber,
    selectedStudent?.rollNumber
  );
  const emailAddress = pickValue(
    selectedProfile?.email,
    selectedUser?.email
  );
  const phoneNumber = pickValue(
    selectedProfile?.contactNumber,
    selectedUser?.mobile
  );
  const genderRaw = pickValue(
    selectedProfile?.gender,
    selectedUser?.gender
  );
  const genderDisplay =
    genderRaw === "N/A" ? "N/A" : formatTitleCase(genderRaw);
  const roomPreferenceRaw = pickValue(
    selectedStudent?.roomPreference,
    selectedProfile?.roomPreference
  );
  const roomPreferenceDisplay =
    typeof roomPreferenceRaw === "string"
      ? formatTitleCase(roomPreferenceRaw.replace(/_/g, " "))
      : roomPreferenceRaw;
  const courseName = pickValue(selectedProfile?.courseName);
  const departmentName = pickValue(selectedProfile?.department);
  const semesterValue = selectedProfile?.semester;
  const semesterDisplay =
    typeof semesterValue === "number" && semesterValue > 0
      ? `Semester ${semesterValue}`
      : "N/A";
  const admissionYearValue = selectedProfile?.admissionYear;
  const admissionYearDisplay =
    typeof admissionYearValue === "number" && admissionYearValue > 0
      ? admissionYearValue.toString()
      : pickValue(admissionYearValue);
  const hostelNameDisplay = pickValue(
    selectedStudent?.hostelName,
    selectedProfile?.allottedHostelName
  );
  const roomNumberDisplay = pickValue(
    selectedStudent?.allottedRoomNumber,
    selectedProfile?.roomNumber
  );
  const floorDisplay = pickValue(selectedStudent?.floor);
  const allotmentDateDisplay = selectedStudent?.allotmentDate
    ? new Date(selectedStudent.allotmentDate).toLocaleDateString()
    : "N/A";
  const sgpaOddDisplay = formatSgpa(selectedProfile?.sgpaOdd);
  const sgpaEvenDisplay = formatSgpa(selectedProfile?.sgpaEven);
  const averageSgpaDisplay = formatSgpa(selectedStudent?.averageSgpa);
  const fatherNameValue = selectedProfile?.fatherName;
  const hasFatherName =
    typeof fatherNameValue === "string" && fatherNameValue.trim().length > 0;
  const motherNameValue = selectedProfile?.motherName;
  const hasMotherName =
    typeof motherNameValue === "string" && motherNameValue.trim().length > 0;
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
        <div className="text-center">
          <div className="relative">
            <FaSpinner className="animate-spin mx-auto text-4xl text-blue-600 mb-4" />
            <div className="absolute inset-0 rounded-full border-2 border-blue-200 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-lg text-gray-600 font-medium">
            Loading student profiles...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <FaExclamationCircle className="mx-auto text-4xl text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Unable to Load Profiles
          </h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="p-6 space-y-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Enhanced Header Section */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16"></div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between relative z-10">
          <div className="flex-1">
            <div className="flex items-center mb-3">
              <FaUsers className="text-blue-200 mr-2" />
              <span className="text-blue-100 text-sm font-medium">
                Student Management
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-3">
              Student Profiles
            </h1>
            <p className="text-blue-100 text-lg max-w-md">
              Browse and manage all registered student profiles with advanced
              search and filtering options.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="mt-6 lg:mt-0 lg:ml-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center">
              <FaUsers className="mx-auto text-2xl text-blue-200 mb-2" />
              <p className="text-2xl font-bold text-white">
                {stats.totalStudents}
              </p>
              <p className="text-blue-100 text-xs">Total Students</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center">
              <FaUserGraduate className="mx-auto text-2xl text-blue-200 mb-2" />
              <p className="text-2xl font-bold text-white">
                {stats.courses.length}
              </p>
              <p className="text-blue-100 text-xs">Courses</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center">
              <FaUser className="mx-auto text-2xl text-blue-200 mb-2" />
              <p className="text-2xl font-bold text-white">
                {stats.maleStudents}
              </p>
              <p className="text-blue-100 text-xs">Male</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center">
              <FaUser className="mx-auto text-2xl text-blue-200 mb-2" />
              <p className="text-2xl font-bold text-white">
                {stats.femaleStudents}
              </p>
              <p className="text-blue-100 text-xs">Female</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Search and Filter Section */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-6">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, roll number, email, course, or room..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          {/* Filter and Action Buttons */}
          <div className="flex flex-wrap gap-3 items-center">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                showFilters
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaFilter className="mr-2" />
              Filters
              <FaChevronDown
                className={`ml-2 transition-transform ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </button>{" "}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "grid"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                <FaTh />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "list"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                <FaListUl />
              </button>
            </div>
            {selectedStudents.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
                  {selectedStudents.size} selected
                </span>
                <button
                  onClick={() => handleBulkAction("notice")}
                  className="flex items-center px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                >
                  <FaBell className="mr-1" />
                  Send Notice
                </button>
                <button
                  onClick={() => handleBulkAction("export")}
                  className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                >
                  <FaDownload className="mr-1" />
                  Export
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="name">Name</option>
                <option value="rollNumber">Roll Number</option>
                <option value="room">Room Number</option>
                <option value="allotmentDate">Allotment Date</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course
              </label>
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">All Courses</option>
                {stats.courses.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterBy("all");
                  setCourseFilter("");
                  setSortBy("name");
                  setSearchTerm("");
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Showing{" "}
            <span className="font-semibold">{filteredStudents.length}</span> of{" "}
            <span className="font-semibold">{stats.totalStudents}</span>{" "}
            students
          </p>

          {filteredStudents.length > 0 && (
            <button
              onClick={selectAllStudents}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {selectedStudents.size === filteredStudents.length
                ? "Deselect All"
                : "Select All"}
            </button>
          )}
        </div>
      </div>
      {/* Students Grid/List */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaUserGraduate className="text-4xl text-gray-300" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            No Students Found
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filterBy !== "all" || courseFilter
              ? "No students match your current search criteria."
              : "No student profiles are available at the moment."}
          </p>
          {(searchTerm || filterBy !== "all" || courseFilter) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterBy("all");
                setCourseFilter("");
              }}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
            }
          >
            {filteredStudents.map((student) => (
              <StudentCard
                key={student._id}
                student={student}
                viewMode={viewMode}
                isSelected={selectedStudents.has(student._id)}
                onToggleSelection={toggleStudentSelection}
                onViewProfile={handleViewFullProfile}
                onSendNotice={handleSendNotice}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal for Full Profile */}
      {modalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-auto my-8 transform transition-all duration-300 ease-out scale-100 opacity-100">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-2xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>

              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mr-4">
                    <FaUser className="text-2xl text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{studentName}</h3>
                    <p className="text-blue-100 flex items-center mt-1">
                      <FaIdCard className="mr-2" />
                      Roll: {rollNumber}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                  aria-label="Close modal"
                >
                  <FaTimes size={20} />
                </button>
              </div>
            </div>
            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Contact Information */}
              <div>
                <h5 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <FaEnvelope className="mr-2 text-blue-600" />
                  Contact Information
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailItem
                    label="Email Address"
                    value={emailAddress}
                    icon={<FaEnvelope className="text-blue-600" />}
                  />
                  <DetailItem
                    label="Phone Number"
                    value={phoneNumber}
                    icon={<FaPhone className="text-green-600" />}
                  />
                  <DetailItem
                    label="Gender"
                    value={genderDisplay}
                    icon={<FaUser className="text-purple-600" />}
                  />
                  <DetailItem
                    label="Room Preference"
                    value={roomPreferenceDisplay}
                    icon={<FaBed className="text-orange-600" />}
                  />
                </div>
              </div>

              {/* Academic Details */}
              <div>
                <h5 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <FaGraduationCap className="mr-2 text-blue-600" />
                  Academic Details
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailItem
                    label="Course"
                    value={courseName}
                    icon={<FaGraduationCap className="text-blue-600" />}
                  />
                  <DetailItem
                    label="Department"
                    value={departmentName}
                    icon={<FaBuilding className="text-indigo-600" />}
                  />
                  <DetailItem
                    label="Semester"
                    value={semesterDisplay}
                    icon={<FaHashtag className="text-green-600" />}
                  />
                  <DetailItem
                    label="Admission Year"
                    value={admissionYearDisplay}
                    icon={<FaCalendarAlt className="text-teal-600" />}
                  />
                  <DetailItem
                    label="SGPA (Odd)"
                    value={sgpaOddDisplay}
                    icon={<FaStar className="text-yellow-500" />}
                  />
                  <DetailItem
                    label="SGPA (Even)"
                    value={sgpaEvenDisplay}
                    icon={<FaStar className="text-yellow-400" />}
                  />
                  <DetailItem
                    label="Average SGPA"
                    value={averageSgpaDisplay}
                    icon={<FaCheckCircle className="text-green-600" />}
                  />
                </div>
              </div>

              {/* Hostel Information */}
              <div>
                <h5 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <FaHome className="mr-2 text-blue-600" />
                  Hostel Information
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailItem
                    label="Hostel Name"
                    value={hostelNameDisplay}
                    icon={<FaBuilding className="text-blue-600" />}
                  />
                  <DetailItem
                    label="Room Number"
                    value={roomNumberDisplay}
                    icon={<FaBed className="text-green-600" />}
                  />
                  <DetailItem
                    label="Floor"
                    value={floorDisplay}
                    icon={<FaHashtag className="text-purple-600" />}
                  />
                  <DetailItem
                    label="Allotment Date"
                    value={allotmentDateDisplay}
                    icon={<FaCalendarAlt className="text-orange-600" />}
                  />
                </div>
              </div>

              {/* Additional Information */}
              {(hasFatherName || hasMotherName) && (
                <div>
                  <h5 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <FaUsers className="mr-2 text-blue-600" />
                    Family Details
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hasFatherName && (
                      <DetailItem
                        label="Father's Name"
                        value={fatherNameValue.trim()}
                        icon={<FaUser className="text-indigo-600" />}
                        fullWidth
                      />
                    )}
                    {hasMotherName && (
                      <DetailItem
                        label="Mother's Name"
                        value={motherNameValue.trim()}
                        icon={<FaUser className="text-purple-600" />}
                        fullWidth
                      />
                    )}
                  </div>
                </div>
              )}
            </div>{" "}
            {/* Modal Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-200 rounded-b-2xl flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() =>
                  handleSendNotice(selectedStudent.studentProfileId?._id)
                }
                className="flex items-center justify-center px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                <FaBell className="mr-2" />
                Send Notice
              </button>
              <button
                onClick={handleCloseModal}
                className="flex items-center justify-center px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// StudentCard Component
const StudentCard = ({
  student,
  viewMode,
  isSelected,
  onToggleSelection,
  onViewProfile,
  onSendNotice,
}) => {
  if (viewMode === "list") {
    return (
      <div className="flex items-center p-4 hover:bg-gray-50 rounded-xl transition-all duration-200 border border-gray-100 hover:border-blue-200 hover:shadow-md">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelection(student._id)}
          className="mr-4 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />

        <div className="flex-shrink-0 mr-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <FaUser className="text-blue-600" />
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
          <div>
            <h3 className="font-semibold text-gray-900 truncate">
              {student.studentProfileId?.name || "N/A"}
            </h3>
            <p className="text-sm text-gray-500">
              {student.studentProfileId?.rollNumber || "N/A"}
            </p>
          </div>

          <div className="hidden md:block">
            <p className="text-sm text-gray-600">
              {student.studentProfileId?.courseName || "N/A"}
            </p>
          </div>

          <div className="hidden md:block">
            <p className="text-sm text-gray-600 flex items-center">
              <FaBed className="mr-1" />
              Room {student.allottedRoomNumber || "N/A"}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onViewProfile(student)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="View Profile"
            >
              <FaEye />
            </button>
            <button
              onClick={() => onSendNotice(student.studentProfileId?._id)}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Send Notice"
            >
              <FaBell />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="group bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex flex-col overflow-hidden border border-gray-100 hover:border-blue-200">
      {/* Selection checkbox */}
      <div className="absolute top-3 left-3 z-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelection(student._id)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
      </div>

      <div className="p-6 flex-grow relative">
        {/* Profile Section */}
        <div className="flex items-center mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center mr-4 shrink-0 group-hover:shadow-md transition-shadow">
            <FaUser className="text-2xl text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className="text-lg font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors"
              title={student.studentProfileId?.name}
            >
              {student.studentProfileId?.name || "N/A"}
            </h3>
            <p className="text-sm text-gray-500 flex items-center">
              <FaIdCard className="mr-1" />
              {student.studentProfileId?.rollNumber || "N/A"}
            </p>
          </div>
        </div>

        {/* Student Details */}
        <div className="space-y-3 text-sm">
          <InfoItem
            label="Email"
            value={student.studentProfileId?.email || "N/A"}
            icon={<FaEnvelope className="text-blue-500" />}
            isEmail
          />
          <InfoItem
            label="Course"
            value={student.studentProfileId?.courseName || "N/A"}
            icon={<FaGraduationCap className="text-green-500" />}
          />
          <InfoItem
            label="Room"
            value={student.allottedRoomNumber || "N/A"}
            icon={<FaBed className="text-purple-500" />}
          />
          <InfoItem
            label="Floor"
            value={student.floor || "N/A"}
            icon={<FaBuilding className="text-orange-500" />}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 border-t border-gray-100 flex gap-2">
        <button
          onClick={() => onViewProfile(student)}
          className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          <FaEye className="mr-2" />
          View Details
        </button>
        <button
          onClick={() => onSendNotice(student.studentProfileId?._id)}
          className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
          title="Send Notice"
        >
          <FaBell />
        </button>
      </div>
    </div>
  );
};

// Helper component for consistent display of information items in cards
const InfoItem = ({ label, value, icon, isEmail }) => (
  <div className="flex items-center justify-between gap-2">
    <div className="flex items-center gap-2 text-gray-500">
      {icon}
      <span className="text-xs">{label}:</span>
    </div>
    <p
      className={`font-medium text-gray-700 text-right text-xs ${
        isEmail ? "break-all" : "truncate"
      }`}
      title={value}
    >
      {value}
    </p>
  </div>
);

// Helper component for detailed modal information
const DetailItem = ({ label, value, icon, badge, fullWidth }) => (
  <div
    className={`flex justify-between items-center ${
      fullWidth ? "col-span-2" : ""
    }`}
  >
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-gray-600 font-medium">{label}:</span>
    </div>
    <div className="text-right">
      {badge ? (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            badge === "success"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {value}
        </span>
      ) : (
        <span className="font-semibold text-gray-800">{value}</span>
      )}
    </div>
  </div>
);

export default ViewProfiles;
