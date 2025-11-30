import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { paymentService } from "../../../services/api";

const FeesPayment = () => {
  const [messSemester, setMessSemester] = useState("odd"); // 'odd' or 'even'
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingHostelPay, setLoadingHostelPay] = useState(false);
  const [loadingMessPay, setLoadingMessPay] = useState(false);

  // Get token from localStorage (or Redux store)
  const token = localStorage.getItem("token"); // Removed JSON.parse
  // const { user } = useSelector((state) => state.profile); // Example if user details are in Redux

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const fetchPaymentHistory = useCallback(async () => {
    if (!token) {
      toast.error("Authentication required.");
      return;
    }
    setLoadingHistory(true);
    try {
      const response = await paymentService.fetchMyPaymentHistory();
      if (response && response.success) {
        setPaymentHistory(response.data || []);
      } else {
        toast.error(response?.message || "Failed to fetch payment history.");
        setPaymentHistory([]);
      }
    } catch (error) {
      toast.error("Error fetching payment history.");
      console.error("Payment history fetch error:", error);
      setPaymentHistory([]);
    }
    setLoadingHistory(false);
  }, [token]);

  useEffect(() => {
    fetchPaymentHistory();
  }, [fetchPaymentHistory]);

  const handlePayment = async (feeType, semester = null) => {
    if (!token) {
      toast.error("Please login to proceed with payment.");
      return;
    }

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      toast.error(
        "Razorpay SDK failed to load. Check your internet connection."
      );
      return;
    }

    let orderResponse;
    if (feeType === "hostel") {
      setLoadingHostelPay(true);
      orderResponse = await paymentService.createHostelFeeOrder();
      setLoadingHostelPay(false);
    } else if (feeType === "mess") {
      if (!semester) {
        toast.error("Please select a semester for mess fee payment.");
        return;
      }
      setLoadingMessPay(true);
      orderResponse = await paymentService.createMessFeeOrder({ semester });
      setLoadingMessPay(false);
    }

    if (!orderResponse || !orderResponse.success) {
      toast.error(orderResponse?.message || "Failed to create payment order.");
      return;
    }

    const { orderId, amount, currency, key, studentName, studentEmail } =
      orderResponse;
    // const razorpayKey = process.env.VITE_RAZORPAY_KEY; // If key is not in orderResponse

    const options = {
      key: key, // Use key from backend response
      amount: amount,
      currency: currency,
      name: "HMS Payments",
      description: `${
        feeType === "hostel" ? "Hostel Fee" : `Mess Fee (${semester} semester)`
      }`,
      order_id: orderId,
      handler: async function (response) {
        const verificationData = {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        };
        const verificationResult = await paymentService.verifyPayment(
          verificationData
        );
        if (verificationResult && verificationResult.success) {
          toast.success(verificationResult.message || "Payment successful!");
          fetchPaymentHistory(); // Refresh history
        } else {
          toast.error(
            verificationResult?.message || "Payment verification failed."
          );
        }
      },
      prefill: {
        name: studentName || "Student Name",
        email: studentEmail || "student@example.com",
        // contact: '9999999999' // Optional: if you have student's phone number
      },
      notes: {
        address: "Hostel Management System",
        feeType: feeType,
        semester: semester || "N/A",
      },
      theme: {
        color: "#3399cc",
      },
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.on("payment.failed", function (response) {
      toast.error(`Payment Failed: ${response.error.description}`);
      console.error("Payment Failed:", response.error);
    });
    paymentObject.open();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center sm:text-left">
          Fees Payment
        </h2>

        {/* Payment Cards Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Hostel Fee Payment */}
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 border border-gray-200">
            <h3 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-700 flex items-center">
              🏠 Hostel Fee
            </h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Pay your annual hostel fees here. Ensure your allotment is
              confirmed before proceeding.
            </p>
            <button
              onClick={() => handlePayment("hostel")}
              disabled={loadingHostelPay || !token}
              className="w-full py-3 sm:py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg text-sm sm:text-base"
            >
              {loadingHostelPay ? "Processing..." : "Pay Hostel Fee"}
            </button>
          </div>

          {/* Mess Fee Payment */}
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 border border-gray-200">
            <h3 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-700 flex items-center">
              🍽️ Mess Fee
            </h3>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Pay your semester mess fees. Select the appropriate semester
              below.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Semester *
              </label>
              <select
                value={messSemester}
                onChange={(e) => setMessSemester(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
              >
                <option value="odd">Odd Semester</option>
                <option value="even">Even Semester</option>
              </select>
            </div>
            <button
              onClick={() => handlePayment("mess", messSemester)}
              disabled={loadingMessPay || !token}
              className="w-full py-3 sm:py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg text-sm sm:text-base"
            >
              {loadingMessPay
                ? "Processing..."
                : `Pay Mess Fee (${
                    messSemester.charAt(0).toUpperCase() + messSemester.slice(1)
                  } Sem)`}
            </button>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 border border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-700">
              📋 Payment History
            </h3>
            <button
              onClick={fetchPaymentHistory}
              disabled={loadingHistory}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm shadow-sm"
            >
              {loadingHistory ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {loadingHistory ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading payment history...</p>
            </div>
          ) : paymentHistory.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-lg">No payment history found.</p>
              <p className="text-sm text-gray-400 mt-2">
                Your completed payments will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="hidden sm:block">
                <table className="w-full border-collapse border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Date
                      </th>
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Fee Type
                      </th>
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Amount
                      </th>
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Payment ID
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.map((payment, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">
                          {new Date(
                            payment.createdAt || payment.date
                          ).toLocaleDateString()}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700 capitalize">
                          {payment.feeType || "N/A"}
                          {payment.semester && ` (${payment.semester})`}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700 font-medium">
                          ₹{payment.amount || 0}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              payment.status === "success" ||
                              payment.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : payment.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {payment.status || "Unknown"}
                          </span>
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-sm text-gray-600 font-mono">
                          {payment.paymentId ||
                            payment.razorpay_payment_id ||
                            "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile view - Cards */}
              <div className="sm:hidden space-y-4">
                {paymentHistory.map((payment, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-semibold text-gray-700 capitalize">
                        {payment.feeType || "N/A"}
                        {payment.semester && ` (${payment.semester})`}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          payment.status === "success" ||
                          payment.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : payment.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {payment.status || "Unknown"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <span className="font-medium">Amount:</span> ₹
                        {payment.amount || 0}
                      </p>
                      <p>
                        <span className="font-medium">Date:</span>{" "}
                        {new Date(
                          payment.createdAt || payment.date
                        ).toLocaleDateString()}
                      </p>
                      <p>
                        <span className="font-medium">Payment ID:</span>{" "}
                        <span className="font-mono text-xs">
                          {payment.paymentId ||
                            payment.razorpay_payment_id ||
                            "N/A"}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {!token && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm mt-6">
            ⚠️ Please log in to make payments and view your payment history.
          </div>
        )}
      </div>
    </div>
  );
};

export default FeesPayment;
