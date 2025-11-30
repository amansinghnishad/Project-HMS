import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FaCommentDots, FaPaperPlane, FaSpinner } from "react-icons/fa";
import { HiPlusSm } from "react-icons/hi";
import { toast } from "react-hot-toast";
import StudentDashboardLayout from "../../../components/dashboard/layout/StudentDashboardLayout";
import ModalLayout from "../../../components/dashboard/layout/Model.layout";
import { feedbackService } from "../../../services/api";
import {
  FEEDBACK_TYPES,
  MESSAGE_LIMIT,
  STATUS_FILTERS,
} from "./config/feedback.config";

const PRIMARY_BUTTON_CLASS =
  "inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const Feedback = () => {
  const [formData, setFormData] = useState({
    feedbackType: FEEDBACK_TYPES[0].value,
    customSubject: "",
    message: "",
  });
  const [feedbackEntries, setFeedbackEntries] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFeedback = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params =
        statusFilter === "all" ? undefined : { status: statusFilter };
      const response = await feedbackService.fetchUserFeedback(params);
      setFeedbackEntries(response?.data || []);
    } catch (err) {
      console.error("Unable to load feedback entries", err);
      const message =
        err?.message ||
        err?.payload?.error ||
        "Unable to load feedback entries.";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const selectedType = useMemo(
    () => FEEDBACK_TYPES.find((type) => type.value === formData.feedbackType),
    [formData.feedbackType]
  );

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = useCallback(() => {
    setFormData({
      feedbackType: FEEDBACK_TYPES[0].value,
      customSubject: "",
      message: "",
    });
  }, []);

  const handleOpenModal = useCallback(() => {
    resetForm();
    setIsModalOpen(true);
  }, [resetForm]);

  const handleCloseModal = useCallback(() => {
    resetForm();
    setIsModalOpen(false);
  }, [resetForm]);

  const validateForm = () => {
    if (!formData.feedbackType) {
      return "Please choose a feedback category.";
    }

    if (formData.feedbackType === "Other" && !formData.customSubject.trim()) {
      return "Please provide a subject for this feedback.";
    }

    if (!formData.message.trim()) {
      return "Let us know what happened so we can act.";
    }

    if (formData.message.length > MESSAGE_LIMIT) {
      return `Feedback must be ${MESSAGE_LIMIT} characters or fewer.`;
    }

    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Sharing your feedback...");

    try {
      const payload = {
        feedbackType: formData.feedbackType,
        message: formData.message.trim(),
      };

      if (formData.feedbackType === "Other") {
        payload.customSubject = formData.customSubject.trim();
      }

      const response = await feedbackService.submitFeedback(payload);
      toast.success(response?.message || "Feedback submitted.", {
        id: toastId,
      });

      resetForm();
      setIsModalOpen(false);
      await fetchFeedback();
    } catch (err) {
      const message =
        err?.payload?.error || err?.message || "Unable to submit feedback.";
      toast.error(message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtersNode = useMemo(
    () => (
      <label className="flex items-center gap-2 text-sm text-gray-600">
        <span>Status</span>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        >
          {STATUS_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    ),
    [statusFilter]
  );

  const primaryAction = useMemo(
    () => ({
      label: "Submit feedback",
      icon: <HiPlusSm size={18} />,
      onClick: handleOpenModal,
      className: PRIMARY_BUTTON_CLASS,
    }),
    [handleOpenModal]
  );

  const emptyState = useMemo(
    () => ({
      title: "No feedback yet",
      description: "Use the Submit feedback button to share your first note.",
      action: (
        <button
          type="button"
          onClick={handleOpenModal}
          className={PRIMARY_BUTTON_CLASS}
        >
          <HiPlusSm size={18} />
          <span>Submit feedback</span>
        </button>
      ),
    }),
    [handleOpenModal]
  );

  const feedbackListContent = useMemo(
    () => (
      <ul className="space-y-4">
        {feedbackEntries.map((entry, index) => (
          <li
            key={
              entry?._id || `${entry.feedbackType}-${entry.createdAt}-${index}`
            }
            className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 transition hover:border-indigo-200 hover:shadow-md"
          >
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {entry?.subject || formatFeedbackTitle(entry)}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">{entry?.message}</p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusTone(
                    entry?.status
                  )}`}
                >
                  {formatStatusLabel(entry?.status)}
                </span>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                <span>
                  Submitted:{" "}
                  {formatDateTime(entry?.createdAt || entry?.submittedAt)}
                </span>
                {entry?.resolvedAt ? (
                  <span>Resolved: {formatDateTime(entry.resolvedAt)}</span>
                ) : null}
              </div>

              {entry?.response ? (
                <div className="rounded-2xl bg-white/70 p-3 text-sm text-gray-600">
                  <span className="font-semibold text-gray-700">
                    Response from team:
                  </span>
                  {entry.response}
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    ),
    [feedbackEntries]
  );

  return (
    <>
      <StudentDashboardLayout
        backgroundClass="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-6"
        headerIcon={FaCommentDots}
        headerIconClassName="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600"
        title="Share feedback"
        description="Let the hostel team know what is working well and what needs attention."
        primaryAction={primaryAction}
        sectionTitle="Previous feedback"
        sectionDescription="Use status filters to focus on what matters right now."
        filters={filtersNode}
        isLoading={isLoading}
        loadingText="Loading your feedback…"
        errorMessage={error}
        hasContent={feedbackEntries.length > 0}
        emptyState={feedbackEntries.length > 0 ? null : emptyState}
      >
        {feedbackListContent}
      </StudentDashboardLayout>

      <ModalLayout
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        icon={FaCommentDots}
        title="Submit feedback"
        description="Your comments go directly to the hostel management team."
        iconBackgroundClassName="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block text-sm font-medium text-gray-700">
            Feedback category *
            <select
              value={formData.feedbackType}
              onChange={(event) => {
                const nextType = event.target.value;
                handleInputChange("feedbackType", nextType);
                if (nextType !== "Other") {
                  handleInputChange("customSubject", "");
                }
              }}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              required
            >
              {FEEDBACK_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <span className="mt-2 block text-xs text-gray-500">
              {selectedType?.helper}
            </span>
          </label>

          {formData.feedbackType === "Other" ? (
            <label className="block text-sm font-medium text-gray-700">
              Subject *
              <input
                type="text"
                value={formData.customSubject}
                onChange={(event) =>
                  handleInputChange(
                    "customSubject",
                    event.target.value.slice(0, 120)
                  )
                }
                placeholder="Give this feedback a clear title"
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                required
              />
            </label>
          ) : null}

          <label className="block text-sm font-medium text-gray-700">
            Feedback details *
            <textarea
              value={formData.message}
              onChange={(event) =>
                handleInputChange(
                  "message",
                  event.target.value.slice(0, MESSAGE_LIMIT)
                )
              }
              rows={6}
              placeholder="Share the context, impact, and any suggestions you have."
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              required
            />
            <span className="mt-1 block text-xs text-gray-500">
              {formData.message.length}/{MESSAGE_LIMIT} characters
            </span>
          </label>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleCloseModal}
              className="rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={PRIMARY_BUTTON_CLASS}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <FaSpinner className="animate-spin" />
                  Sending…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <FaPaperPlane />
                  Submit feedback
                </span>
              )}
            </button>
          </div>
        </form>
      </ModalLayout>
    </>
  );
};

const formatFeedbackTitle = (entry) => {
  if (!entry) {
    return "Feedback";
  }
  if (entry.feedbackType === "Other" && entry.customSubject) {
    return entry.customSubject;
  }
  return entry.feedbackType || "Feedback";
};

const formatStatusLabel = (value) => {
  if (!value) {
    return "Pending";
  }
  return toTitleCase(value);
};

const formatDateTime = (value) => {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString();
};

const getStatusTone = (value) => {
  const normalized = value?.toLowerCase();
  switch (normalized) {
    case "resolved":
      return "bg-emerald-100 text-emerald-700";
    case "in-progress":
      return "bg-indigo-100 text-indigo-700";
    case "closed":
      return "bg-gray-100 text-gray-600";
    default:
      return "bg-amber-100 text-amber-700";
  }
};

const toTitleCase = (value) => {
  if (!value) {
    return "";
  }
  return value
    .toString()
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

export default Feedback;
