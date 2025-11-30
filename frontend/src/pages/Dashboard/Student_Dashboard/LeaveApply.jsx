import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FaCalendarAlt, FaPaperPlane, FaSpinner } from "react-icons/fa";
import { HiPlusSm } from "react-icons/hi";
import { toast } from "react-hot-toast";
import StudentDashboardLayout from "../../../components/dashboard/layout/StudentDashboardLayout";
import ModalLayout from "../../../components/dashboard/layout/Model.layout";
import { leaveService } from "../../../services/api";
import {
  DESCRIPTION_LIMIT,
  LEAVE_TYPES,
  STATUS_FILTERS,
} from "./config/leave.config";

const PRIMARY_BUTTON_CLASS =
  "inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-emerald-700 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const LeaveApply = () => {
  const [formData, setFormData] = useState({
    leaveType: LEAVE_TYPES[0].value,
    startDate: "",
    endDate: "",
    emergencyContact: "",
    reason: "",
  });
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaveHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      if (typeFilter !== "all") {
        params.leaveType = typeFilter;
      }

      const response = await leaveService.fetchUserLeaveRequests(params);
      setLeaveRequests(response?.data || []);
    } catch (err) {
      console.error("Unable to load leave requests", err);
      const message =
        err?.message || err?.payload?.error || "Unable to load leave requests.";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    fetchLeaveHistory();
  }, [fetchLeaveHistory]);

  const todayIso = useMemo(() => new Date().toISOString().split("T")[0], []);
  const selectedType = useMemo(
    () => LEAVE_TYPES.find((type) => type.value === formData.leaveType),
    [formData.leaveType]
  );

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = useCallback(() => {
    setFormData({
      leaveType: LEAVE_TYPES[0].value,
      startDate: "",
      endDate: "",
      emergencyContact: "",
      reason: "",
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
    if (
      !formData.startDate ||
      !formData.endDate ||
      !formData.emergencyContact ||
      !formData.reason
    ) {
      return "All fields are required.";
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return "Please choose valid start and end dates.";
    }

    if (start < today) {
      return "Start date cannot be in the past.";
    }

    if (end <= start) {
      return "End date must be after the start date.";
    }

    if (formData.reason.trim().length === 0) {
      return "Please describe why you need leave.";
    }

    if (formData.reason.length > DESCRIPTION_LIMIT) {
      return `Reason must be ${DESCRIPTION_LIMIT} characters or fewer.`;
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
    const toastId = toast.loading("Submitting leave application...");

    try {
      const payload = {
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        emergencyContact: formData.emergencyContact.trim(),
        reason: formData.reason.trim(),
      };

      const response = await leaveService.submitLeaveRequest(payload);
      toast.success(response?.message || "Leave request submitted.", {
        id: toastId,
      });

      resetForm();
      setIsModalOpen(false);
      await fetchLeaveHistory();
    } catch (err) {
      const message =
        err?.payload?.error ||
        err?.message ||
        "Unable to submit leave application.";
      toast.error(message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtersNode = useMemo(
    () => (
      <>
        <label className="flex items-center gap-2">
          <span>Status</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            {STATUS_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span>Type</span>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            {[{ value: "all", label: "All" }, ...LEAVE_TYPES].map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </>
    ),
    [statusFilter, typeFilter]
  );

  const primaryAction = useMemo(
    () => ({
      label: "Apply for leave",
      icon: <HiPlusSm size={18} />,
      onClick: handleOpenModal,
      className: PRIMARY_BUTTON_CLASS,
    }),
    [handleOpenModal]
  );

  const emptyState = useMemo(
    () => ({
      title: "No leave applications yet",
      description:
        "Use the Apply for leave button to submit your first request.",
      action: (
        <button
          type="button"
          onClick={handleOpenModal}
          className={PRIMARY_BUTTON_CLASS}
        >
          <HiPlusSm size={18} />
          <span>Apply for leave</span>
        </button>
      ),
    }),
    [handleOpenModal]
  );

  const leaveHistoryContent = useMemo(
    () => (
      <ul className="space-y-4">
        {leaveRequests.map((request, index) => (
          <li
            key={
              request?._id ||
              `${request.leaveType}-${request.createdAt}-${index}`
            }
            className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 transition hover:border-emerald-200 hover:shadow-md"
          >
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatLeaveType(request?.leaveType)} leave
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {formatDateRange(
                      request?.fromDate || request?.startDate,
                      request?.toDate || request?.endDate
                    )}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {request?.reason}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusTone(
                    request?.status
                  )}`}
                >
                  {formatStatusLabel(request?.status)}
                </span>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                <span>
                  Emergency contact: {request?.emergencyContact || "—"}
                </span>
                <span>
                  Applied:{" "}
                  {formatDateTime(request?.createdAt || request?.submittedAt)}
                </span>
                {request?.resolvedAt ? (
                  <span>Resolved: {formatDateTime(request.resolvedAt)}</span>
                ) : null}
              </div>

              {request?.provostComments || request?.adminComments ? (
                <div className="rounded-2xl bg-white/70 p-3 text-sm text-gray-600">
                  <span className="font-semibold text-gray-700">
                    Provost note:{" "}
                  </span>
                  {request.provostComments || request.adminComments}
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    ),
    [leaveRequests]
  );

  return (
    <>
      <StudentDashboardLayout
        headerIcon={FaCalendarAlt}
        title="Leave applications"
        description="Submit a new request or review decisions from your provost."
        primaryAction={primaryAction}
        sectionTitle="Leave history"
        sectionDescription="Filters apply instantly."
        filters={filtersNode}
        isLoading={isLoading}
        loadingText="Loading your leave requests…"
        errorMessage={error}
        hasContent={leaveRequests.length > 0}
        emptyState={leaveRequests.length > 0 ? null : emptyState}
      >
        {leaveHistoryContent}
      </StudentDashboardLayout>

      <ModalLayout
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        icon={FaCalendarAlt}
        title="Apply for leave"
        description="Complete the form to submit your request."
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block text-sm font-medium text-gray-700">
            Leave type *
            <select
              name="leaveType"
              value={formData.leaveType}
              onChange={handleInputChange}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              required
            >
              {LEAVE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <span className="mt-2 block text-xs text-gray-500">
              {selectedType?.helper}
            </span>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-gray-700">
              Start date *
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                min={todayIso}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                required
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              End date *
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                min={formData.startDate || todayIso}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                required
              />
            </label>
          </div>

          <label className="block text-sm font-medium text-gray-700">
            Emergency contact *
            <input
              type="tel"
              name="emergencyContact"
              value={formData.emergencyContact}
              onChange={handleInputChange}
              placeholder="Include country code if applicable"
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              required
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Reason for leave *
            <textarea
              name="reason"
              value={formData.reason}
              onChange={(event) => {
                const nextValue = event.target.value.slice(
                  0,
                  DESCRIPTION_LIMIT
                );
                setFormData((prev) => ({ ...prev, reason: nextValue }));
              }}
              rows={5}
              placeholder="Provide context so the provost can approve quickly."
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              required
            />
            <span className="mt-1 block text-xs text-gray-500">
              {formData.reason.length}/{DESCRIPTION_LIMIT} characters
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
              className="rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-emerald-700 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <FaSpinner className="animate-spin" />
                  Submitting…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <FaPaperPlane />
                  Submit leave request
                </span>
              )}
            </button>
          </div>
        </form>
      </ModalLayout>
    </>
  );
};

const formatLeaveType = (value) => {
  const match = LEAVE_TYPES.find((type) => type.value === value);
  return match?.label || toTitleCase(value);
};

const formatStatusLabel = (value) => {
  if (!value) {
    return "Pending";
  }
  return toTitleCase(value);
};

const formatDateRange = (start, end) => {
  if (!start || !end) {
    return "Dates unavailable";
  }
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "Dates unavailable";
  }
  const duration = Math.max(
    1,
    Math.round((endDate - startDate) / (1000 * 60 * 60 * 24))
  );
  return `${startDate.toLocaleDateString()} – ${endDate.toLocaleDateString()} • ${
    duration + 1
  } days`;
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
    case "approved":
      return "bg-emerald-100 text-emerald-700";
    case "rejected":
      return "bg-rose-100 text-rose-700";
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

export default LeaveApply;
