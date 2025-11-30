import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FaCreditCard, FaSpinner, FaSync } from "react-icons/fa";
import { HiPlusSm } from "react-icons/hi";
import { toast } from "react-hot-toast";
import StudentDashboardLayout from "../../../components/dashboard/layout/StudentDashboardLayout";
import ModalLayout from "../../../components/dashboard/layout/Model.layout";
import { paymentService } from "../../../services/api";
import {
  FEE_SELECTION_OPTIONS,
  PAYMENT_PRIMARY_BUTTON_CLASS,
  PAYMENT_STATUS_OPTIONS,
  PAYMENT_TYPE_OPTIONS,
  SEMESTER_OPTIONS,
} from "./config/payment.config";

const FeesPayment = () => {
  const [selectedSemester, setSelectedSemester] = useState("odd");
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingHostelPay, setLoadingHostelPay] = useState(false);
  const [loadingMessPay, setLoadingMessPay] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedFeeType, setSelectedFeeType] = useState("hostel");
  const [historyError, setHistoryError] = useState(null);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const loadRazorpayScript = useCallback(() => {
    if (typeof window === "undefined") {
      return Promise.resolve(false);
    }

    if (window.Razorpay) {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  const fetchPaymentHistory = useCallback(async () => {
    if (!token) {
      setPaymentHistory([]);
      setHistoryError(null);
      return;
    }

    setLoadingHistory(true);
    setHistoryError(null);
    try {
      const params = {};
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      const response = await paymentService.fetchMyPaymentHistory(params);
      if (response?.success) {
        setPaymentHistory(response.data || []);
        setHistoryError(null);
      } else {
        setPaymentHistory([]);
        const message = response?.message || "Unable to load payment history.";
        setHistoryError(message);
        toast.error(message);
      }
    } catch (error) {
      console.error("fetchPaymentHistory error:", error);
      setPaymentHistory([]);
      const message = error?.message || "Error fetching payment history.";
      setHistoryError(message);
      toast.error(message);
    } finally {
      setLoadingHistory(false);
    }
  }, [statusFilter, token]);

  useEffect(() => {
    fetchPaymentHistory();
  }, [fetchPaymentHistory]);

  const filteredHistory = useMemo(() => {
    if (typeFilter === "all") {
      return paymentHistory;
    }
    return paymentHistory.filter(
      (payment) => payment?.paymentFor?.toLowerCase() === typeFilter
    );
  }, [paymentHistory, typeFilter]);

  const lastCapturedAt = useMemo(() => {
    if (!paymentHistory?.length) {
      return null;
    }

    let latest = null;
    paymentHistory.forEach((payment) => {
      if (payment?.status?.toLowerCase() === "captured") {
        const updatedAt =
          payment?.transactionDate || payment?.updatedAt || payment?.createdAt;
        const timestamp = updatedAt ? new Date(updatedAt).getTime() : null;
        if (timestamp && (!latest || timestamp > latest)) {
          latest = timestamp;
        }
      }
    });

    return latest;
  }, [paymentHistory]);

  const ensureRazorpayReady = useCallback(async () => {
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      toast.error(
        "Unable to load Razorpay. Check your connection and try again."
      );
      return false;
    }
    return true;
  }, [loadRazorpayScript]);

  const handlePayment = useCallback(
    async (feeType, semester = null) => {
      if (!token) {
        toast.error("Please log in to continue.");
        return false;
      }

      const razorpayReady = await ensureRazorpayReady();
      if (!razorpayReady) {
        return false;
      }

      let setLoadingFn = setLoadingHostelPay;
      if (feeType === "mess") {
        setLoadingFn = setLoadingMessPay;
        if (!semester) {
          toast.error("Select a semester for mess fee payments.");
          return false;
        }
      }

      setLoadingFn(true);
      let paymentLaunched = false;
      try {
        const orderResponse =
          feeType === "hostel"
            ? await paymentService.createHostelFeeOrder()
            : await paymentService.createMessFeeOrder({ semester });

        if (!orderResponse?.success) {
          toast.error(
            orderResponse?.message || "Failed to create payment order."
          );
          return false;
        }

        const {
          orderId,
          amount,
          currency,
          key,
          studentName,
          studentEmail,
          paymentRecordId,
          notes = {},
        } = orderResponse;

        const options = {
          key,
          amount,
          currency,
          name: "HMS Payments",
          description:
            feeType === "hostel"
              ? "Hostel fee payment"
              : `Mess fee (${formatSemesterLabel(semester)})`,
          order_id: orderId,
          handler: async (response) => {
            const verificationData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentRecordId,
            };

            try {
              const verificationResult = await paymentService.verifyPayment(
                verificationData
              );
              if (verificationResult?.success) {
                toast.success(
                  verificationResult?.message || "Payment successful."
                );
                fetchPaymentHistory();
              } else {
                toast.error(
                  verificationResult?.message || "Payment verification failed."
                );
              }
            } catch (error) {
              console.error("Payment verification error:", error);
              toast.error(
                "Unable to verify payment. Contact support if the amount was deducted."
              );
            }
          },
          prefill: {
            name: studentName || "Student Name",
            email: studentEmail || "student@example.com",
          },
          notes: {
            ...notes,
            feeType,
            semester: semester || "N/A",
          },
          theme: {
            color: feeType === "hostel" ? "#f97316" : "#16a34a",
          },
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.on("payment.failed", (response) => {
          toast.error(
            response?.error?.description || "Payment failed. Please try again."
          );
          console.error("Razorpay payment failed:", response?.error);
        });
        paymentLaunched = true;
        paymentObject.open();
        return paymentLaunched;
      } catch (error) {
        console.error("handlePayment error:", error);
        toast.error("Unable to initiate payment. Please try again later.");
        paymentLaunched = false;
      } finally {
        setLoadingFn(false);
      }
      return paymentLaunched;
    },
    [ensureRazorpayReady, fetchPaymentHistory, token]
  );

  const hasFilters = statusFilter !== "all" || typeFilter !== "all";

  const isProcessingPayment = useMemo(
    () => (selectedFeeType === "hostel" ? loadingHostelPay : loadingMessPay),
    [loadingHostelPay, loadingMessPay, selectedFeeType]
  );

  const openPaymentModal = useCallback(() => {
    if (!token) {
      toast.error("Please log in to continue.");
      return;
    }
    setSelectedFeeType("hostel");
    setSelectedSemester("odd");
    setIsPaymentModalOpen(true);
  }, [token]);

  const closePaymentModal = useCallback(() => {
    if (isProcessingPayment) {
      return;
    }
    setIsPaymentModalOpen(false);
  }, [isProcessingPayment]);

  const startPayment = useCallback(async () => {
    const semester = selectedFeeType === "mess" ? selectedSemester : null;
    const launched = await handlePayment(selectedFeeType, semester);
    if (launched) {
      setIsPaymentModalOpen(false);
    }
  }, [handlePayment, selectedFeeType, selectedSemester]);

  const headerMeta = useMemo(() => {
    if (loadingHistory) {
      return null;
    }

    if (!paymentHistory.length) {
      return "No payments recorded yet.";
    }

    if (!lastCapturedAt) {
      return "No successful payments captured yet.";
    }

    return `Last successful payment on ${formatDateTime(lastCapturedAt)}`;
  }, [lastCapturedAt, loadingHistory, paymentHistory.length]);

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
            {PAYMENT_STATUS_OPTIONS.map((option) => (
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
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
          >
            {PAYMENT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => {
            setStatusFilter("all");
            setTypeFilter("all");
          }}
          disabled={!hasFilters}
          className="inline-flex items-center rounded-xl border border-gray-200 px-3 py-2 font-semibold text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Clear filters
        </button>
        <button
          type="button"
          onClick={fetchPaymentHistory}
          disabled={loadingHistory}
          className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-white px-3 py-2 font-semibold text-orange-600 transition hover:border-orange-300 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FaSync className={loadingHistory ? "animate-spin" : ""} />
          Refresh
        </button>
      </>
    ),
    [fetchPaymentHistory, hasFilters, loadingHistory, statusFilter, typeFilter]
  );

  const primaryAction = useMemo(
    () => ({
      label: "Start a payment",
      icon: <HiPlusSm size={18} />,
      onClick: openPaymentModal,
      disabled: isProcessingPayment,
      className: PAYMENT_PRIMARY_BUTTON_CLASS,
    }),
    [isProcessingPayment, openPaymentModal]
  );

  const emptyState = useMemo(() => {
    if (historyError) {
      return null;
    }

    return {
      title: hasFilters ? "No payments match your filters" : "No payments yet",
      description: hasFilters
        ? "Try another status or type to find the transaction you need."
        : "Start a payment to see it appear here once it is processed.",
      action: (
        <button
          type="button"
          onClick={openPaymentModal}
          className={PAYMENT_PRIMARY_BUTTON_CLASS}
        >
          <HiPlusSm size={18} />
          <span>Start a payment</span>
        </button>
      ),
    };
  }, [hasFilters, historyError, openPaymentModal]);

  const loadingNode = (
    <div className="flex items-center justify-center py-12 text-sm text-gray-600">
      <FaSpinner className="mr-2 animate-spin" /> Loading your payments…
    </div>
  );

  const historyContent = useMemo(
    () => (
      <div className="overflow-x-auto">
        <div className="hidden md:block">
          <table className="w-full border-collapse rounded-2xl">
            <thead>
              <tr className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Fee type</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Payment id</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((payment) => (
                <tr
                  key={payment?._id || payment?.razorpayOrderId}
                  className="border-b border-gray-100 text-sm text-gray-600 last:border-none hover:bg-orange-50/40"
                >
                  <td className="px-4 py-3">
                    {formatDateTime(payment?.createdAt || payment?.date)}
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {formatPaymentType(payment?.paymentFor)}
                    {payment?.semester && payment?.semester !== "full_year"
                      ? ` (${formatSemesterLabel(payment.semester)})`
                      : ""}
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {formatCurrency(payment?.amount, payment?.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusTone(
                        payment?.status
                      )}`}
                    >
                      {formatStatusLabel(payment?.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {payment?.razorpayPaymentId || payment?.paymentId || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-4 md:hidden">
          {filteredHistory.map((payment) => (
            <article
              key={payment?._id || payment?.razorpayOrderId}
              className="rounded-2xl border border-gray-100 bg-orange-50/30 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatPaymentType(payment?.paymentFor)}
                    {payment?.semester && payment?.semester !== "full_year"
                      ? ` (${formatSemesterLabel(payment.semester)})`
                      : ""}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {formatDateTime(payment?.createdAt || payment?.date)}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${getStatusTone(
                    payment?.status
                  )}`}
                >
                  {formatStatusLabel(payment?.status)}
                </span>
              </div>
              <div className="mt-4 space-y-1 text-xs text-gray-600">
                <p>
                  <span className="font-semibold text-gray-700">Amount:</span>{" "}
                  {formatCurrency(payment?.amount, payment?.currency)}
                </p>
                <p>
                  <span className="font-semibold text-gray-700">
                    Payment id:
                  </span>{" "}
                  {payment?.razorpayPaymentId || payment?.paymentId || "—"}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    ),
    [filteredHistory]
  );

  return (
    <>
      <StudentDashboardLayout
        backgroundClass="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-orange-50 p-6"
        headerIcon={FaCreditCard}
        headerIconClassName="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600"
        title="Fees & payments"
        description="Pay hostel and mess fees securely, then track every transaction in one place."
        meta={headerMeta}
        primaryAction={primaryAction}
        sectionTitle="Payment history"
        sectionDescription="Filters apply instantly. Status filtering is backed by the server."
        filters={filtersNode}
        isLoading={loadingHistory}
        loadingNode={loadingNode}
        errorMessage={historyError}
        hasContent={filteredHistory.length > 0}
        emptyState={emptyState}
      >
        {historyContent}
      </StudentDashboardLayout>

      <ModalLayout
        isOpen={isPaymentModalOpen}
        onClose={closePaymentModal}
        icon={FaCreditCard}
        iconBackgroundClassName="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600"
        title="Start a payment"
        description="Choose what you want to pay for, then continue to Razorpay checkout."
        footer={
          <div className="space-y-3">
            <button
              type="button"
              onClick={startPayment}
              disabled={
                isProcessingPayment ||
                (selectedFeeType === "mess" && !selectedSemester)
              }
              className={`${PAYMENT_PRIMARY_BUTTON_CLASS} w-full justify-center`}
            >
              {isProcessingPayment ? (
                <span className="flex items-center gap-2">
                  <FaSpinner className="animate-spin" /> Preparing Razorpay…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <HiPlusSm /> Proceed to payment
                </span>
              )}
            </button>
            <p className="text-xs text-gray-500">
              You will be redirected to Razorpay for secure checkout. Once
              payment completes we refresh your history automatically.
            </p>
          </div>
        }
      >
        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium text-gray-700">Fee type *</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {FEE_SELECTION_OPTIONS.map((option) => {
                const isActive = selectedFeeType === option.value;
                return (
                  <label
                    key={option.value}
                    className={`relative flex cursor-pointer flex-col gap-1 rounded-2xl border px-4 py-3 text-sm transition ${
                      isActive
                        ? "border-orange-400 bg-orange-50 text-orange-700"
                        : "border-gray-200 bg-white text-gray-700 hover:border-orange-200 hover:bg-orange-50/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name="feeType"
                      value={option.value}
                      checked={isActive}
                      onChange={() => setSelectedFeeType(option.value)}
                      className="sr-only"
                      disabled={isProcessingPayment}
                    />
                    <span className="font-semibold">{option.title}</span>
                    <span className="text-xs text-gray-500">
                      {option.helper}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {selectedFeeType === "mess" ? (
            <label className="block text-sm font-medium text-gray-700">
              Semester *
              <select
                value={selectedSemester}
                onChange={(event) => setSelectedSemester(event.target.value)}
                disabled={isProcessingPayment}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 disabled:cursor-not-allowed"
              >
                {SEMESTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </ModalLayout>
    </>
  );
};

const formatCurrency = (amount, currency = "INR") => {
  const numericAmount = Number(amount) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(numericAmount);
};

const formatPaymentType = (type) => {
  if (!type) {
    return "Unknown";
  }
  return type === "mess" ? "Mess" : type === "hostel" ? "Hostel" : type;
};

const formatSemesterLabel = (value) => {
  if (!value || value === "full_year") {
    return "Full year";
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const formatStatusLabel = (value) => {
  if (!value) {
    return "Pending";
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const getStatusTone = (value) => {
  const normalized = value?.toLowerCase();
  switch (normalized) {
    case "captured":
      return "bg-emerald-100 text-emerald-700";
    case "pending":
    case "created":
      return "bg-amber-100 text-amber-700";
    case "failed":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

const formatDateTime = (value) => {
  if (!value) {
    return "—";
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleString();
};

export default FeesPayment;
