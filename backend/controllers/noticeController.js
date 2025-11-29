const mongoose = require("mongoose");
const { isValidObjectId } = require("mongoose");
const Notice = require("../models/Notice");
const User = require("../models/User");

const NOTICE_TYPES = Object.freeze([
  "Behavioral Warning",
  "Academic Warning",
  "Disciplinary Action",
  "General Notice",
  "Room Inspection",
  "Fee Notice",
]);
const NOTICE_STATUSES = Object.freeze(["sent", "acknowledged", "resolved"]);
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 200;

const recipientPopulationConfig = {
  path: "recipientId",
  select: "name email role",
  populate: {
    path: "studentProfile",
    select: "rollNumber roomNumber department courseName",
  },
};

const senderPopulationConfig = {
  path: "senderId",
  select: "name email role",
};

const populateNoticeQuery = (query) =>
  query.populate(senderPopulationConfig).populate(recipientPopulationConfig);

const sanitizeText = (value) => (typeof value === "string" ? value.trim() : "");

const parsePositiveInt = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

const normalizeBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes"].includes(normalized)) return true;
    if (["false", "0", "no"].includes(normalized)) return false;
  }
  return fallback;
};

const normalizeObjectId = (value) => {
  if (!value || !isValidObjectId(value)) {
    return null;
  }
  return new mongoose.Types.ObjectId(value);
};

const buildPaginationResponse = ({ page, limit, total }) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit) || 1,
});

// Send a notice to an individual student.
const sendNotice = async (req, res) => {
  try {
    const senderId = req.user?.id;
    if (!senderId) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    const {
      recipientId,
      noticeType,
      subject,
      message,
      actionRequired,
      isUrgent,
    } = req.body || {};

    const normalizedRecipientId = normalizeObjectId(recipientId);
    const normalizedType = sanitizeText(noticeType);
    const normalizedSubject = sanitizeText(subject);
    const normalizedMessage = sanitizeText(message);
    const normalizedAction = sanitizeText(actionRequired);
    const urgentFlag = normalizeBoolean(isUrgent, false);

    if (!normalizedRecipientId || !normalizedType || !normalizedSubject || !normalizedMessage) {
      return res.status(400).json({
        success: false,
        message: "Recipient, notice type, subject, and message are required.",
      });
    }

    if (!NOTICE_TYPES.includes(normalizedType)) {
      return res.status(400).json({ success: false, message: "Invalid notice type provided." });
    }

    const recipient = await User.findById(normalizedRecipientId);
    if (!recipient) {
      return res.status(404).json({ success: false, message: "Recipient not found." });
    }

    if (recipient.role !== "student") {
      return res.status(400).json({ success: false, message: "Notices can only be sent to students." });
    }

    const notice = await Notice.create({
      senderId,
      recipientId: normalizedRecipientId,
      noticeType: normalizedType,
      subject: normalizedSubject,
      message: normalizedMessage,
      actionRequired: normalizedAction,
      isUrgent: urgentFlag,
      status: "sent",
    });

    await notice.populate([senderPopulationConfig, recipientPopulationConfig]);

    res.status(201).json({
      success: true,
      message: "Notice sent successfully.",
      data: notice,
    });
  } catch (error) {
    console.error("sendNotice error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while sending the notice.",
    });
  }
};

// List notices sent by the authenticated user.
const getSentNotices = async (req, res) => {
  try {
    const senderId = req.user?.id;
    if (!senderId) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    const statusFilter = sanitizeText(req.query?.status);
    const typeFilter = sanitizeText(req.query?.noticeType);
    const urgentFilter = req.query?.isUrgent;
    const page = parsePositiveInt(req.query?.page, 1);
    const limit = Math.min(parsePositiveInt(req.query?.limit, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
    const skip = (page - 1) * limit;

    const filter = { senderId };
    if (statusFilter) {
      if (!NOTICE_STATUSES.includes(statusFilter)) {
        return res.status(400).json({ success: false, message: "Invalid status filter provided." });
      }
      filter.status = statusFilter;
    }
    if (typeFilter) {
      if (!NOTICE_TYPES.includes(typeFilter)) {
        return res.status(400).json({ success: false, message: "Invalid notice type filter provided." });
      }
      filter.noticeType = typeFilter;
    }
    if (typeof urgentFilter !== "undefined") {
      filter.isUrgent = normalizeBoolean(urgentFilter);
    }

    const [notices, total] = await Promise.all([
      populateNoticeQuery(
        Notice.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
      ).lean({ getters: true }),
      Notice.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: notices,
      pagination: buildPaginationResponse({ page, limit, total }),
    });
  } catch (error) {
    console.error("getSentNotices error:", error);
    res.status(500).json({ success: false, message: "An error occurred while fetching notices." });
  }
};

// List notices received by the authenticated user.
const getReceivedNotices = async (req, res) => {
  try {
    const recipientId = req.user?.id;
    if (!recipientId) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    const statusFilter = sanitizeText(req.query?.status);
    const typeFilter = sanitizeText(req.query?.noticeType);
    const urgentFilter = req.query?.isUrgent;
    const page = parsePositiveInt(req.query?.page, 1);
    const limit = Math.min(parsePositiveInt(req.query?.limit, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
    const skip = (page - 1) * limit;

    const filter = { recipientId };
    if (statusFilter) {
      if (!NOTICE_STATUSES.includes(statusFilter)) {
        return res.status(400).json({ success: false, message: "Invalid status filter provided." });
      }
      filter.status = statusFilter;
    }
    if (typeFilter) {
      if (!NOTICE_TYPES.includes(typeFilter)) {
        return res.status(400).json({ success: false, message: "Invalid notice type filter provided." });
      }
      filter.noticeType = typeFilter;
    }
    if (typeof urgentFilter !== "undefined") {
      filter.isUrgent = normalizeBoolean(urgentFilter);
    }

    const [notices, total] = await Promise.all([
      populateNoticeQuery(
        Notice.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
      ).lean({ getters: true }),
      Notice.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: notices,
      pagination: buildPaginationResponse({ page, limit, total }),
    });
  } catch (error) {
    console.error("getReceivedNotices error:", error);
    res.status(500).json({ success: false, message: "An error occurred while fetching notices." });
  }
};

// Mark a notice as read.
const markNoticeAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    const noticeId = normalizeObjectId(req.params?.noticeId);
    if (!noticeId) {
      return res.status(400).json({ success: false, message: "A valid notice ID is required." });
    }

    const notice = await Notice.findOne({ _id: noticeId, recipientId: userId });
    if (!notice) {
      return res.status(404).json({
        success: false,
        message: "Notice not found or you do not have access to it.",
      });
    }

    if (!notice.isRead) {
      notice.isRead = true;
      notice.readAt = new Date();
      notice.status = "acknowledged";
      await notice.save();
    }

    res.status(200).json({ success: true, message: "Notice marked as read.", data: notice });
  } catch (error) {
    console.error("markNoticeAsRead error:", error);
    res.status(500).json({ success: false, message: "An error occurred while updating the notice." });
  }
};

// Provide notice statistics for dashboards.
const getNoticeStats = async (req, res) => {
  try {
    const senderId = req.user?.id;
    if (!senderId) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    const senderObjectId = new mongoose.Types.ObjectId(senderId);
    const summaryPipeline = [
      { $match: { senderId: senderObjectId } },
      {
        $group: {
          _id: null,
          totalSent: { $sum: 1 },
          totalRead: { $sum: { $cond: [{ $eq: ["$isRead", true] }, 1, 0] } },
          totalUrgent: { $sum: { $cond: [{ $eq: ["$isUrgent", true] }, 1, 0] } },
        },
      },
    ];

    const byTypePipeline = [
      { $match: { senderId: senderObjectId } },
      {
        $group: {
          _id: "$noticeType",
          count: { $sum: 1 },
          urgentCount: { $sum: { $cond: [{ $eq: ["$isUrgent", true] }, 1, 0] } },
          readCount: { $sum: { $cond: [{ $eq: ["$isRead", true] }, 1, 0] } },
        },
      },
      { $sort: { count: -1 } },
    ];

    const [summary, typeStats] = await Promise.all([
      Notice.aggregate(summaryPipeline),
      Notice.aggregate(byTypePipeline),
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: summary[0] || {
          totalSent: 0,
          totalRead: 0,
          totalUrgent: 0,
        },
        byType: typeStats,
      },
    });
  } catch (error) {
    console.error("getNoticeStats error:", error);
    res.status(500).json({ success: false, message: "An error occurred while fetching notice statistics." });
  }
};

// List all notices with optional filters.
const getAllNotices = async (req, res) => {
  try {
    const statusFilter = sanitizeText(req.query?.status);
    const typeFilter = sanitizeText(req.query?.noticeType);
    const senderFilter = normalizeObjectId(req.query?.senderId);
    const recipientFilter = normalizeObjectId(req.query?.recipientId);
    const urgentFilter = req.query?.isUrgent;
    const page = parsePositiveInt(req.query?.page, 1);
    const limit = Math.min(parsePositiveInt(req.query?.limit, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
    const skip = (page - 1) * limit;

    const filter = {};
    if (statusFilter) {
      if (!NOTICE_STATUSES.includes(statusFilter)) {
        return res.status(400).json({ success: false, message: "Invalid status filter provided." });
      }
      filter.status = statusFilter;
    }
    if (typeFilter) {
      if (!NOTICE_TYPES.includes(typeFilter)) {
        return res.status(400).json({ success: false, message: "Invalid notice type filter provided." });
      }
      filter.noticeType = typeFilter;
    }
    if (senderFilter) {
      filter.senderId = senderFilter;
    }
    if (recipientFilter) {
      filter.recipientId = recipientFilter;
    }
    if (typeof urgentFilter !== "undefined") {
      filter.isUrgent = normalizeBoolean(urgentFilter);
    }

    const [notices, total] = await Promise.all([
      populateNoticeQuery(
        Notice.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
      ).lean({ getters: true }),
      Notice.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: notices,
      pagination: buildPaginationResponse({ page, limit, total }),
    });
  } catch (error) {
    console.error("getAllNotices error:", error);
    res.status(500).json({ success: false, message: "An error occurred while fetching notices." });
  }
};

module.exports = {
  sendNotice,
  getSentNotices,
  getReceivedNotices,
  markNoticeAsRead,
  getNoticeStats,
  getAllNotices,
};
