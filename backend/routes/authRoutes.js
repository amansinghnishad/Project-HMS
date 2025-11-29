const express = require("express");

const {
  sendOTP,
  verifyOtp,
  checkHostelEligibility,
  emailVerification,
  login,
  provostLogin,
  chiefProvostLogin,
  checkEmail,
  verificationStatus,
  createOrUpdateRegisteredStudentProfile,
  getAllRegisteredStudentProfiles,
  logout,
  sendResetPasswordOTP,
  verifyResetPasswordOTP,
  resetPassword,
} = require("../controllers/Auth");
const { auth, isProvostOrChief } = require("../middleware/auth");

const router = express.Router();

// =======================
// Student Routes
// =======================

// Request an OTP for new student registrations.
router.post("/send-otp", sendOTP);

// Validate the OTP issued during registration.
router.post("/verify-otp", verifyOtp);

// Check availability of an email prior to registration.
router.post("/check-email", checkEmail);

// Inspect the verification status for a given email.
router.post("/verification-status", verificationStatus);

// Determine eligibility based on academic records.
router.post("/check-eligibility", checkHostelEligibility);

// Confirm OTP prior to collecting profile details.
router.post("/email-verification", emailVerification);

// Persist or update the student registration profile.
router.post("/registered-student-profile", createOrUpdateRegisteredStudentProfile);

// Student authentication after room allotment.
router.post("/login", login);

// Provost authentication via env-configured credentials.
router.post("/login-provost", provostLogin);

// Chief provost authentication via env-configured credentials.
router.post("/login-chief-provost", chiefProvostLogin);

// Retrieve registered students for provost dashboards.
router.get("/registered-students", auth, isProvostOrChief, getAllRegisteredStudentProfiles);

// Terminate the current session by invalidating the client token.
router.post("/logout", auth, logout);

// =======================
// Reset Password Routes (Students Only)
// =======================

router.post("/send-reset-password-otp", sendResetPasswordOTP);
router.post("/verify-reset-password-otp", verifyResetPasswordOTP);
router.post("/reset-password", resetPassword);

module.exports = router;
