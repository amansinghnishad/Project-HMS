const mongoose = require("mongoose");

const MaintenanceRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  requestType: {
    type: String,
    enum: ["plumbing", "electrical", "furniture", "cleaning", "ac_cooling", "network", "security", "others"],
    required: true
  },
  description: { type: String, required: true },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium"
  }, photo: { type: String }, // Added photo field for base64 image data
  status: { type: String, enum: ["pending", "in-progress", "completed"], default: "pending" },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  resolvedAt: { type: Date },
  resolution: { type: String }, // Comments/notes about resolution
  completionPhoto: { type: String }, // Photo taken when work is completed by Provost
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

MaintenanceRequestSchema.index({ userId: 1, createdAt: -1 });
MaintenanceRequestSchema.index({ status: 1, priority: 1, createdAt: -1 });
MaintenanceRequestSchema.index({ resolvedBy: 1, resolvedAt: -1 });

module.exports = mongoose.model("MaintenanceRequest", MaintenanceRequestSchema);
