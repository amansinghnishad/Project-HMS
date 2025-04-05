const Feedback = require("../models/feedbackModel");

const submitFeedback = async (req, res) => {
  try {
    const { feedbackType, customSubject, message } = req.body;

    if (!feedbackType || !message) {
      return res.status(400).json({ error: "Feedback type and message are required." });
    }

    const feedback = new Feedback({
      feedbackType,
      subject: feedbackType === "Other" ? customSubject : feedbackType,
      message,
    });

    await feedback.save();
    res.status(201).json({ message: "Feedback submitted successfully." });
  } catch (error) {
    res.status(500).json({ error: "An error occurred while submitting feedback." });
  }
};

module.exports = { submitFeedback };
