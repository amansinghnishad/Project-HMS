const FEEDBACK_TYPES = [
  "Cleanliness",
  "Food",
  "Infrastructure",
  "Staff",
  "Other",
];

const MAX_SUBJECT_LENGTH = 120;
const MAX_MESSAGE_LENGTH = 2000;

const normalizeString = (value) => (typeof value === "string" ? value.trim() : "");

const validateFeedback = (req, res, next) => {
  const rawFeedbackType = normalizeString(req.body.feedbackType);
  const rawCustomSubject = normalizeString(req.body.customSubject);
  const rawMessage = normalizeString(req.body.message);

  if (!rawFeedbackType || !rawMessage) {
    return res.status(400).json({ error: "Feedback type and message are required." });
  }

  if (!FEEDBACK_TYPES.includes(rawFeedbackType)) {
    return res.status(400).json({ error: `Invalid feedback type. Allowed types: ${FEEDBACK_TYPES.join(", ")}.` });
  }

  if (rawFeedbackType === "Other" && !rawCustomSubject) {
    return res.status(400).json({ error: "Custom subject is required for 'Other' feedback type." });
  }

  if (rawCustomSubject.length > MAX_SUBJECT_LENGTH) {
    return res.status(400).json({ error: `Subject must be under ${MAX_SUBJECT_LENGTH} characters.` });
  }

  if (rawMessage.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: `Message must be under ${MAX_MESSAGE_LENGTH} characters.` });
  }

  req.body.feedbackType = rawFeedbackType;
  req.body.customSubject = rawCustomSubject || undefined;
  req.body.message = rawMessage;

  return next();
};

module.exports = validateFeedback;
