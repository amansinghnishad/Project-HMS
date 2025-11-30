// components/MaintenanceRequest.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FaCamera,
  FaCheckCircle,
  FaTimesCircle,
  FaRedo,
  FaTools,
  FaSpinner,
  FaHistory,
  FaExclamationTriangle,
  FaPaperPlane,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { maintenanceService } from "../../../services/api";

const MaintenanceRequest = () => {
  const [requestType, setRequestType] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Camera related state
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [photoDataUrl, setPhotoDataUrl] = useState(null);
  const [stream, setStream] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const requestTypes = [
    {
      value: "plumbing",
      label: "Plumbing",
      icon: "🚿",
      description: "Water leaks, pipe issues, toilet problems",
    },
    {
      value: "electrical",
      label: "Electrical",
      icon: "💡",
      description: "Power outages, switch issues, light problems",
    },
    {
      value: "furniture",
      label: "Furniture",
      icon: "🪑",
      description: "Bed, desk, chair repairs or replacement",
    },
    {
      value: "cleaning",
      label: "Cleaning",
      icon: "🧹",
      description: "Deep cleaning, pest control, sanitation",
    },
    {
      value: "ac_cooling",
      label: "AC/Cooling",
      icon: "❄️",
      description: "Air conditioning, fan issues, ventilation",
    },
    {
      value: "network",
      label: "Network/IT",
      icon: "📶",
      description: "Internet, WiFi, networking issues",
    },
    {
      value: "security",
      label: "Security",
      icon: "🔒",
      description: "Door locks, windows, safety concerns",
    },
    {
      value: "others",
      label: "Others",
      icon: "🔧",
      description: "Any other maintenance issues",
    },
  ];

  const priorityLevels = [
    {
      value: "low",
      label: "Low",
      color: "text-green-600 bg-green-100",
      description: "Non-urgent, can wait",
    },
    {
      value: "medium",
      label: "Medium",
      color: "text-yellow-600 bg-yellow-100",
      description: "Moderate urgency",
    },
    {
      value: "high",
      label: "High",
      color: "text-red-600 bg-red-100",
      description: "Urgent, needs quick attention",
    },
  ];

  // Fetch existing requests on component mount
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await maintenanceService.fetchUserRequests();
      setRequests(response?.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching requests:", err);
      setError(err?.message || "Failed to fetch maintenance requests.");
      toast.error(err?.message || "Failed to fetch maintenance requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Cleanup camera stream on component unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);
  useEffect(() => {
    if (isCameraOpen && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraOpen, stream]);

  const startCamera = async () => {
    setCameraError(null);
    setPhotoDataUrl(null); // Clear previous photo
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setCameraError(
        "Could not access camera. Please ensure permissions are granted and no other app is using it."
      );
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const videoElement = videoRef.current;
      const canvasElement = canvasRef.current;
      canvasElement.width = videoElement.videoWidth;
      canvasElement.height = videoElement.videoHeight;
      const context = canvasElement.getContext("2d");
      context.drawImage(
        videoElement,
        0,
        0,
        videoElement.videoWidth,
        videoElement.videoHeight
      );
      const dataUrl = canvasElement.toDataURL("image/jpeg");
      setPhotoDataUrl(dataUrl);
      stopCamera();
    }
  };
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSubmissionSuccess(false);

    const toastId = toast.loading("Submitting maintenance request...");

    try {
      const payload = { requestType, description, priority };
      if (photoDataUrl) {
        payload.photo = photoDataUrl;
      }
      const response = await maintenanceService.submitRequest(payload);
      const newRequest = response?.data;
      setRequests((prev) => (newRequest ? [newRequest, ...prev] : prev));

      toast.success(
        response?.message || "Maintenance request submitted successfully!",
        {
          id: toastId,
        }
      );

      // Reset form
      setRequestType("");
      setDescription("");
      setPriority("medium");
      setPhotoDataUrl(null);
      setCameraError(null);
      setSubmissionSuccess(true);

      await fetchRequests();
    } catch (err) {
      setError(err.message || "Failed to submit request. Please try again.");
      toast.error(err.message || "Failed to submit request", { id: toastId });
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
      case "completed":
        return "text-green-600 bg-green-100";
      case "cancelled":
        return "text-red-600 bg-red-100";
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
      case "completed":
        return <FaCheckCircle className="w-3 h-3" />;
      case "cancelled":
        return <FaTimesCircle className="w-3 h-3" />;
      default:
        return <FaExclamationTriangle className="w-3 h-3" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "low":
        return "text-green-600 bg-green-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "high":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };
  return (
    <div className="p-4 sm:p-6 bg-gradient-to-br from-orange-50 to-red-100 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
            <FaTools className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
            Maintenance Request
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Report maintenance issues and track repair progress for your room
            and common areas
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm border">
            <button
              onClick={() => setShowHistory(false)}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                !showHistory
                  ? "bg-orange-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-orange-600"
              }`}
            >
              Submit Request
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                showHistory
                  ? "bg-orange-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-orange-600"
              }`}
            >
              <FaHistory className="inline mr-2" />
              History ({requests.length})
            </button>
          </div>
        </div>

        {!showHistory ? (
          // Maintenance Request Form
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 border border-gray-200">
              {submissionSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <FaCheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    <p className="text-green-800 font-medium">
                      Maintenance request submitted successfully! Our team will
                      address it soon.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Request Type Selection */}
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-4">
                    Type of Maintenance Issue *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {requestTypes.map((type) => (
                      <div
                        key={type.value}
                        className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          requestType === type.value
                            ? "border-orange-500 bg-orange-50"
                            : "border-gray-200 hover:border-orange-300"
                        }`}
                        onClick={() => setRequestType(type.value)}
                      >
                        <div className="text-center">
                          <span className="text-3xl mb-2 block">
                            {type.icon}
                          </span>
                          <h3 className="font-medium text-gray-800 mb-1">
                            {type.label}
                          </h3>
                          <p className="text-xs text-gray-600">
                            {type.description}
                          </p>
                        </div>
                        {requestType === type.value && (
                          <div className="absolute top-2 right-2">
                            <FaCheckCircle className="w-4 h-4 text-orange-600" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Priority Selection */}
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-4">
                    Priority Level *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {priorityLevels.map((level) => (
                      <div
                        key={level.value}
                        className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          priority === level.value
                            ? "border-orange-500 bg-orange-50"
                            : "border-gray-200 hover:border-orange-300"
                        }`}
                        onClick={() => setPriority(level.value)}
                      >
                        <div className="text-center">
                          <div
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-2 ${level.color}`}
                          >
                            {level.label}
                          </div>
                          <p className="text-sm text-gray-600">
                            {level.description}
                          </p>
                        </div>
                        {priority === level.value && (
                          <div className="absolute top-2 right-2">
                            <FaCheckCircle className="w-4 h-4 text-orange-600" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-2">
                    Detailed Description *
                  </label>
                  <div className="relative">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-4 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none resize-y min-h-[120px]"
                      rows="4"
                      placeholder="Please describe the maintenance issue in detail. Include location, symptoms, and any other relevant information..."
                      required
                    ></textarea>
                    {!isCameraOpen && !photoDataUrl && (
                      <button
                        type="button"
                        onClick={startCamera}
                        title="Take Photo"
                        className="absolute top-4 right-4 flex items-center justify-center w-10 h-10 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition duration-300 shadow-md"
                      >
                        <FaCamera size={16} />
                      </button>
                    )}
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    {description.length}/500 characters
                  </div>
                </div>

                {/* Camera and Photo Section */}
                <div className="space-y-4">
                  {isCameraOpen && stream && (
                    <div className="border-2 border-dashed border-orange-300 p-6 rounded-lg bg-orange-50">
                      <h3 className="text-lg font-medium text-gray-800 mb-4 text-center">
                        Take a Photo of the Issue
                      </h3>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full rounded-lg mb-4 max-h-80 object-cover shadow-md"
                      />
                      <div className="flex flex-col sm:flex-row justify-center gap-3">
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="flex items-center justify-center px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-300 shadow-md"
                        >
                          <FaCheckCircle className="mr-2" />
                          Capture Photo
                        </button>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="flex items-center justify-center px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-300 shadow-md"
                        >
                          <FaTimesCircle className="mr-2" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {photoDataUrl && (
                    <div className="border-2 border-dashed border-green-300 p-6 rounded-lg bg-green-50">
                      <h3 className="text-lg font-medium text-gray-800 mb-4 text-center">
                        Photo Captured Successfully
                      </h3>
                      <img
                        src={photoDataUrl}
                        alt="Captured maintenance issue"
                        className="w-full max-w-md mx-auto rounded-lg shadow-md mb-4"
                      />
                      <div className="flex flex-col sm:flex-row justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => setPhotoDataUrl(null)}
                          className="flex items-center justify-center px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-300 shadow-md"
                        >
                          <FaTimesCircle className="mr-2" />
                          Remove Photo
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoDataUrl(null);
                            startCamera();
                          }}
                          className="flex items-center justify-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300 shadow-md"
                        >
                          <FaRedo className="mr-2" />
                          Retake Photo
                        </button>
                      </div>
                    </div>
                  )}

                  {cameraError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                      <div className="flex items-center">
                        <FaExclamationTriangle className="w-5 h-5 mr-3" />
                        {cameraError}
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !requestType || !description.trim()}
                  className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold rounded-lg hover:from-orange-700 hover:to-red-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <FaSpinner className="animate-spin w-5 h-5 mr-3" />
                      Submitting Request...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <FaPaperPlane className="w-5 h-5 mr-3" />
                      Submit Maintenance Request
                    </div>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          // Maintenance History
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <FaHistory className="w-5 h-5 mr-3 text-orange-600" />
                  Maintenance Request History
                </h2>
                <p className="text-gray-600 mt-1">
                  Track the progress of your maintenance requests
                </p>
              </div>

              <div className="p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <FaSpinner className="animate-spin w-8 h-8 text-orange-600" />
                    <span className="ml-3 text-gray-600">
                      Loading maintenance history...
                    </span>
                  </div>
                ) : requests.length === 0 ? (
                  <div className="text-center py-12">
                    <FaTools className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">
                      No Maintenance Requests
                    </h3>
                    <p className="text-gray-500">
                      You haven't submitted any maintenance requests yet.
                    </p>
                    <button
                      onClick={() => setShowHistory(false)}
                      className="mt-4 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      Submit Your First Request
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {requests.map((request) => (
                      <div
                        key={request._id}
                        className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-semibold text-gray-800 capitalize">
                                {request.requestType?.replace("_", " ") ||
                                  "General"}{" "}
                                Request
                              </h3>
                              <div
                                className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                  request.status || "pending"
                                )}`}
                              >
                                {getStatusIcon(request.status || "pending")}
                                <span className="ml-1 capitalize">
                                  {request.status || "pending"}
                                </span>
                              </div>
                            </div>
                            {request.priority && (
                              <div
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mb-2 ${getPriorityColor(
                                  request.priority
                                )}`}
                              >
                                {request.priority} Priority
                              </div>
                            )}
                            <p className="text-sm text-gray-600 line-clamp-3 mb-2">
                              {request.description}
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mb-3">
                          Submitted on{" "}
                          {new Date(request.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </div>
                        {request.photo && (
                          <img
                            src={request.photo}
                            alt="Maintenance issue"
                            className="w-full h-40 object-cover rounded-lg mt-3 shadow-sm"
                          />
                        )}
                        {request.adminComments && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-700 mb-1">
                              Technician Notes:
                            </p>
                            <p className="text-sm text-gray-600">
                              {request.adminComments}
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

        {/* Error Display */}
        {error && (
          <div className="max-w-4xl mx-auto mt-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex items-center">
                <FaExclamationTriangle className="w-5 h-5 mr-3" />
                {error}
              </div>
            </div>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default MaintenanceRequest;
