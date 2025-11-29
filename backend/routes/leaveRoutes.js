const express = require("express");

const {
  submitLeaveRequest,
  getLeaveRequests,
  getAllLeaveRequests,
  resolveLeaveRequest,
} = require("../controllers/leaveController");
const { auth, isProvostOrChief } = require("../middleware/auth");

const router = express.Router();

router.post("/submit", auth, submitLeaveRequest);
router.get("/", auth, getLeaveRequests);
router.get("/all", auth, isProvostOrChief, getAllLeaveRequests);
router.put("/resolve/:requestId", auth, isProvostOrChief, resolveLeaveRequest);

module.exports = router;
