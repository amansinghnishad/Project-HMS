const express = require("express");

const {
  submitFeedback,
  getFeedback,
  getAllFeedback,
  resolveFeedback,
} = require("../controllers/feedbackController");
const validateFeedback = require("../middleware/validateFeedback");
const { auth, isProvostOrChief } = require("../middleware/auth");

const router = express.Router();

router.post("/submit", auth, validateFeedback, submitFeedback);

router.get("/", auth, getFeedback);

router.get("/all", auth, isProvostOrChief, getAllFeedback);

router.put("/resolve/:feedbackId", auth, isProvostOrChief, resolveFeedback);

module.exports = router;
