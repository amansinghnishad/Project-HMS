import React, { useState, useEffect, useCallback } from "react";
import {
  FaCalendarAlt,
  FaPaperPlane,
  FaSpinner,
  FaCheckCircle,
  FaClock,
  FaTimes,
  FaHistory,
  FaEdit,
  FaExclamationTriangle,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { leaveService } from "../../../services/api";

const LeaveApply = () => {
  const [formData, setFormData] = useState({
    reason: "",
    startDate: "",
    endDate: "",
    emergencyContact: "",
    leaveType: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // Fetch leave history
  const fetchLeaveHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await leaveService.fetchUserLeaveRequests();
      setLeaveHistory(response?.data || []);
    } catch (error) {
      console.error("Error fetching leave history:", error);
      toast.error(
        error?.message || "Failed to fetch leave history. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaveHistory();
  }, [fetchLeaveHistory]);

  const leaveTypes = [
    {
      value: "sick",
      label: "Sick Leave",
      icon: "🏥",
      description: "Medical reasons or health issues",
    },
    {
      value: "emergency",
      label: "Emergency",
      icon: "🚨",
      description: "Family emergency or urgent personal matters",
    },
    {
      value: "personal",
      label: "Personal",
      icon: "👤",
      description: "Personal reasons or family events",
    },
    {
      value: "vacation",
      label: "Vacation",
      icon: "🏖️",
      description: "Planned vacation or holiday",
    },
    {
      value: "other",
      label: "Other",
      icon: "📝",
      description: "Any other reason not listed above",
    },
  ];
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionSuccess(false);

    const toastId = toast.loading("Submitting leave application...");

    // Validation
    if (
      !formData.leaveType ||
      !formData.reason ||
      !formData.startDate ||
      !formData.endDate ||
      !formData.emergencyContact
    ) {
      toast.error("Please fill in all required fields", { id: toastId });
      setIsSubmitting(false);
      return;
    }

    // Date validation
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      toast.error("Start date cannot be in the past", { id: toastId });
      setIsSubmitting(false);
      return;
    }

    if (endDate <= startDate) {
      toast.error("End date must be after start date", { id: toastId });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await leaveService.submitLeaveRequest(formData);

      if (response?.success) {
        toast.success(
          response.message || "Leave application submitted successfully!",
          {
            id: toastId,
          }
        );
        setSubmissionSuccess(true);

        // Reset form
        setFormData({
          reason: "",
          startDate: "",
          endDate: "",
          emergencyContact: "",
          leaveType: "",
        });

        // Refresh history without page reload
        await fetchLeaveHistory();

        // Auto switch to history tab to show the new request
        setTimeout(() => {
          setShowHistory(true);
        }, 1000);
      }
    } catch (error) {
      console.error("Error submitting leave:", error);
      toast.error(
        error.response?.data?.error ||
          error?.message ||
          "Failed to submit leave application",
        { id: toastId }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "approved":
        return "text-green-600 bg-green-100";
      case "rejected":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <FaClock className="w-3 h-3" />;
      case "approved":
        return <FaCheckCircle className="w-3 h-3" />;
      case "rejected":
        return <FaTimes className="w-3 h-3" />;
      default:
        return <FaExclamationTriangle className="w-3 h-3" />;
    }
  };

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };
  return (
    <div className="p-4 sm:p-6 bg-gradient-to-br from-green-50 to-emerald-100 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <FaCalendarAlt className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
            Leave Application
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Submit your leave requests and track their approval status
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm border">
            <button
              onClick={() => setShowHistory(false)}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                !showHistory
                  ? "bg-green-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-green-600"
              }`}
            >
              Apply for Leave
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                showHistory
                  ? "bg-green-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-green-600"
              }`}
            >
              <FaHistory className="inline mr-2" />
              History ({leaveHistory.length})
            </button>
          </div>
        </div>

        {!showHistory ? (
          // Leave Application Form
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 border border-gray-200">
              {submissionSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <FaCheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    <p className="text-green-800 font-medium">
                      Leave application submitted successfully! You will be
                      notified about the approval status.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Leave Type Selection */}
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-4">
                    Leave Type *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {leaveTypes.map((type) => (
                      <div
                        key={type.value}
                        className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          formData.leaveType === type.value
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 hover:border-green-300"
                        }`}
                        onClick={() =>
                          setFormData({ ...formData, leaveType: type.value })
                        }
                      >
                        <div className="flex items-start space-x-3">
                          <span className="text-2xl">{type.icon}</span>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-800">
                              {type.label}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {type.description}
                            </p>
                          </div>
                        </div>
                        {formData.leaveType === type.value && (
                          <div className="absolute top-2 right-2">
                            <FaCheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Date Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="startDate"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Start Date *
                    </label>
                    <div className="relative">
                      <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="date"
                        id="startDate"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-700"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="endDate"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      End Date *
                    </label>
                    <div className="relative">
                      <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="date"
                        id="endDate"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        min={
                          formData.startDate ||
                          new Date().toISOString().split("T")[0]
                        }
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-700"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Duration Display */}
                {formData.startDate && formData.endDate && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-green-800 font-medium">
                      Duration:{" "}
                      {calculateDuration(formData.startDate, formData.endDate)}{" "}
                      day(s)
                    </p>
                  </div>
                )}

                {/* Emergency Contact */}
                <div>
                  <label
                    htmlFor="emergencyContact"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Emergency Contact Number *
                  </label>
                  <input
                    type="tel"
                    id="emergencyContact"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-700"
                    placeholder="Enter emergency contact number"
                    required
                  />
                </div>

                {/* Reason */}
                <div>
                  <label
                    htmlFor="reason"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Reason for Leave *
                  </label>
                  <textarea
                    id="reason"
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-700 resize-y min-h-[120px]"
                    placeholder="Please provide detailed reason for your leave request..."
                    rows="4"
                    required
                  />
                  <div className="mt-2 text-sm text-gray-500">
                    {formData.reason.length}/500 characters
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !formData.leaveType ||
                    !formData.startDate ||
                    !formData.endDate ||
                    !formData.reason.trim()
                  }
                  className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <FaSpinner className="animate-spin w-5 h-5 mr-3" />
                      Submitting Application...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <FaPaperPlane className="w-5 h-5 mr-3" />
                      Submit Leave Application
                    </div>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          // Leave History
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <FaHistory className="w-5 h-5 mr-3 text-green-600" />
                  Leave Application History
                </h2>
                <p className="text-gray-600 mt-1">
                  Track the status of your leave applications
                </p>
              </div>

              <div className="p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <FaSpinner className="animate-spin w-8 h-8 text-green-600" />
                    <span className="ml-3 text-gray-600">
                      Loading leave history...
                    </span>
                  </div>
                ) : leaveHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <FaCalendarAlt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">
                      No Leave Applications
                    </h3>
                    <p className="text-gray-500">
                      You haven't submitted any leave applications yet.
                    </p>
                    <button
                      onClick={() => setShowHistory(false)}
                      className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Apply for Leave
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {leaveHistory.map((leave, index) => (
                      <div
                        key={leave._id || index}
                        className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-semibold text-gray-800 capitalize">
                                {leave.leaveType || "General"} Leave
                              </h3>
                              <div
                                className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                  leave.status || "pending"
                                )}`}
                              >
                                {getStatusIcon(leave.status || "pending")}
                                <span className="ml-1 capitalize">
                                  {leave.status || "pending"}
                                </span>
                              </div>
                            </div>{" "}
                            <p className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">Duration:</span>{" "}
                              {new Date(
                                leave.fromDate || leave.startDate
                              ).toLocaleDateString()}{" "}
                              -{" "}
                              {new Date(
                                leave.toDate || leave.endDate
                              ).toLocaleDateString()}{" "}
                              (
                              {calculateDuration(
                                leave.fromDate || leave.startDate,
                                leave.toDate || leave.endDate
                              )}{" "}
                              days)
                            </p>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              <span className="font-medium">Reason:</span>{" "}
                              {leave.reason}
                            </p>
                            {leave.emergencyContact && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">
                                  Emergency Contact:
                                </span>{" "}
                                {leave.emergencyContact}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>
                            Applied on{" "}
                            {new Date(
                              leave.createdAt || leave.submittedAt
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {leave.approvedBy && (
                            <span className="text-green-600 font-medium">
                              Approved by {leave.approvedBy}
                            </span>
                          )}
                          {leave.rejectedBy && (
                            <span className="text-red-600 font-medium">
                              Rejected by {leave.rejectedBy}
                            </span>
                          )}
                        </div>{" "}
                        {(leave.provostComments || leave.adminComments) && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-700 mb-1">
                              Provost Comments:
                            </p>
                            <p className="text-sm text-gray-600">
                              {leave.provostComments || leave.adminComments}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveApply;
