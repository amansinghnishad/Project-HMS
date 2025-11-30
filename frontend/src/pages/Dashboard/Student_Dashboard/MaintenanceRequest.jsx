import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FaTools,
  FaPaperPlane,
  FaSpinner,
  FaImage,
  FaSync,
} from "react-icons/fa";
import { HiPlusSm } from "react-icons/hi";
import { toast } from "react-hot-toast";
import StudentDashboardLayout from "../../../components/dashboard/layout/StudentDashboardLayout";
import ModalLayout from "../../../components/dashboard/layout/Model.layout";
import { maintenanceService } from "../../../services/api";
import {
  DESCRIPTION_LIMIT,
  PRIORITY_OPTIONS,
  REQUEST_TYPES,
  STATUS_FILTERS,
} from "./config/maintenance.config";

const PRIMARY_BUTTON_CLASS =
  "inline-flex items-center gap-2 self-start rounded-2xl bg-gradient-to-r from-orange-600 to-red-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-orange-700 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const MaintenanceRequest = () => {
  const [requestType, setRequestType] = useState(REQUEST_TYPES[0].value);
  const [priority, setPriority] = useState("medium");
  const [description, setDescription] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [error, setError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fileInputRef = useRef(null);

  const fetchRequests = useCallback(async () => {
    setLoadingRequests(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      if (priorityFilter !== "all") {
        params.priority = priorityFilter;
      }
      if (typeFilter !== "all") {
        params.requestType = typeFilter;
      }
      const response = await maintenanceService.fetchUserRequests(params);
      setRequests(response?.data || []);
    } catch (err) {
      console.error("Unable to load maintenance requests", err);
      const message =
        err?.message ||
        err?.payload?.error ||
        "Unable to load maintenance requests.";
      setError(message);
      toast.error(message);
    } finally {
      setLoadingRequests(false);
    }
  }, [priorityFilter, statusFilter, typeFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const selectedType = useMemo(
    () => REQUEST_TYPES.find((type) => type.value === requestType),
    [requestType]
  );

  const statusSummary = useMemo(() => {
    if (!requests?.length) {
      return {
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        open: 0,
      };
    }

    const summary = requests.reduce(
      (acc, current) => {
        acc.total += 1;
        const normalized = current?.status?.toLowerCase();
        if (normalized === "completed") {
          acc.completed += 1;
        } else if (normalized === "in-progress") {
          acc.inProgress += 1;
        } else {
          acc.pending += 1;
        }
        return acc;
      },
      { total: 0, pending: 0, inProgress: 0, completed: 0, open: 0 }
    );

    summary.open = summary.pending + summary.inProgress;
    return summary;
  }, [requests]);

  const latestActivity = useMemo(() => {
    if (!requests?.length) {
      return null;
    }

    const timestamps = requests
      .map(
        (request) =>
          request?.updatedAt || request?.resolvedAt || request?.createdAt
      )
      .filter(Boolean)
      .map((value) => {
        const time = new Date(value).getTime();
        return Number.isNaN(time) ? null : time;
      })
      .filter((time) => time !== null);

    if (!timestamps.length) {
      return null;
    }

    return new Date(Math.max(...timestamps)).toISOString();
  }, [requests]);

  const hasFilters =
    statusFilter !== "all" || priorityFilter !== "all" || typeFilter !== "all";

  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setPhotoDataUrl(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }

    const MAX_SIZE_BYTES = 3 * 1024 * 1024; // 3MB
    if (file.size > MAX_SIZE_BYTES) {
      toast.error("Please upload an image smaller than 3MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoDataUrl(reader.result?.toString() || null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoDataUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetForm = useCallback(() => {
    setRequestType(REQUEST_TYPES[0].value);
    setPriority("medium");
    setDescription("");
    setPhotoDataUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleOpenForm = useCallback(() => {
    resetForm();
    setIsFormOpen(true);
  }, [resetForm]);

  const handleCloseForm = useCallback(() => {
    resetForm();
    setIsFormOpen(false);
  }, [resetForm]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!description.trim()) {
      toast.error("Please describe the maintenance issue.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Submitting request...");

    try {
      const payload = {
        requestType,
        priority,
        description: description.trim(),
      };

      if (photoDataUrl) {
        payload.photo = photoDataUrl;
      }

      const response = await maintenanceService.submitRequest(payload);
      toast.success(response?.message || "Maintenance request submitted.", {
        id: toastId,
      });

      resetForm();
      await fetchRequests();
      setIsFormOpen(false);
    } catch (err) {
      const message =
        err?.message ||
        err?.payload?.error ||
        "Unable to submit maintenance request.";
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
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
          >
            {STATUS_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span>Priority</span>
          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
          >
            {[{ value: "all", label: "All" }, ...PRIORITY_OPTIONS].map(
              (option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              )
            )}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span>Category</span>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
          >
            {[{ value: "all", label: "All" }, ...REQUEST_TYPES].map(
              (option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              )
            )}
          </select>
        </label>
        <button
          type="button"
          onClick={() => {
            setStatusFilter("all");
            setPriorityFilter("all");
            setTypeFilter("all");
          }}
          disabled={!hasFilters}
          className="inline-flex items-center rounded-xl border border-gray-200 px-3 py-2 font-semibold text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Clear filters
        </button>
        <button
          type="button"
          onClick={fetchRequests}
          disabled={loadingRequests}
          className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-white px-3 py-2 font-semibold text-orange-600 transition hover:border-orange-300 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FaSync className={loadingRequests ? "animate-spin" : ""} />
          Refresh
        </button>
      </>
    ),
    [
      fetchRequests,
      hasFilters,
      loadingRequests,
      priorityFilter,
      statusFilter,
      typeFilter,
    ]
  );

  const primaryAction = useMemo(
    () => ({
      label: "Create request",
      icon: <HiPlusSm size={18} />,
      onClick: handleOpenForm,
      className: PRIMARY_BUTTON_CLASS,
    }),
    [handleOpenForm]
  );

  const emptyState = useMemo(
    () => ({
      title: "No maintenance requests",
      description: "Use the Create request button to report an issue.",
      action: (
        <button
          type="button"
          onClick={handleOpenForm}
          className={PRIMARY_BUTTON_CLASS}
        >
          <HiPlusSm size={18} />
          <span>Create request</span>
        </button>
      ),
    }),
    [handleOpenForm]
  );

  const requestListContent = useMemo(
    () => (
      <ul className="space-y-4">
        {requests.map((request, index) => {
          const key =
            request?._id ||
            `${request.requestType}-${request.createdAt}-${index}`;
          return (
            <li
              key={key}
              className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 transition hover:border-orange-200 hover:shadow-md"
            >
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatTypeLabel(request?.requestType)}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      {request?.description}
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
                    Priority:
                    <span
                      className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 ${getPriorityTone(
                        request?.priority
                      )}`}
                    >
                      {formatPriorityLabel(request?.priority)}
                    </span>
                  </span>
                  <span>Submitted: {formatDateTime(request?.createdAt)}</span>
                  {request?.updatedAt ? (
                    <span>Updated: {formatDateTime(request.updatedAt)}</span>
                  ) : null}
                  {request?.resolvedAt ? (
                    <span>Resolved: {formatDateTime(request.resolvedAt)}</span>
                  ) : null}
                </div>

                {request?.resolution ? (
                  <div className="rounded-2xl bg-white/70 p-3 text-sm text-gray-600">
                    <span className="font-semibold text-gray-700">
                      Resolution note:
                    </span>
                    {request.resolution}
                  </div>
                ) : null}

                {request?.photo ? (
                  <img
                    src={request.photo}
                    alt="Reported maintenance issue"
                    className="h-40 w-full rounded-2xl object-cover"
                  />
                ) : null}

                {request?.completionPhoto ? (
                  <img
                    src={request.completionPhoto}
                    alt="Completed maintenance work"
                    className="h-40 w-full rounded-2xl object-cover"
                  />
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    ),
    [requests]
  );

  return (
    <>
      <StudentDashboardLayout
        backgroundClass="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6"
        headerIcon={FaTools}
        headerIconClassName="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600"
        title="Maintenance requests"
        description="Track issues around your hostel and submit new ones in seconds."
        primaryAction={primaryAction}
        sectionTitle="Request history"
        sectionDescription="Monitor the status of everything you have reported."
        filters={filtersNode}
        isLoading={loadingRequests}
        loadingText="Loading your requests…"
        errorMessage={error}
        hasContent={requests.length > 0}
        emptyState={requests.length > 0 ? null : emptyState}
      >
        {requestListContent}
      </StudentDashboardLayout>

      <ModalLayout
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        icon={FaTools}
        iconBackgroundClassName="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600"
        title="Submit maintenance request"
        description="Provide details so the maintenance team can assist quickly."
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-gray-700">
              Maintenance category *
              <select
                value={requestType}
                onChange={(event) => setRequestType(event.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                required
              >
                {REQUEST_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <span className="mt-2 block text-xs text-gray-500">
                {selectedType?.helper}
              </span>
            </label>

            <label className="block text-sm font-medium text-gray-700">
              Priority *
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                required
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-sm font-medium text-gray-700">
            Describe the issue *
            <textarea
              value={description}
              onChange={(event) => {
                const nextValue = event.target.value.slice(
                  0,
                  DESCRIPTION_LIMIT
                );
                setDescription(nextValue);
              }}
              rows={5}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
              placeholder="Include location, what happened, and any other details that will help the maintenance team."
              required
            />
            <span className="mt-1 block text-xs text-gray-500">
              {description.length}/{DESCRIPTION_LIMIT} characters
            </span>
          </label>

          <div>
            <span className="text-sm font-medium text-gray-700">
              Reference photo (optional)
            </span>
            <div className="mt-2 rounded-2xl border border-dashed border-orange-200 bg-orange-50/40 p-4">
              {photoDataUrl ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <img
                    src={photoDataUrl}
                    alt="Uploaded maintenance reference"
                    className="h-32 w-full rounded-2xl object-cover sm:h-36 sm:w-48"
                  />
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center justify-center rounded-xl border border-orange-200 px-4 py-2 text-sm font-semibold text-orange-600 transition hover:border-orange-300 hover:bg-orange-100"
                    >
                      Change photo
                    </button>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="inline-flex items-center justify-center rounded-xl border border-transparent bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-transparent bg-white/70 px-4 py-6 text-sm font-semibold text-orange-600 transition hover:bg-white"
                >
                  <FaImage className="text-lg" />
                  Upload a reference photo (optional)
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Supported formats: JPG, PNG. Maximum size 3MB.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleCloseForm}
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
                  Submitting request…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <FaPaperPlane />
                  Submit maintenance request
                </span>
              )}
            </button>
          </div>
        </form>
      </ModalLayout>
    </>
  );
};

const formatTypeLabel = (value) => {
  const match = REQUEST_TYPES.find((type) => type.value === value);
  return match?.label || toTitleCase(value);
};

const formatPriorityLabel = (value) => {
  const match = PRIORITY_OPTIONS.find((option) => option.value === value);
  return match?.label || toTitleCase(value);
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
    case "completed":
      return "bg-emerald-100 text-emerald-700";
    case "in-progress":
      return "bg-indigo-100 text-indigo-700";
    default:
      return "bg-amber-100 text-amber-700";
  }
};

const getPriorityTone = (value) => {
  const normalized = value?.toLowerCase();
  switch (normalized) {
    case "high":
      return "bg-rose-100 text-rose-700";
    case "low":
      return "bg-emerald-100 text-emerald-700";
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

export default MaintenanceRequest;
