const { isValidObjectId } = require("mongoose");
const LeaveRequest = require("../models/LeaveRequest");

const LEAVE_STATUSES = Object.freeze(["pending", "approved", "rejected"]);
const LEAVE_TYPES = Object.freeze(["sick", "emergency", "personal", "vacation", "other"]);
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 200;

const studentPopulationConfig = {
  path: "studentId",
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

const populateLeaveQuery = (query) =>
  query.populate(studentPopulationConfig).populate(resolvedByPopulationConfig);

const sanitizeText = (value) => (typeof value === "string" ? value.trim() : "");

const parsePositiveInt = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

const parseDate = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
};

// Submit a new leave request.
const submitLeaveRequest = async (req, res) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { reason, startDate, endDate, emergencyContact, leaveType } = req.body || {};

    const normalizedReason = sanitizeText(reason);
    const normalizedLeaveType = sanitizeText(leaveType).toLowerCase();
    const normalizedContact = sanitizeText(emergencyContact);

    if (!normalizedReason || !startDate || !endDate || !normalizedContact || !normalizedLeaveType) {
      return res.status(400).json({
        success: false,
        error: "All fields are required: reason, start date, end date, emergency contact, and leave type.",
      });
    }

    if (!LEAVE_TYPES.includes(normalizedLeaveType)) {
      return res.status(400).json({ success: false, error: "Invalid leave type provided." });
    }

    const start = parseDate(startDate);
    const end = parseDate(endDate);
    if (start) {
      start.setHours(0, 0, 0, 0);
    }
    if (end) {
      end.setHours(0, 0, 0, 0);
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!start || !end) {
      return res.status(400).json({ success: false, error: "Invalid date format provided." });
    }

    if (start >= end) {
      return res.status(400).json({ success: false, error: "End date must be after start date." });
    }

    if (start < today) {
      return res.status(400).json({ success: false, error: "Start date cannot be in the past." });
    }

    const leaveRequest = await LeaveRequest.create({
      studentId,
      reason: normalizedReason,
      leaveType: normalizedLeaveType,
      fromDate: start,
      toDate: end,
      emergencyContact: normalizedContact,
      status: "pending",
    });

    await leaveRequest.populate([studentPopulationConfig, resolvedByPopulationConfig]);

    res.status(201).json({
      success: true,
      data: leaveRequest,
      message: "Leave request submitted successfully.",
    });
  } catch (error) {
    console.error("submitLeaveRequest error:", error);
    res.status(500).json({
      success: false,
      error: "An error occurred while submitting the leave request.",
    });
  }
};

// List leave requests belonging to the authenticated student.
const getLeaveRequests = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const statusFilter = sanitizeText(req.query?.status).toLowerCase();
    const typeFilter = sanitizeText(req.query?.leaveType).toLowerCase();
    const page = parsePositiveInt(req.query?.page, 1);
    const limit = Math.min(parsePositiveInt(req.query?.limit, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
    const skip = (page - 1) * limit;

    const filter = { studentId: userId };
    if (statusFilter) {
      if (!LEAVE_STATUSES.includes(statusFilter)) {
        return res.status(400).json({ success: false, error: "Invalid status filter provided." });
      }
      filter.status = statusFilter;
    }
    if (typeFilter) {
      if (!LEAVE_TYPES.includes(typeFilter)) {
        return res.status(400).json({ success: false, error: "Invalid leave type filter provided." });
      }
      filter.leaveType = typeFilter;
    }

    const [requests, total] = await Promise.all([
      populateLeaveQuery(
        LeaveRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
      ).lean({ getters: true }),
      LeaveRequest.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      message: "Leave requests retrieved successfully.",
    });
  } catch (error) {
    console.error("getLeaveRequests error:", error);
    res.status(500).json({
      success: false,
      error: "An error occurred while retrieving leave requests.",
    });
  }
};

// List leave requests for administrative review.
const getAllLeaveRequests = async (req, res) => {
  try {
    const statusFilter = sanitizeText(req.query?.status).toLowerCase();
    const typeFilter = sanitizeText(req.query?.leaveType).toLowerCase();
    const from = parseDate(req.query?.from);
    const to = parseDate(req.query?.to);
    if (from) {
      from.setHours(0, 0, 0, 0);
    }
    if (to) {
      to.setHours(0, 0, 0, 0);
    }
    const page = parsePositiveInt(req.query?.page, 1);
    const limit = Math.min(parsePositiveInt(req.query?.limit, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
    const skip = (page - 1) * limit;

    const filter = {};
    if (statusFilter) {
      if (!LEAVE_STATUSES.includes(statusFilter)) {
        return res.status(400).json({ success: false, error: "Invalid status filter provided." });
      }
      filter.status = statusFilter;
    }
    if (typeFilter) {
      if (!LEAVE_TYPES.includes(typeFilter)) {
        return res.status(400).json({ success: false, error: "Invalid leave type filter provided." });
      }
      filter.leaveType = typeFilter;
    }
    if (from && to) {
      if (from > to) {
        return res.status(400).json({ success: false, error: "Invalid date range filter provided." });
      }
      filter.fromDate = { $gte: from };
      filter.toDate = { $lte: to };
    } else if (from) {
      filter.fromDate = { $gte: from };
    } else if (to) {
      filter.toDate = { $lte: to };
    }

    const [requests, total] = await Promise.all([
      populateLeaveQuery(
        LeaveRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
      ).lean({ getters: true }),
      LeaveRequest.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      message: "All leave requests retrieved successfully.",
    });
  } catch (error) {
    console.error("getAllLeaveRequests error:", error);
    res.status(500).json({
      success: false,
      error: "An error occurred while retrieving leave requests.",
    });
  }
};

// Resolve a leave request and capture provost feedback.
const resolveLeaveRequest = async (req, res) => {
  try {
    const resolvedBy = req.user?.id;
    if (!resolvedBy) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { requestId } = req.params;
    const { status, provostComments } = req.body || {};

    if (!requestId || !isValidObjectId(requestId)) {
      return res.status(400).json({ success: false, error: "A valid request ID is required." });
    }

    const normalizedStatus = sanitizeText(status).toLowerCase();
    if (!LEAVE_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status. Must be one of: pending, approved, rejected.",
      });
    }

    const sanitizedComments = sanitizeText(provostComments);

    const updateOperation = {
      $set: {
        status: normalizedStatus,
        provostComments: sanitizedComments,
      },
    };

    if (normalizedStatus !== "pending") {
      updateOperation.$set.resolvedBy = resolvedBy;
      updateOperation.$set.resolvedAt = new Date();
    } else {
      updateOperation.$unset = { resolvedBy: "", resolvedAt: "" };
    }

    const updatedRequest = await populateLeaveQuery(
      LeaveRequest.findByIdAndUpdate(requestId, updateOperation, {
        new: true,
        runValidators: true,
      })
    ).lean({ getters: true });

    if (!updatedRequest) {
      return res.status(404).json({ success: false, error: "Leave request not found." });
    }

    res.status(200).json({
      success: true,
      data: updatedRequest,
      message: `Leave request ${normalizedStatus} successfully.`,
    });
  } catch (error) {
    console.error("resolveLeaveRequest error:", error);
    res.status(500).json({
      success: false,
      error: "An error occurred while resolving the leave request.",
    });
  }
};

module.exports = { submitLeaveRequest, getLeaveRequests, getAllLeaveRequests, resolveLeaveRequest };
