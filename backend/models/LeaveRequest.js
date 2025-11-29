const mongoose = require("mongoose");

const LeaveRequestSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reason: { type: String, required: true },
  leaveType: {
    type: String,
    enum: ['sick', 'emergency', 'personal', 'vacation', 'other'],
    required: true
  },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  emergencyContact: { type: String, required: true }, status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  provostComments: { type: String, default: "" },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  resolvedAt: { type: Date }
}, { timestamps: true });

LeaveRequestSchema.index({ studentId: 1, createdAt: -1 });
LeaveRequestSchema.index({ status: 1, createdAt: -1 });
LeaveRequestSchema.index({ resolvedBy: 1, resolvedAt: -1 });

module.exports = mongoose.model("LeaveRequest", LeaveRequestSchema);
