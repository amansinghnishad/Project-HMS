const express = require("express");

const {
  submitMaintenanceRequest,
  getUserMaintenanceRequests,
  getAllMaintenanceRequests,
  resolveMaintenanceRequest,
} = require("../controllers/maintenanceController");
const { auth, isProvostOrChief } = require("../middleware/auth");

const router = express.Router();

router.post("/", auth, submitMaintenanceRequest);
router.get("/my", auth, getUserMaintenanceRequests);
router.get("/all", auth, isProvostOrChief, getAllMaintenanceRequests);
router.put("/resolve/:requestId", auth, isProvostOrChief, resolveMaintenanceRequest);

module.exports = router;
