const express = require("express");

const {
  upload,
  createNotice,
  getAllNotices,
  getPublishedNotices,
  getNoticeById,
  updateNotice,
  deleteNotice,
  publishNotice,
} = require("../controllers/publicNoticeController");
const { auth, isProvostOrChief } = require("../middleware/auth");

const router = express.Router();

router.get("/published", getPublishedNotices);
router.get("/public/:id", getNoticeById);

router.use(auth, isProvostOrChief);

router.post("/", upload.array("attachments", 5), createNotice);
router.get("/", getAllNotices);
router.get("/:id", getNoticeById);
router.put("/:id", upload.array("attachments", 5), updateNotice);
router.delete("/:id", deleteNotice);
router.patch("/:id/publish", publishNotice);

module.exports = router;
