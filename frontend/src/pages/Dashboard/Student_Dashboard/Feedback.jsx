import React, { useState, useEffect } from "react";
import {
  FaCommentDots,
  FaPaperPlane,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaHistory,
  FaExclamationTriangle,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { feedbackService } from "../../../services/api";

const Feedback = () => {
  const [feedbackType, setFeedbackType] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchFeedbackHistory = async () => {
    try {
      setLoading(true);
      const response = await feedbackService.fetchUserFeedback();
      setFeedbackHistory(response?.data || []);
    } catch (error) {
      console.error("Error fetching feedback history:", error);
      toast.error(
        error?.message || "Failed to fetch feedback history. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbackHistory();
  }, []);

  const feedbackTypes = [
    {
      value: "Room Related",
      icon: "🏠",
      description: "Issues with room facilities, cleanliness, or repairs",
    },
    {
      value: "Mess Related",
      icon: "🍽️",
      description: "Food quality, menu suggestions, or dining hall issues",
    },
    {
      value: "Hostel Library",
      icon: "📚",
      description: "Library facilities, books, or study environment",
    },
    {
      value: "Gaming Room Related",
      icon: "🎮",
      description: "Gaming equipment, room availability, or maintenance",
    },
    {
      value: "Security & Safety",
      icon: "🔒",
      description: "Safety concerns or security-related issues",
    },
    {
      value: "Wi-Fi & Internet",
      icon: "📶",
      description: "Internet connectivity or network issues",
    },
    {
      value: "Other",
      icon: "💬",
      description: "Any other feedback or suggestions",
    },
  ];
  const handleFeedbackTypeChange = (e) => {
    setFeedbackType(e.target.value);
    if (e.target.value !== "Other") {
      setCustomSubject("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionSuccess(false);

    const toastId = toast.loading("Submitting your feedback...");

    try {
      const payload = {
        feedbackType,
        message,
      };

      if (feedbackType === "Other") {
        payload.customSubject = customSubject;
      }
      const response = await feedbackService.submitFeedback(payload);
      if (response?.success) {
        toast.success(
          "Feedback submitted successfully! Thank you for your input.",
          { id: toastId }
        );
        setSubmissionSuccess(true);

        // Reset form
        setFeedbackType("");
        setCustomSubject("");
        setMessage("");

        // Refresh history without page reload
        await fetchFeedbackHistory();

        // Auto switch to history tab to show the new feedback
        setTimeout(() => {
          setShowHistory(true);
        }, 1000);
      }
    } catch (error) {
      console.error("Error details:", error);
      toast.error(
        error?.message || "Failed to submit feedback. Please try again.",
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
      case "in-progress":
        return "text-blue-600 bg-blue-100";
      case "resolved":
        return "text-green-600 bg-green-100";
      case "closed":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <FaExclamationTriangle className="w-3 h-3" />;
      case "in-progress":
        return <FaSpinner className="w-3 h-3 animate-spin" />;
      case "resolved":
        return <FaCheck className="w-3 h-3" />;
      case "closed":
        return <FaTimes className="w-3 h-3" />;
      default:
        return <FaExclamationTriangle className="w-3 h-3" />;
    }
  };
  return (
    <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <FaCommentDots className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
            Student Feedback
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Help us improve your hostel experience by sharing your feedback and
            suggestions
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm border">
            <button
              onClick={() => setShowHistory(false)}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                !showHistory
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-indigo-600"
              }`}
            >
              Submit Feedback
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                showHistory
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-indigo-600"
              }`}
            >
              <FaHistory className="inline mr-2" />
              History ({feedbackHistory.length})
            </button>
          </div>
        </div>

        {!showHistory ? (
          // Feedback Form
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 border border-gray-200">
              {submissionSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <FaCheck className="w-5 h-5 text-green-600 mr-3" />
                    <p className="text-green-800 font-medium">
                      Feedback submitted successfully! Thank you for helping us
                      improve.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Feedback Type Selection */}
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-4">
                    Select Feedback Category
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {feedbackTypes.map((type) => (
                      <div
                        key={type.value}
                        className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          feedbackType === type.value
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-gray-200 hover:border-indigo-300"
                        }`}
                        onClick={() =>
                          handleFeedbackTypeChange({
                            target: { value: type.value },
                          })
                        }
                      >
                        <div className="flex items-start space-x-3">
                          <span className="text-2xl">{type.icon}</span>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-800">
                              {type.value}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {type.description}
                            </p>
                          </div>
                        </div>
                        {feedbackType === type.value && (
                          <div className="absolute top-2 right-2">
                            <FaCheck className="w-4 h-4 text-indigo-600" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Subject for "Other" */}
                {feedbackType === "Other" && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Subject *
                    </label>
                    <input
                      type="text"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      placeholder="Please specify the subject of your feedback"
                      required
                    />
                  </div>
                )}

                {/* Message */}
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-2">
                    Your Feedback Message *
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y min-h-[150px] text-sm sm:text-base"
                    placeholder="Please share your detailed feedback, suggestions, or concerns. The more specific you are, the better we can help..."
                    rows="6"
                    required
                  ></textarea>
                  <div className="mt-2 text-sm text-gray-500">
                    {message.length}/1000 characters
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={
                    isSubmitting || !feedbackType.trim() || !message.trim()
                  }
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <FaSpinner className="animate-spin w-5 h-5 mr-3" />
                      Submitting Feedback...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <FaPaperPlane className="w-5 h-5 mr-3" />
                      Submit Feedback
                    </div>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          // Feedback History
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <FaHistory className="w-5 h-5 mr-3 text-indigo-600" />
                  Your Feedback History
                </h2>
                <p className="text-gray-600 mt-1">
                  Track the status of your submitted feedback
                </p>
              </div>

              <div className="p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <FaSpinner className="animate-spin w-8 h-8 text-indigo-600" />
                    <span className="ml-3 text-gray-600">
                      Loading feedback history...
                    </span>
                  </div>
                ) : feedbackHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <FaCommentDots className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">
                      No Feedback Yet
                    </h3>
                    <p className="text-gray-500">
                      You haven't submitted any feedback yet.
                    </p>
                    <button
                      onClick={() => setShowHistory(false)}
                      className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Submit Your First Feedback
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {feedbackHistory.map((feedback, index) => (
                      <div
                        key={feedback._id || index}
                        className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800 mb-1">
                              {feedback.feedbackType === "Other" &&
                              feedback.customSubject
                                ? feedback.customSubject
                                : feedback.feedbackType}
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {feedback.message}
                            </p>
                          </div>
                          <div
                            className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              feedback.status || "pending"
                            )}`}
                          >
                            {getStatusIcon(feedback.status || "pending")}
                            <span className="ml-1 capitalize">
                              {feedback.status || "pending"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>
                            Submitted on{" "}
                            {new Date(
                              feedback.createdAt || feedback.submittedAt
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {feedback.response && (
                            <span className="text-indigo-600 font-medium">
                              Response Available
                            </span>
                          )}
                        </div>
                        {feedback.response && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-700 mb-1">
                              Management Response:
                            </p>
                            <p className="text-sm text-gray-600">
                              {feedback.response}
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

export default Feedback;
