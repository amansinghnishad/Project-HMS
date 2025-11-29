const crypto = require("crypto");
const Payment = require("../models/Payment");
const User = require("../models/User");
const AllottedStudent = require("../models/AllottedStudent");
require("../models/RegisteredStudentProfile");
const razorpayInstance = require("../config/razorpay");

const HOSTEL_FEE_AMOUNT = Number(process.env.HOSTEL_FEE_AMOUNT || 60000);
const MESS_FEE_AMOUNT = Number(process.env.MESS_FEE_AMOUNT || 20000);
const CURRENCY = process.env.RAZORPAY_CURRENCY || "INR";
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 200;

const PAYMENT_TYPES = Object.freeze({ HOSTEL: "hostel", MESS: "mess" });
const MESS_SEMESTERS = Object.freeze(["odd", "even"]);
const PAYMENT_STATUSES = Object.freeze(["pending", "created", "captured", "failed"]);

const sanitizeText = (value) => (typeof value === "string" ? value.trim() : "");

const parsePositiveInt = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

const normalizeSemester = (semester) => {
  const normalized = sanitizeText(semester).toLowerCase();
  if (!MESS_SEMESTERS.includes(normalized)) {
    return null;
  }
  return normalized;
};

const buildReceipt = ({ prefix, studentId, extra }) =>
  `${prefix}_${studentId}_${extra}_${Date.now().toString().slice(-6)}`;

const createAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const nextYear = year + 1;
  return `${year}-${nextYear}`;
};

const createRazorpayOrder = async ({ amount, currency, receipt, notes }) => {
  const payload = {
    amount: amount * 100,
    currency,
    receipt,
    notes,
  };
  return razorpayInstance.orders.create(payload);
};

const fetchStudentWithProfile = async (userId) => {
  const student = await User.findById(userId).populate("studentProfile");
  if (!student || !student.studentProfile) {
    return null;
  }
  return student;
};

const fetchActiveAllotment = (userId) =>
  AllottedStudent.findOne({ userId }).lean();

const createPaymentRecord = async ({
  student,
  allotment,
  order,
  amount,
  academicYear,
  paymentFor,
  semester,
}) =>
  Payment.create({
    studentId: student._id,
    allottedStudentId: allotment._id,
    paymentFor,
    amount,
    currency: CURRENCY,
    status: "created",
    academicYear,
    semester,
    roomNumber: allotment.allottedRoomNumber,
    hostelType: allotment.allottedHostelType,
    razorpayOrderId: order.id,
  });

const buildPaymentResponse = ({ order, paymentRecord, student }) => ({
  orderId: order.id,
  currency: order.currency,
  amount: order.amount,
  key: process.env.RAZORPAY_KEY,
  studentName: student.name,
  studentEmail: student.email,
  notes: order.notes,
  paymentRecordId: paymentRecord._id,
});

const populatePaymentQuery = (query) =>
  query
    .populate("studentId", "name email role")
    .populate("allottedStudentId", "rollNumber allottedRoomNumber hostelFeeStatus messFeeStatus");

// Create a Razorpay order for hostel fees.
const createHostelFeeOrder = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    const student = await fetchStudentWithProfile(userId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student profile not found." });
    }

    const allotment = await fetchActiveAllotment(userId);
    if (!allotment) {
      return res.status(403).json({ success: false, message: "Room allotment is required to pay hostel fees." });
    }

    const academicYear = createAcademicYear();
    const receipt = buildReceipt({ prefix: "hstl", studentId: student._id, extra: "fy" });
    const notes = {
      feeType: PAYMENT_TYPES.HOSTEL,
      studentId: student._id.toString(),
      studentName: student.name,
      academicYear,
    };

    const order = await createRazorpayOrder({
      amount: HOSTEL_FEE_AMOUNT,
      currency: CURRENCY,
      receipt,
      notes,
    });

    const paymentRecord = await createPaymentRecord({
      student,
      allotment,
      order,
      amount: HOSTEL_FEE_AMOUNT,
      academicYear,
      paymentFor: PAYMENT_TYPES.HOSTEL,
      semester: "full_year",
    });

    res.status(200).json({
      success: true,
      message: "Hostel fee order created successfully.",
      ...buildPaymentResponse({ order, paymentRecord, student }),
    });
  } catch (error) {
    console.error("createHostelFeeOrder error:", error);
    res.status(500).json({ success: false, message: "Hostel fee order creation failed." });
  }
};

// Create a Razorpay order for mess fees.
const createMessFeeOrder = async (req, res) => {
  try {
    const userId = req.user?.id;
    const semester = normalizeSemester(req.body?.semester);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    if (!semester) {
      return res.status(400).json({ success: false, message: "Semester must be 'odd' or 'even'." });
    }

    const student = await fetchStudentWithProfile(userId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student profile not found." });
    }

    const allotment = await fetchActiveAllotment(userId);
    if (!allotment) {
      return res.status(403).json({ success: false, message: "Room allotment is required to pay mess fees." });
    }

    const academicYear = createAcademicYear();
    const receipt = buildReceipt({ prefix: "mess", studentId: student._id, extra: semester[0] });
    const notes = {
      feeType: PAYMENT_TYPES.MESS,
      studentId: student._id.toString(),
      studentName: student.name,
      semester,
      academicYear,
    };

    const order = await createRazorpayOrder({
      amount: MESS_FEE_AMOUNT,
      currency: CURRENCY,
      receipt,
      notes,
    });

    const paymentRecord = await createPaymentRecord({
      student,
      allotment,
      order,
      amount: MESS_FEE_AMOUNT,
      academicYear,
      paymentFor: PAYMENT_TYPES.MESS,
      semester,
    });

    res.status(200).json({
      success: true,
      message: "Mess fee order created successfully.",
      ...buildPaymentResponse({ order, paymentRecord, student }),
    });
  } catch (error) {
    console.error("createMessFeeOrder error:", error);
    res
      .status(500)
      .json({ success: false, message: "Mess fee order creation failed.", error: error?.message });
  }
};

const updateAllotmentFeeStatus = async ({ paymentRecord }) => {
  if (!paymentRecord.allottedStudentId) {
    return;
  }

  const feeTypeField =
    paymentRecord.paymentFor === PAYMENT_TYPES.HOSTEL ? "hostelFeeStatus" : "messFeeStatus";
  const paidOnField =
    paymentRecord.paymentFor === PAYMENT_TYPES.HOSTEL ? "hostelFeePaidOn" : "messFeePaidOn";

  await AllottedStudent.findByIdAndUpdate(paymentRecord.allottedStudentId, {
    [feeTypeField]: "paid",
    [paidOnField]: new Date(),
  });
};

const verifySignature = ({ orderId, paymentId, providedSignature }) => {
  const payload = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(payload)
    .digest("hex");
  return expectedSignature === providedSignature;
};

// Verify Razorpay payment signature and update payment status.
const verifyPaymentSignature = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentRecordId } =
      req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !paymentRecordId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing Razorpay payment details or payment record ID." });
    }

    const paymentRecord = await Payment.findById(paymentRecordId);
    if (!paymentRecord) {
      return res.status(404).json({ success: false, message: "Payment record not found." });
    }

    if (
      paymentRecord.studentId.toString() !== userId ||
      paymentRecord.razorpayOrderId !== razorpay_order_id
    ) {
      return res.status(403).json({ success: false, message: "Payment record mismatch or unauthorized." });
    }

    if (paymentRecord.status === "captured") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified and captured.",
        payment: paymentRecord,
      });
    }

    const signatureValid = verifySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      providedSignature: razorpay_signature,
    });

    if (!signatureValid) {
      paymentRecord.status = "failed";
      await paymentRecord.save();
      return res.status(400).json({ success: false, message: "Payment verification failed." });
    }

    paymentRecord.status = "captured";
    paymentRecord.razorpayPaymentId = razorpay_payment_id;
    paymentRecord.razorpaySignature = razorpay_signature;
    paymentRecord.transactionDate = new Date();
    await paymentRecord.save();

    try {
      await updateAllotmentFeeStatus({ paymentRecord });
    } catch (error) {
      console.error("Failed to update allotment fee status:", error);
    }

    res.status(200).json({
      success: true,
      message: "Payment verified and captured successfully.",
      paymentId: paymentRecord._id,
      paymentFor: paymentRecord.paymentFor,
      status: paymentRecord.status,
    });
  } catch (error) {
    console.error("verifyPaymentSignature error:", error);
    res.status(500).json({ success: false, message: "Payment verification failed." });
  }
};

// Provide payment history for authenticated students.
const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    const statusFilter = sanitizeText(req.query?.status);
    if (statusFilter && !PAYMENT_STATUSES.includes(statusFilter)) {
      return res.status(400).json({ success: false, message: "Invalid payment status filter provided." });
    }

    const filter = { studentId: userId };
    if (statusFilter) {
      filter.status = statusFilter;
    }

    const payments = await populatePaymentQuery(
      Payment.find(filter).sort({ createdAt: -1 })
    ).lean({ getters: true });

    res.status(200).json({
      success: true,
      message: "Payment history retrieved successfully.",
      data: payments,
    });
  } catch (error) {
    console.error("getPaymentHistory error:", error);
    res.status(500).json({ success: false, message: "Failed to retrieve payment history." });
  }
};

// Provide payment history for administrative users.
const getAllPayments = async (req, res) => {
  try {
    const statusFilter = sanitizeText(req.query?.status);
    if (statusFilter && !PAYMENT_STATUSES.includes(statusFilter)) {
      return res.status(400).json({ success: false, message: "Invalid payment status filter provided." });
    }

    const paymentForFilter = sanitizeText(req.query?.paymentFor).toLowerCase();
    if (paymentForFilter && !Object.values(PAYMENT_TYPES).includes(paymentForFilter)) {
      return res.status(400).json({ success: false, message: "Invalid payment type filter provided." });
    }

    const page = parsePositiveInt(req.query?.page, 1);
    const limit = Math.min(parsePositiveInt(req.query?.limit, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
    const skip = (page - 1) * limit;

    const filter = {};
    if (statusFilter) {
      filter.status = statusFilter;
    }
    if (paymentForFilter) {
      filter.paymentFor = paymentForFilter;
    }

    const [payments, total] = await Promise.all([
      populatePaymentQuery(
        Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
      ).lean({ getters: true }),
      Payment.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: total,
      data: payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error("getAllPayments error:", error);
    res.status(500).json({ success: false, message: "Failed to retrieve payments." });
  }
};

module.exports = {
  createHostelFeeOrder,
  createMessFeeOrder,
  verifyPaymentSignature,
  getPaymentHistory,
  getAllPayments,
};
