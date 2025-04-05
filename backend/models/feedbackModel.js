const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    feedbackType: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);
