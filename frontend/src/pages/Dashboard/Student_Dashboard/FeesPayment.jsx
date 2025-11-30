import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FaCreditCard, FaSpinner, FaSync, FaTimes } from "react-icons/fa";
import { HiPlusSm } from "react-icons/hi";
import { toast } from "react-hot-toast";
import { paymentService } from "../../../services/api";

const PAYMENT_STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "created", label: "Created" },
  { value: "captured", label: "Captured" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
];

const PAYMENT_TYPE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "hostel", label: "Hostel" },
  { value: "mess", label: "Mess" },
];

const SEMESTER_OPTIONS = [
  { value: "odd", label: "Odd semester" },
  { value: "even", label: "Even semester" },
];

const FEE_SELECTION_OPTIONS = [
  {
    value: "hostel",
    title: "Hostel fee",
    helper: "Full-year accommodation charges",
  },
  {
    value: "mess",
    title: "Mess fee",
    helper: "Semester-based mess subscription",
  },
];

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
      return;
    }

    setLoadingHistory(true);
    try {
      const params = {};
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      const response = await paymentService.fetchMyPaymentHistory(params);
      if (response?.success) {
        setPaymentHistory(response.data || []);
      } else {
        setPaymentHistory([]);
        toast.error(response?.message || "Unable to load payment history.");
      }
    } catch (error) {
      console.error("fetchPaymentHistory error:", error);
      setPaymentHistory([]);
      toast.error("Error fetching payment history.");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-orange-50 p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="rounded-3xl bg-white p-6 shadow-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                <FaCreditCard size={24} />
              </span>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
                  Fees & payments
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Pay hostel and mess fees securely, then track every
                  transaction in one place.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={openPaymentModal}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-600 to-red-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-orange-700 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2"
              >
                <HiPlusSm size={18} />
                Start a payment
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-xl">
          <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 md:text-xl">
                Payment history
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Filters apply instantly. Status filtering is backed by the
                server.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
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
            </div>
          </header>

          {loadingHistory ? (
            <div className="flex items-center justify-center py-12 text-sm text-gray-600">
              <FaSpinner className="mr-2 animate-spin" /> Loading your payments…
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/40 p-10 text-center text-sm text-gray-600">
              No payments found for the selected filters.
            </div>
          ) : (
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
                          {payment?.semester &&
                          payment?.semester !== "full_year"
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
                          {payment?.razorpayPaymentId ||
                            payment?.paymentId ||
                            "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-4">
                {filteredHistory.map((payment) => (
                  <article
                    key={payment?._id || payment?.razorpayOrderId}
                    className="rounded-2xl border border-gray-100 bg-orange-50/30 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatPaymentType(payment?.paymentFor)}
                          {payment?.semester &&
                          payment?.semester !== "full_year"
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
                        <span className="font-semibold text-gray-700">
                          Amount:
                        </span>{" "}
                        {formatCurrency(payment?.amount, payment?.currency)}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-700">
                          Payment id:
                        </span>{" "}
                        {payment?.razorpayPaymentId ||
                          payment?.paymentId ||
                          "—"}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
      {isPaymentModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/50"
            onClick={closePaymentModal}
          />
          <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                  <FaCreditCard size={20} />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Start a payment
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Choose what you want to pay for, then continue to Razorpay
                    checkout.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closePaymentModal}
                disabled={isProcessingPayment}
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Close"
              >
                <FaTimes />
              </button>
            </div>

            <div className="mt-6 space-y-5">
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
                    onChange={(event) =>
                      setSelectedSemester(event.target.value)
                    }
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

              <button
                type="button"
                onClick={startPayment}
                disabled={
                  isProcessingPayment ||
                  (selectedFeeType === "mess" && !selectedSemester)
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-600 to-red-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-orange-700 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isProcessingPayment ? (
                  <>
                    <FaSpinner className="animate-spin" /> Preparing Razorpay…
                  </>
                ) : (
                  <>
                    <HiPlusSm /> Proceed to payment
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500">
                You will be redirected to Razorpay for secure checkout. Once
                payment completes we refresh your history automatically.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
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
