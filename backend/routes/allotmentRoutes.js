const express = require("express");

const { allotRooms, getRoomAvailability, getAllAllottedStudents } = require("../controllers/allotmentController");
const { auth, isProvost } = require("../middleware/auth");

const router = express.Router();
// conly for Provost
router.post("/allot-rooms", auth, isProvost, allotRooms);

router.get("/availability", auth, isProvost, getRoomAvailability);

router.get("/allotted-students", auth, isProvost, getAllAllottedStudents);

module.exports = router;
