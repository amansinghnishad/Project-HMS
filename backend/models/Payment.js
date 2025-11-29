const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Assuming this links to the User model
  allottedStudentId: { type: mongoose.Schema.Types.ObjectId, ref: "AllottedStudent", required: true }, // Link to the AllottedStudent record
  paymentFor: { type: String, enum: ['hostel', 'mess'], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['pending', 'created', 'captured', 'failed'], default: 'pending' },
  academicYear: { type: String, required: true }, // e.g., "2024-2025"
  semester: { type: String, enum: ['odd', 'even', 'full_year'], required: true }, // 'full_year' for hostel, 'odd'/'even' for mess
  roomNumber: { type: String }, // To store at the time of payment
  hostelType: { type: String, enum: ['boys', 'girls'] }, // To store at the time of payment
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  transactionDate: { type: Date, default: Date.now }
}, { timestamps: true });

PaymentSchema.index({ studentId: 1, paymentFor: 1, academicYear: -1, semester: 1 });
PaymentSchema.index({ allottedStudentId: 1 });
PaymentSchema.index({ razorpayOrderId: 1 }, { unique: true, sparse: true });
PaymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Payment", PaymentSchema);
