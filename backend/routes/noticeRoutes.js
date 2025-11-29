const express = require("express");

const {
  sendNotice,
  getSentNotices,
  getReceivedNotices,
  markNoticeAsRead,
  getNoticeStats,
  getAllNotices,
} = require("../controllers/noticeController");
const { auth, isStudent, isProvostOrChief } = require("../middleware/auth");
const validateNotice = require("../middleware/validateNotice");

const router = express.Router();

router.post("/send", auth, isProvostOrChief, validateNotice, sendNotice);
router.get("/sent", auth, isProvostOrChief, getSentNotices);
router.get("/stats", auth, isProvostOrChief, getNoticeStats);
router.get("/all", auth, isProvostOrChief, getAllNotices);

router.get("/received", auth, isStudent, getReceivedNotices);
router.patch("/:noticeId/read", auth, isStudent, markNoticeAsRead);

module.exports = router;
