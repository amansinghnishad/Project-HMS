const { isValidObjectId } = require("mongoose");
const Feedback = require("../models/feedbackModel");

const FEEDBACK_STATUSES = Object.freeze(["pending", "in-progress", "resolved", "closed"]);
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 200;

const userPopulationConfig = {
  path: "userId",
  select: "name email role",
  populate: {
    path: "studentProfile",
    select: "rollNumber roomNumber department courseName",
  },
};

const resolvedByPopulationConfig = {
  path: "resolvedBy",
  select: "name email role",
};

const populateFeedbackQuery = (query) =>
  query.populate(userPopulationConfig).populate(resolvedByPopulationConfig);

const sanitizeText = (value) => (typeof value === "string" ? value.trim() : "");

const parsePositiveInt = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

// Submit a new feedback entry.
const submitFeedback = async (req, res) => {
  try {
    const { feedbackType, customSubject, message } = req.body || {};
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const type = sanitizeText(feedbackType);
    const body = sanitizeText(message);
    const custom = sanitizeText(customSubject);
    const subject = type === "Other" ? custom : type;

    if (!type || !body) {
      return res.status(400).json({
        success: false,
        error: "Feedback type and message are required.",
      });
    }

    if (type === "Other" && !subject) {
      return res.status(400).json({
        success: false,
        error: "Custom subject is required when feedback type is Other.",
      });
    }

    const newFeedback = await Feedback.create({
      feedbackType: type,
      subject,
      customSubject: type === "Other" ? subject : undefined,
      message: body,
      userId,
      status: "pending",
    });

    await newFeedback.populate([userPopulationConfig, resolvedByPopulationConfig]);

    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully.",
      data: newFeedback,
    });
  } catch (error) {
    console.error("submitFeedback error:", error);
    res.status(500).json({
      success: false,
      error: "An error occurred while submitting feedback.",
    });
  }
};

// Retrieve feedback submitted by the requesting user.
const getFeedback = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const statusFilter = sanitizeText(req.query?.status);
    if (statusFilter && !FEEDBACK_STATUSES.includes(statusFilter)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status filter provided.",
      });
    }

    const page = parsePositiveInt(req.query?.page, 1);
    const limit = Math.min(parsePositiveInt(req.query?.limit, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
    const skip = (page - 1) * limit;

    const filter = { userId };
    if (statusFilter) {
      filter.status = statusFilter;
    }

    const [feedbacks, total] = await Promise.all([
      populateFeedbackQuery(
        Feedback.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
      ).lean({ getters: true }),
      Feedback.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: feedbacks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error("getFeedback error:", error);
    res.status(500).json({
      success: false,
      error: "An error occurred while retrieving feedback.",
    });
  }
};

// Retrieve all feedback entries for administrative users.
const getAllFeedback = async (req, res) => {
  try {
    const statusFilter = sanitizeText(req.query?.status);
    if (statusFilter && !FEEDBACK_STATUSES.includes(statusFilter)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status filter provided.",
      });
    }

    const page = parsePositiveInt(req.query?.page, 1);
    const limit = Math.min(parsePositiveInt(req.query?.limit, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
    const skip = (page - 1) * limit;

    const filter = {};
    if (statusFilter) {
      filter.status = statusFilter;
    }

    const [feedbacks, total] = await Promise.all([
      populateFeedbackQuery(
        Feedback.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
      ).lean({ getters: true }),
      Feedback.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: feedbacks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error("getAllFeedback error:", error);
    res.status(500).json({
      success: false,
      error: "An error occurred while retrieving feedback.",
    });
  }
};

// Update a feedback entry status and response.
const resolveFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { status, response } = req.body || {};
    const resolvedBy = req.user?.id;

    if (!resolvedBy) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    if (!feedbackId || !isValidObjectId(feedbackId)) {
      return res.status(400).json({ success: false, error: "A valid feedback ID is required." });
    }

    const normalizedStatus = sanitizeText(status);
    if (!FEEDBACK_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status. Must be one of: pending, in-progress, resolved, closed.",
      });
    }

    const sanitizedResponse = sanitizeText(response);

    const updateOperation = {
      $set: {
        status: normalizedStatus,
        response: sanitizedResponse,
      },
    };

    if (normalizedStatus === "resolved" || normalizedStatus === "closed") {
      updateOperation.$set.resolvedBy = resolvedBy;
      updateOperation.$set.resolvedAt = new Date();
    } else {
      updateOperation.$unset = { resolvedBy: "", resolvedAt: "" };
    }

    const updatedFeedback = await populateFeedbackQuery(
      Feedback.findByIdAndUpdate(feedbackId, updateOperation, {
        new: true,
        runValidators: true,
      })
    ).lean({ getters: true });

    if (!updatedFeedback) {
      return res.status(404).json({ success: false, error: "Feedback not found." });
    }

    res.status(200).json({
      success: true,
      data: updatedFeedback,
      message: `Feedback ${normalizedStatus} successfully.`,
    });
  } catch (error) {
    console.error("resolveFeedback error:", error);
    res.status(500).json({
      success: false,
      error: "An error occurred while resolving the feedback.",
    });
  }
};

module.exports = { submitFeedback, getFeedback, getAllFeedback, resolveFeedback };
