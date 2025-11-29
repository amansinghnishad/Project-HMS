const { isValidObjectId } = require("mongoose");
const MaintenanceRequest = require("../models/MaintenanceRequest");

const MAINTENANCE_STATUSES = Object.freeze(["pending", "in-progress", "completed"]);
const MAINTENANCE_PRIORITIES = Object.freeze(["low", "medium", "high"]);
const MAINTENANCE_TYPES = Object.freeze([
  "plumbing",
  "electrical",
  "furniture",
  "cleaning",
  "ac_cooling",
  "network",
  "security",
  "others",
]);
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

const populateMaintenanceQuery = (query) =>
  query.populate(userPopulationConfig).populate(resolvedByPopulationConfig);

const sanitizeText = (value) => (typeof value === "string" ? value.trim() : "");

const parsePositiveInt = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

// Submit a maintenance request.
const submitMaintenanceRequest = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { requestType, description, priority, photo } = req.body || {};

    const normalizedType = sanitizeText(requestType).toLowerCase();
    const normalizedDescription = sanitizeText(description);
    const normalizedPriority = sanitizeText(priority).toLowerCase() || "medium";
    const sanitizedPhoto = sanitizeText(photo) || null;

    if (!normalizedType || !normalizedDescription) {
      return res.status(400).json({
        success: false,
        error: "Request type and description are required.",
      });
    }

    if (!MAINTENANCE_TYPES.includes(normalizedType)) {
      return res.status(400).json({ success: false, error: "Invalid maintenance request type provided." });
    }

    if (!MAINTENANCE_PRIORITIES.includes(normalizedPriority)) {
      return res.status(400).json({ success: false, error: "Invalid maintenance priority provided." });
    }

    const maintenanceRequest = await MaintenanceRequest.create({
      userId,
      requestType: normalizedType,
      description: normalizedDescription,
      priority: normalizedPriority,
      photo: sanitizedPhoto,
      status: "pending",
    });

    await maintenanceRequest.populate([userPopulationConfig, resolvedByPopulationConfig]);

    res.status(201).json({
      success: true,
      data: maintenanceRequest,
      message: "Maintenance request submitted successfully.",
    });
  } catch (error) {
    console.error("submitMaintenanceRequest error:", error);
    res.status(500).json({
      success: false,
      error: "An error occurred while submitting the maintenance request.",
    });
  }
};

// List maintenance requests for the authenticated user.
const getUserMaintenanceRequests = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const statusFilter = sanitizeText(req.query?.status).toLowerCase();
    const priorityFilter = sanitizeText(req.query?.priority).toLowerCase();
    const typeFilter = sanitizeText(req.query?.requestType).toLowerCase();
    const page = parsePositiveInt(req.query?.page, 1);
    const limit = Math.min(parsePositiveInt(req.query?.limit, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
    const skip = (page - 1) * limit;

    const filter = { userId };
    if (statusFilter) {
      if (!MAINTENANCE_STATUSES.includes(statusFilter)) {
        return res.status(400).json({ success: false, error: "Invalid status filter provided." });
      }
      filter.status = statusFilter;
    }
    if (priorityFilter) {
      if (!MAINTENANCE_PRIORITIES.includes(priorityFilter)) {
        return res.status(400).json({ success: false, error: "Invalid priority filter provided." });
      }
      filter.priority = priorityFilter;
    }
    if (typeFilter) {
      if (!MAINTENANCE_TYPES.includes(typeFilter)) {
        return res.status(400).json({ success: false, error: "Invalid request type filter provided." });
      }
      filter.requestType = typeFilter;
    }

    const [requests, total] = await Promise.all([
      populateMaintenanceQuery(
        MaintenanceRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
      ).lean({ getters: true }),
      MaintenanceRequest.countDocuments(filter),
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
      message: "Maintenance requests retrieved successfully.",
    });
  } catch (error) {
    console.error("getUserMaintenanceRequests error:", error);
    res.status(500).json({
      success: false,
      error: "An error occurred while retrieving maintenance requests.",
    });
  }
};

// List maintenance requests for administrative review.
const getAllMaintenanceRequests = async (req, res) => {
  try {
    const statusFilter = sanitizeText(req.query?.status).toLowerCase();
    const priorityFilter = sanitizeText(req.query?.priority).toLowerCase();
    const typeFilter = sanitizeText(req.query?.requestType).toLowerCase();
    const page = parsePositiveInt(req.query?.page, 1);
    const limit = Math.min(parsePositiveInt(req.query?.limit, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
    const skip = (page - 1) * limit;

    const filter = {};
    if (statusFilter) {
      if (!MAINTENANCE_STATUSES.includes(statusFilter)) {
        return res.status(400).json({ success: false, error: "Invalid status filter provided." });
      }
      filter.status = statusFilter;
    }
    if (priorityFilter) {
      if (!MAINTENANCE_PRIORITIES.includes(priorityFilter)) {
        return res.status(400).json({ success: false, error: "Invalid priority filter provided." });
      }
      filter.priority = priorityFilter;
    }
    if (typeFilter) {
      if (!MAINTENANCE_TYPES.includes(typeFilter)) {
        return res.status(400).json({ success: false, error: "Invalid request type filter provided." });
      }
      filter.requestType = typeFilter;
    }

    const [requests, total] = await Promise.all([
      populateMaintenanceQuery(
        MaintenanceRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
      ).lean({ getters: true }),
      MaintenanceRequest.countDocuments(filter),
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
      message: "All maintenance requests retrieved successfully.",
    });
  } catch (error) {
    console.error("getAllMaintenanceRequests error:", error);
    res.status(500).json({
      success: false,
      error: "An error occurred while retrieving all maintenance requests.",
    });
  }
};

// Resolve a maintenance request.
const resolveMaintenanceRequest = async (req, res) => {
  try {
    const resolvedBy = req.user?.id;
    if (!resolvedBy) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { requestId } = req.params;
    const { status, resolution, completionPhoto } = req.body || {};

    if (!requestId || !isValidObjectId(requestId)) {
      return res.status(400).json({ success: false, error: "A valid request ID is required." });
    }

    const normalizedStatus = sanitizeText(status).toLowerCase();
    if (!MAINTENANCE_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status. Must be one of: pending, in-progress, completed.",
      });
    }

    const sanitizedResolution = sanitizeText(resolution);
    const sanitizedCompletionPhoto = sanitizeText(completionPhoto) || null;

    const updateOperation = {
      $set: {
        status: normalizedStatus,
        updatedAt: new Date(),
      },
    };

    if (sanitizedResolution) {
      updateOperation.$set.resolution = sanitizedResolution;
    } else {
      updateOperation.$unset = updateOperation.$unset || {};
      updateOperation.$unset.resolution = "";
    }

    if (sanitizedCompletionPhoto) {
      updateOperation.$set.completionPhoto = sanitizedCompletionPhoto;
    } else {
      updateOperation.$unset = updateOperation.$unset || {};
      updateOperation.$unset.completionPhoto = "";
    }

    if (normalizedStatus === "completed") {
      updateOperation.$set.resolvedBy = resolvedBy;
      updateOperation.$set.resolvedAt = new Date();
    } else {
      updateOperation.$unset = updateOperation.$unset || {};
      updateOperation.$unset.resolvedBy = "";
      updateOperation.$unset.resolvedAt = "";
    }

    const updatedRequest = await populateMaintenanceQuery(
      MaintenanceRequest.findByIdAndUpdate(requestId, updateOperation, {
        new: true,
        runValidators: true,
      })
    ).lean({ getters: true });

    if (!updatedRequest) {
      return res.status(404).json({ success: false, error: "Maintenance request not found." });
    }

    res.status(200).json({
      success: true,
      data: updatedRequest,
      message: `Maintenance request ${normalizedStatus === "completed" ? "resolved" : "updated"} successfully.`,
    });
  } catch (error) {
    console.error("resolveMaintenanceRequest error:", error);
    res.status(500).json({
      success: false,
      error: "An error occurred while resolving the maintenance request.",
    });
  }
};

module.exports = {
  submitMaintenanceRequest,
  getUserMaintenanceRequests,
  getAllMaintenanceRequests,
  resolveMaintenanceRequest,
};
