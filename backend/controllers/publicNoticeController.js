const fs = require("fs");
const path = require("path");
const multer = require("multer");
const puppeteer = require("puppeteer");
const mongoose = require("mongoose");
const PublicNotice = require("../models/PublicNotice");
const User = require("../models/User");

const { isValidObjectId } = mongoose;

const NOTICE_STATUSES = Object.freeze(["draft", "published", "archived"]);
const NOTICE_CATEGORIES = Object.freeze([
  "Academic",
  "Administrative",
  "Events",
  "Facilities",
  "Emergency",
  "General",
]);
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 200;
const NOTICE_UPLOAD_ROOT = path.join(__dirname, "../uploads/notices");
const NOTICE_PDF_DIR = path.join(NOTICE_UPLOAD_ROOT, "pdfs");

const ensureDirectory = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

ensureDirectory(NOTICE_UPLOAD_ROOT);
ensureDirectory(NOTICE_PDF_DIR);

const sanitizeText = (value) => (typeof value === "string" ? value.trim() : "");

const normalizeBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes"].includes(normalized)) return true;
    if (["false", "0", "no"].includes(normalized)) return false;
  }
  return fallback;
};

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parsePositiveInt = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

const validateNoticeStatus = (status) =>
  NOTICE_STATUSES.includes(status) ? status : null;

const validateNoticeCategory = (category) =>
  NOTICE_CATEGORIES.includes(category) ? category : null;

const buildPagination = ({ page, limit, total }) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit) || 1,
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureDirectory(NOTICE_UPLOAD_ROOT);
    cb(null, NOTICE_UPLOAD_ROOT);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf" || file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF and image files are allowed."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const removeFileIfExists = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("File removal failed:", error);
  }
};

// Generates and stores a nicely formatted PDF for a notice.
const generateNoticePDF = async (notice) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Public Notice</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #0d7377; padding-bottom: 20px; margin-bottom: 30px; }
          .title { color: #0d7377; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
          .category { background: #0d7377; color: #fff; padding: 5px 15px; border-radius: 20px; font-size: 12px; display: inline-block; }
          .important { background: #dc3545; color: #fff; padding: 5px 15px; border-radius: 20px; font-size: 12px; display: inline-block; margin-left: 10px; }
          .content { margin: 30px 0; line-height: 1.8; white-space: pre-wrap; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>HOSTEL MANAGEMENT SYSTEM</h1>
          <p>Public Notice</p>
        </div>
        <div class="title">${notice.title}</div>
        <div class="meta">
          <span class="category">${notice.category}</span>
          ${notice.isImportant ? '<span class="important">IMPORTANT</span>' : ""}
          <br /><br />
          <strong>Effective Date:</strong> ${new Date(notice.effectiveDate).toLocaleDateString()}<br />
          ${notice.expiryDate ? `<strong>Expiry Date:</strong> ${new Date(notice.expiryDate).toLocaleDateString()}<br />` : ""}
          <strong>Published:</strong> ${new Date(notice.publishedAt || notice.createdAt).toLocaleDateString()}
        </div>
        <div class="content">${notice.content.replace(/\n/g, "<br />")}</div>
        <div class="footer">
          <p>This is an official notice from the Hostel Management System.</p>
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: "networkidle0" });

    const fileName = `notice-${notice._id}-${Date.now()}.pdf`;
    const fullPath = path.join(NOTICE_PDF_DIR, fileName);
    await page.pdf({
      path: fullPath,
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", right: "20mm", bottom: "20mm", left: "20mm" },
    });

    return `uploads/notices/pdfs/${fileName}`;
  } catch (error) {
    console.error("generateNoticePDF error:", error);
    throw new Error("Failed to generate notice PDF.");
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

const populateAuthor = (query) => query.populate("author", "firstName lastName email role");

const attachmentFromFile = (file) => ({
  filename: file.filename,
  originalName: file.originalname,
  path: file.path,
  size: file.size,
  mimetype: file.mimetype,
});

const appendAttachments = (existing = [], files = []) => existing.concat(files.map(attachmentFromFile));

const validateAuthor = (notice, userId) => notice.author.toString() === userId;

const normalizeAndValidateNoticePayload = ({
  title,
  content,
  category,
  effectiveDate,
  expiryDate,
  isImportant,
  status,
}) => {
  const normalized = {
    title: sanitizeText(title),
    content: sanitizeText(content),
    category: sanitizeText(category),
    effectiveDate: parseDate(effectiveDate),
    expiryDate: parseDate(expiryDate),
    isImportant: normalizeBoolean(isImportant, false),
    status: sanitizeText(status) || "draft",
  };

  if (!normalized.title || !normalized.content) {
    return { error: "Title and content are required." };
  }

  if (!validateNoticeCategory(normalized.category)) {
    return { error: "Invalid notice category provided." };
  }

  if (!normalized.effectiveDate) {
    return { error: "A valid effective date is required." };
  }

  if (!validateNoticeStatus(normalized.status)) {
    return { error: "Invalid notice status provided." };
  }

  if (normalized.expiryDate && normalized.expiryDate < normalized.effectiveDate) {
    return { error: "Expiry date cannot be before the effective date." };
  }

  return { payload: normalized };
};

const buildNoticeFilter = ({ status, category, search }) => {
  const filter = {};

  const normalizedStatus = sanitizeText(status);
  if (normalizedStatus) {
    if (!validateNoticeStatus(normalizedStatus)) {
      return { error: "Invalid status filter provided." };
    }
    filter.status = normalizedStatus;
  }

  const normalizedCategory = sanitizeText(category);
  if (normalizedCategory) {
    if (!validateNoticeCategory(normalizedCategory)) {
      return { error: "Invalid category filter provided." };
    }
    filter.category = normalizedCategory;
  }

  const searchTerm = sanitizeText(search);
  if (searchTerm) {
    filter.$or = [
      { title: { $regex: searchTerm, $options: "i" } },
      { content: { $regex: searchTerm, $options: "i" } },
    ];
  }

  return { filter };
};

const handlePdfGeneration = async (notice) => {
  try {
    const pdfPath = await generateNoticePDF(notice);
    notice.pdfPath = pdfPath;
    await notice.save();
  } catch (pdfError) {
    console.error("Notice PDF generation failed:", pdfError);
  }
};

const removeNoticeFiles = (notice) => {
  (notice.attachments || []).forEach((attachment) => removeFileIfExists(attachment.path));
  if (notice.pdfPath) {
    removeFileIfExists(path.join(__dirname, "..", notice.pdfPath));
  }
};

// Creates a new public notice entry.
const createNotice = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    const validation = normalizeAndValidateNoticePayload(req.body || {});
    if (validation.error) {
      return res.status(400).json({ success: false, message: validation.error });
    }

    const author = await User.findById(userId);
    if (!author) {
      return res.status(404).json({ success: false, message: "Author profile not found." });
    }

    const notice = await PublicNotice.create({
      ...validation.payload,
      author: userId,
      attachments: appendAttachments([], req.files || []),
    });

    if (notice.status === "published") {
      await handlePdfGeneration(notice);
    }

    await populateAuthor(notice.populate("author"));

    res.status(201).json({
      success: true,
      message: "Notice created successfully.",
      notice,
    });
  } catch (error) {
    console.error("createNotice error:", error);
    res.status(500).json({ success: false, message: "Failed to create notice." });
  }
};

// Lists all notices with optional filters and pagination.
const getAllNotices = async (req, res) => {
  try {
    const page = parsePositiveInt(req.query?.page, 1);
    const limit = Math.min(parsePositiveInt(req.query?.limit, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
    const skip = (page - 1) * limit;

    const { filter, error } = buildNoticeFilter({
      status: req.query?.status,
      category: req.query?.category,
      search: req.query?.search,
    });

    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const [notices, total] = await Promise.all([
      populateAuthor(
        PublicNotice.find(filter).sort({ publishedAt: -1, createdAt: -1 }).skip(skip).limit(limit)
      ).lean({ getters: true }),
      PublicNotice.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      notices,
      pagination: buildPagination({ page, limit, total }),
    });
  } catch (error) {
    console.error("getAllNotices error:", error);
    res.status(500).json({ success: false, message: "Failed to retrieve notices." });
  }
};

// Lists published notices for public consumption.
const getPublishedNotices = async (req, res) => {
  try {
    const page = parsePositiveInt(req.query?.page, 1);
    const limit = Math.min(parsePositiveInt(req.query?.limit, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
    const skip = (page - 1) * limit;

    const normalizedCategory = sanitizeText(req.query?.category);
    const activeOnly = normalizeBoolean(req.query?.activeOnly, false);

    if (normalizedCategory && !validateNoticeCategory(normalizedCategory)) {
      return res.status(400).json({ success: false, message: "Invalid category filter provided." });
    }

    const filter = { status: "published" };
    if (normalizedCategory) {
      filter.category = normalizedCategory;
    }

    if (activeOnly) {
      const now = new Date();
      filter.effectiveDate = { $lte: now };
      filter.$or = [
        { expiryDate: { $exists: false } },
        { expiryDate: null },
        { expiryDate: { $gte: now } },
      ];
    }

    const [notices, total] = await Promise.all([
      populateAuthor(
        PublicNotice.find(filter).sort({ isImportant: -1, publishedAt: -1 }).skip(skip).limit(limit)
      ).lean({ getters: true }),
      PublicNotice.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      notices,
      pagination: buildPagination({ page, limit, total }),
    });
  } catch (error) {
    console.error("getPublishedNotices error:", error);
    res.status(500).json({ success: false, message: "Failed to retrieve published notices." });
  }
};

// Retrieves a single notice by id and tracks views.
const getNoticeById = async (req, res) => {
  try {
    const noticeId = req.params?.id;
    if (!isValidObjectId(noticeId)) {
      return res.status(400).json({ success: false, message: "Invalid notice id provided." });
    }

    const notice = await populateAuthor(PublicNotice.findById(noticeId));
    if (!notice) {
      return res.status(404).json({ success: false, message: "Notice not found." });
    }

    if (notice.status === "published") {
      notice.views += 1;
      await notice.save();
    }

    res.status(200).json({ success: true, notice });
  } catch (error) {
    console.error("getNoticeById error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch notice." });
  }
};

// Updates an existing notice owned by the requester.
const updateNotice = async (req, res) => {
  try {
    const noticeId = req.params?.id;
    if (!isValidObjectId(noticeId)) {
      return res.status(400).json({ success: false, message: "Invalid notice id provided." });
    }

    const notice = await PublicNotice.findById(noticeId);
    if (!notice) {
      return res.status(404).json({ success: false, message: "Notice not found." });
    }

    if (!validateAuthor(notice, req.user?.id)) {
      return res.status(403).json({ success: false, message: "Not authorized to update this notice." });
    }

    const validation = normalizeAndValidateNoticePayload({ ...notice.toObject(), ...req.body });
    if (validation.error) {
      return res.status(400).json({ success: false, message: validation.error });
    }

    Object.assign(notice, validation.payload);
    notice.attachments = appendAttachments(notice.attachments, req.files || []);
    await notice.save();

    if (notice.status === "published") {
      await handlePdfGeneration(notice);
    }

    await populateAuthor(notice.populate("author"));

    res.status(200).json({
      success: true,
      message: "Notice updated successfully.",
      notice,
    });
  } catch (error) {
    console.error("updateNotice error:", error);
    res.status(500).json({ success: false, message: "Failed to update notice." });
  }
};

// Deletes a notice and associated files.
const deleteNotice = async (req, res) => {
  try {
    const noticeId = req.params?.id;
    if (!isValidObjectId(noticeId)) {
      return res.status(400).json({ success: false, message: "Invalid notice id provided." });
    }

    const notice = await PublicNotice.findById(noticeId);
    if (!notice) {
      return res.status(404).json({ success: false, message: "Notice not found." });
    }

    if (!validateAuthor(notice, req.user?.id)) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this notice." });
    }

    removeNoticeFiles(notice);
    await PublicNotice.findByIdAndDelete(noticeId);

    res.status(200).json({ success: true, message: "Notice deleted successfully." });
  } catch (error) {
    console.error("deleteNotice error:", error);
    res.status(500).json({ success: false, message: "Failed to delete notice." });
  }
};

// Publishes a draft notice owned by the requester.
const publishNotice = async (req, res) => {
  try {
    const noticeId = req.params?.id;
    if (!isValidObjectId(noticeId)) {
      return res.status(400).json({ success: false, message: "Invalid notice id provided." });
    }

    const notice = await PublicNotice.findById(noticeId);
    if (!notice) {
      return res.status(404).json({ success: false, message: "Notice not found." });
    }

    if (!validateAuthor(notice, req.user?.id)) {
      return res.status(403).json({ success: false, message: "Not authorized to publish this notice." });
    }

    notice.status = "published";
    notice.publishedAt = new Date();
    await notice.save();

    await handlePdfGeneration(notice);
    await populateAuthor(notice.populate("author"));

    res.status(200).json({
      success: true,
      message: "Notice published successfully.",
      notice,
    });
  } catch (error) {
    console.error("publishNotice error:", error);
    res.status(500).json({ success: false, message: "Failed to publish notice." });
  }
};

module.exports = {
  upload,
  createNotice,
  getAllNotices,
  getPublishedNotices,
  getNoticeById,
  updateNotice,
  deleteNotice,
  publishNotice,
};