const mongoose = require("mongoose");

const NOTICE_TYPES = [
  "Behavioral Warning",
  "Academic Warning",
  "Disciplinary Action",
  "General Notice",
  "Room Inspection",
  "Fee Notice",
];

const MAX_SUBJECT_LENGTH = 150;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_ACTION_LENGTH = 500;

const normalizeString = (value) => (typeof value === "string" ? value.trim() : "");

const validateNotice = (req, res, next) => {
  const recipientId = normalizeString(req.body.recipientId);
  const noticeType = normalizeString(req.body.noticeType);
  const subject = normalizeString(req.body.subject);
  const message = normalizeString(req.body.message);
  const actionRequired = normalizeString(req.body.actionRequired);
  const isUrgent = req.body.isUrgent;

  if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId)) {
    return res.status(400).json({ error: "Valid recipientId is required." });
  }

  if (!noticeType || !NOTICE_TYPES.includes(noticeType)) {
    return res.status(400).json({ error: `Invalid notice type. Allowed values: ${NOTICE_TYPES.join(", ")}.` });
  }

  if (!subject) {
    return res.status(400).json({ error: "Subject is required." });
  }

  if (subject.length > MAX_SUBJECT_LENGTH) {
    return res.status(400).json({ error: `Subject must be under ${MAX_SUBJECT_LENGTH} characters.` });
  }

  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: `Message must be under ${MAX_MESSAGE_LENGTH} characters.` });
  }

  if (actionRequired && actionRequired.length > MAX_ACTION_LENGTH) {
    return res.status(400).json({ error: `Action required text must be under ${MAX_ACTION_LENGTH} characters.` });
  }

  if (typeof isUrgent !== "undefined" && typeof isUrgent !== "boolean") {
    return res.status(400).json({ error: "isUrgent must be a boolean if provided." });
  }

  req.body.recipientId = recipientId;
  req.body.noticeType = noticeType;
  req.body.subject = subject;
  req.body.message = message;
  req.body.actionRequired = actionRequired || undefined;

  return next();
};

module.exports = validateNotice;
