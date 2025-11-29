const User = require("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {
  fetchCombinedResults,
} = require("../utils/fetchResult");
const RegisteredStudentProfile = require("../models/RegisteredStudentProfile");
const AllottedStudent = require("../models/AllottedStudent"); // Added AllottedStudent model

require("dotenv").config();

const OTP_LENGTH = Number(process.env.OTP_LENGTH || 6);
const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 15);
const OTP_GENERATION_ATTEMPTS = Number(process.env.OTP_GENERATION_ATTEMPTS || 10);
const PASSWORD_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

const shouldExposeOtp = () => process.env.NODE_ENV !== "production";

const generateOtpCandidate = () =>
  otpGenerator.generate(OTP_LENGTH, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });

const generateUniqueOtp = async () => {
  for (let attempt = 0; attempt < OTP_GENERATION_ATTEMPTS; attempt += 1) {
    const candidate = generateOtpCandidate();
    const existing = await OTP.findOne({ otp: candidate }).lean();
    if (!existing) {
      return candidate;
    }
  }
  throw new Error("Unable to generate unique OTP");
};

const createOtpRecord = async (email) => {
  const otp = await generateUniqueOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  const record = await OTP.create({ email, otp, expiresAt });
  return { otp, expiresAt: record.expiresAt };
};

const fetchLatestOtp = async (email) =>
  OTP.findOne({ email }).sort({ createdAt: -1 }).lean();

const isOtpValid = (storedOtp, providedOtp) => {
  if (!storedOtp) return false;
  if (storedOtp.expiresAt < new Date()) return false;
  return String(storedOtp.otp) === String(providedOtp);
};

const maybeIncludeOtp = (payload, otpData) => {
  if (shouldExposeOtp() && otpData) {
    payload.otp = otpData.otp;
  }
  if (otpData?.expiresAt) {
    payload.expiresAt = otpData.expiresAt;
  }
  return payload;
};

const issueToken = (user, expiresIn = "7d") =>
  jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
    expiresIn,
  });

const resolveDisplayName = (user) => {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  return user.name || "User";
};

const normalizeEmail = (email) => (typeof email === "string" ? email.trim().toLowerCase() : "");

const loginPrivilegedUser = async ({
  requestEmail,
  requestPassword,
  envEmail,
  envPasswordHash,
  role,
  defaultName,
  successMessage,
}) => {
  if (!envEmail || !envPasswordHash) {
    throw new Error(`Environment credentials missing for role: ${role}`);
  }

  if (requestEmail !== envEmail) {
    return { status: 401, body: { success: false, message: `Invalid ${role} email.` } };
  }

  const passwordValid = await bcrypt.compare(requestPassword, envPasswordHash);
  if (!passwordValid) {
    return { status: 401, body: { success: false, message: `Invalid ${role} password.` } };
  }

  let user = await User.findOne({ email: envEmail });
  if (!user) {
    user = await User.create({ email: envEmail, role, name: defaultName });
  }

  const token = issueToken(user, "24h");

  return {
    status: 200,
    body: {
      success: true,
      message: successMessage,
      token,
      role,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    },
  };
};

// Handles OTP generation for new registrations.
exports.sendOTP = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const existingUser = await User.findOne({ email }).select("_id").lean();
    if (existingUser) {
      return res.status(409).json({ success: false, message: "User is already registered." });
    }

    const otpData = await createOtpRecord(email);

    // TODO: integrate actual mail/SMS delivery here.

    return res.status(200).json(
      maybeIncludeOtp(
        {
          success: true,
          message: "OTP sent successfully.",
        },
        otpData
      )
    );
  } catch (error) {
    console.error("sendOTP error", error);
    return res.status(500).json({ success: false, message: "Failed to send OTP." });
  }
};
// ************************************************************************************************

// Confirms a registration OTP against the latest record.
exports.verifyOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = req.body.otp;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required." });
    }

    const latestOtp = await fetchLatestOtp(email);
    if (!isOtpValid(latestOtp, otp)) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP." });
    }

    return res.status(200).json({ success: true, message: "OTP verified successfully." });
  } catch (error) {
    console.error("verifyOtp error", error);
    return res.status(500).json({ success: false, message: "Server error while verifying OTP." });
  }
};

// ************************************************************************************************

// Aggregates academic data to determine hostel eligibility.
exports.checkHostelEligibility = async (req, res) => {
  try {
    const data = req.body;
    const combinedResults = await fetchCombinedResults(data);

    if (combinedResults.status === "error") {
      return res.status(400).json({ success: false, message: combinedResults.message });
    }

    return res.status(200).json({
      success: true,
      data: combinedResults,
    });
  } catch (error) {
    console.error("Eligibility check error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while checking eligibility.",
    });
  }
};

// ************************************************************************************************

// Validates OTP before allowing profile completion.
exports.emailVerification = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password, confirmPassword, otp } = req.body;

    if (!email || !password || !confirmPassword || !otp) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing: email, password, confirmPassword, and otp are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    const latestOtp = await fetchLatestOtp(email);
    if (!isOtpValid(latestOtp, otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP. Please request a new one.",
      });
    }

    await OTP.deleteMany({ email });

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully. Please complete your profile details.",
    });

  } catch (error) {
    console.error("Email Verification Error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during OTP verification. Please try again later.",
      error: error.message,
    });
  }
};

// ************************************************************************************************

// Authenticates student users and enforces room allotment.
exports.login = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "User is not registered." });
    }

    if (user.role !== "student") {
      return res.status(403).json({ success: false, message: "Access denied. Not a student account." });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ success: false, message: "Incorrect password." });
    }

    // Check if the student has been allotted a room
    const allotmentRecord = await AllottedStudent.findOne({ userId: user._id }).lean();
    if (!allotmentRecord) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You have not been allotted a room yet. Please complete the allotment process.",
      });
    }

    const token = issueToken(user);
    const userName = resolveDisplayName(user);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: userName,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("login error", error);
    return res.status(500).json({
      success: false,
      message: "Login failed due to server error.",
      error: error.message,
    });
  }
};

// ************************************************************************************************

// Authenticates provosts against environment-defined credentials.
exports.provostLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await loginPrivilegedUser({
      requestEmail: email,
      requestPassword: password,
      envEmail: process.env.PROVOST_EMAIL,
      envPasswordHash: process.env.PROVOST_PASSWORD_HASH,
      role: "provost",
      defaultName: "Provost",
      successMessage: "Provost logged in successfully.",
    });

    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error("provostLogin error", err);
    return res.status(500).json({
      success: false,
      message: "Server error.",
      error: err.message,
    });
  }
};
// ************************************************************************************************

// Authenticates chief provosts using privileged credentials.
exports.chiefProvostLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await loginPrivilegedUser({
      requestEmail: email,
      requestPassword: password,
      envEmail: process.env.CHIEF_PROVOST_EMAIL,
      envPasswordHash: process.env.CHIEF_PROVOST_PASSWORD_HASH,
      role: "chiefProvost",
      defaultName: "Chief Provost",
      successMessage: "Chief Provost logged in successfully.",
    });

    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error("chiefProvostLogin error", err);
    return res.status(500).json({
      success: false,
      message: "Server error.",
      error: err.message,
    });
  }
};

// ************************************************************************************************

// Checks if an email is already registered.
exports.checkEmail = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email }).select("isVerifiedLU").lean();

    if (user) {
      return res.status(200).json({
        exists: true,
        message: "This email is already registered",
        status: user.isVerifiedLU ? "active" : "pending",
      });
    }

    return res.status(200).json({
      exists: false,
      message: "Email is available for registration",
    });

  } catch (error) {
    console.error("Error in checkEmail:", error);
    return res.status(500).json({
      success: false,
      message: "Error checking email availability",
      error: error.message,
    });
  }
};

// ************************************************************************************************

// Reports the latest OTP verification status for an email.
exports.verificationStatus = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const recentOTP = await fetchLatestOtp(email);

    if (!recentOTP) {
      return res.status(200).json({
        verified: false,
        message: "No verification record found for this email.",
      });
    }

    const isExpired = recentOTP.expiresAt < new Date();

    return res.status(200).json({
      verified: !isExpired,
      message: isExpired
        ? "Verification expired, please request a new OTP"
        : "Verification is valid",
      expiresAt: recentOTP.expiresAt,
    });

  } catch (error) {
    console.error("Error in verificationStatus:", error);
    return res.status(500).json({
      success: false,
      message: "Error checking verification status",
      error: error.message,
    });
  }
};
// ************************************************************************************************

// Creates or updates student registration profiles alongside user records.
exports.createOrUpdateRegisteredStudentProfile = async (req, res) => {
  try {
    const {
      email,
      password,
      studentName, // This should be `name` to match User model if it's the primary name field
      fatherName,
      motherName,
      gender,
      department,
      courseName,
      semester,
      rollno,
      sgpaOdd,
      sgpaEven,
      roomPreference,
      admissionYear,
      contactNumber
    } = req.body;

    const normalizedGender = typeof gender === "string" ? gender.toLowerCase() : undefined;
    const allowedGenders = ["male", "female", "other"];
    const effectiveGender = allowedGenders.includes(normalizedGender) ? normalizedGender : "other";

    const allowedRoomPreferences = ["single", "triple"];
    const normalizedRoomPreference = typeof roomPreference === "string" ? roomPreference.toLowerCase() : "triple";
    const effectiveRoomPreference = allowedRoomPreferences.includes(normalizedRoomPreference) ? normalizedRoomPreference : "triple";

    const normalizedRollNumber = typeof rollno === "string" ? rollno.trim().toUpperCase() : null;
    const parsedSemester = Number(semester);
    const effectiveSemester = Number.isFinite(parsedSemester) && parsedSemester > 0 ? parsedSemester : 0;

    // Basic validation
    if (!email || !password || !studentName || !gender || !contactNumber || !department || !courseName || !semester || !rollno) {
      return res.status(400).json({ success: false, message: "Required fields are missing. Please provide all required details." });
    }

    let user = await User.findOne({ email });

    // Check for existing roll number uniqueness
    if (normalizedRollNumber) {
      const existingProfileWithRollNo = await RegisteredStudentProfile.findOne({ rollNumber: normalizedRollNumber });
      if (existingProfileWithRollNo && (!user || existingProfileWithRollNo.userId.toString() !== user._id.toString())) {
        return res.status(409).json({
          success: false,
          message: `Roll number '${rollno}' is already registered. Please use a different roll number.`,
        });
      }
    }

    // Hashing the password
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
    } catch (hashError) {
      console.error("Password Hashing Error:", hashError);
      return res.status(500).json({
        success: false,
        message: "Error processing password. Please try again.",
      });
    }

    // If user does not exist, create a new user
    if (!user) {
      user = new User({
        name: studentName, // Assuming studentName is the main name for the User model
        email,
        password: hashedPassword,
        role: 'student', // Default role for new registrations via this route
        gender: effectiveGender,
        mobile: contactNumber, // Assuming contactNumber maps to mobile in User model
        isVerifiedLU: true, // Mark as verified since they are completing profile
      });
    } else {
      user.password = hashedPassword;
      user.isVerifiedLU = true;
      user.name = studentName;
      user.gender = effectiveGender;
      user.mobile = contactNumber;
    }
    // Save the user (either new or updated)
    await user.save();

    // Now, create or update the student profile
    let studentProfile = await RegisteredStudentProfile.findOne({ userId: user._id });

    if (!studentProfile) {
      studentProfile = new RegisteredStudentProfile({
        userId: user._id,
        name: studentName,
        fatherName,
        motherName,
        gender: effectiveGender,
        department,
        courseName,
        semester: effectiveSemester,
        rollNumber: normalizedRollNumber,
        sgpaOdd,
        sgpaEven,
        roomPreference: effectiveRoomPreference,
        admissionYear,
        contactNumber,
        isEligible: true, // Explicitly set isEligible to true for new profiles
        // hostelFeePaid: false, // Default values if needed
        // messFeePaid: false,
      });
    } else {
      // Update existing profile
      studentProfile.name = studentName;
      studentProfile.fatherName = fatherName;
      studentProfile.motherName = motherName;
      studentProfile.gender = effectiveGender;
      studentProfile.department = department;
      studentProfile.courseName = courseName;
      studentProfile.semester = effectiveSemester;
      studentProfile.rollNumber = normalizedRollNumber;
      studentProfile.sgpaOdd = sgpaOdd;
      studentProfile.sgpaEven = sgpaEven;
      studentProfile.roomPreference = effectiveRoomPreference;
      studentProfile.admissionYear = admissionYear;
      studentProfile.contactNumber = contactNumber;
      studentProfile.isEligible = true; // Ensure isEligible is true on update as well
    }

    await studentProfile.save();

    // CRITICAL STEP: Link the studentProfile to the User model
    user.studentProfile = studentProfile._id;
    await user.save();

    // Create token for immediate login after registration (optional)
    const token = issueToken(user);

    return res.status(200).json({
      success: true,
      message: "Student profile registered/updated successfully!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentProfileId: studentProfile._id // Send profile ID back
      },
    });

  } catch (error) {
    console.error("Error in createOrUpdateRegisteredStudentProfile:", error);
    // Check for duplicate key errors (e.g., if rollNumber is unique and there's a conflict)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: `Registration failed. A student with similar unique details (e.g., roll number) might already exist.`,
        error: error.message
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server error during profile registration/update.",
      error: error.message,
    });
  }
};

// ************************************************************************************************
//Fetch All Student Profiles
exports.getAllRegisteredStudentProfiles = async (req, res) => {
  try {
    const students = await RegisteredStudentProfile.find({}); // Use PascalCase here
    res.status(200).json({ success: true, data: students });
  }
  catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Error fetching student profiles", error: err.message });
  }
};

// ************************************************************************************************
// Logout functionality for both students and provosts
exports.logout = async (req, res) => {
  try {
    // Since JWT tokens are stateless, we don't need to do anything on the server
    // The client will remove the token from localStorage/sessionStorage
    // We can optionally log the logout activity for audit purposes

    const { id: userId, email, role } = req.user || {}; // Get user info from auth middleware

    // Optional: Log the logout activity
    console.log(`User ${userId} (${email}) with role ${role} logged out at ${new Date().toISOString()}`);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    console.error("Error during logout:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during logout",
      error: error.message
    });
  }
};

// ************************************************************************************************
// Reset Password functionality for students only
exports.sendResetPasswordOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists and is a student
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this email address"
      });
    }

    // Check if user is a student
    if (user.role !== "student") {
      return res.status(403).json({
        success: false,
        message: "Password reset is only available for students"
      });
    }

    // Generate OTP
    let otp;
    let otpExists = true;
    let attempts = 0;
    const maxAttempts = 10;

    while (otpExists && attempts < maxAttempts) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      const existingOtp = await OTP.findOne({ otp });
      if (!existingOtp) {
        otpExists = false;
      }
      attempts++;
    }

    if (otpExists) {
      return res.status(500).json({
        success: false,
        message: "Could not generate a unique OTP. Please try again later."
      });
    }

    // Save OTP to database
    const otpPayload = { email, otp };
    const otpBody = await OTP.create(otpPayload);

    return res.status(200).json({
      success: true,
      message: "Reset password OTP sent successfully to your email",
      otp: otp // Remove this in production
    });

  } catch (error) {
    console.error("Error sending reset password OTP:", error);
    return res.status(500).json({
      success: false,
      message: "Error sending reset password OTP",
      error: error.message
    });
  }
};

// Verify Reset Password OTP
exports.verifyResetPasswordOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required"
      });
    }

    // Check if user exists and is a student
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this email address"
      });
    }

    if (user.role !== "student") {
      return res.status(403).json({
        success: false,
        message: "Password reset is only available for students"
      });
    }

    // Verify OTP
    const recentOtp = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);

    if (recentOtp.length === 0) {
      return res.status(400).json({
        success: false,
        message: "OTP not found. Please request a new OTP."
      });
    }

    if (recentOtp[0].otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully. You can now reset your password."
    });

  } catch (error) {
    console.error("Error verifying reset password OTP:", error);
    return res.status(500).json({
      success: false,
      message: "Error verifying OTP",
      error: error.message
    });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match"
      });
    }

    // Password validation
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    // Check if user exists and is a student
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this email address"
      });
    }

    if (user.role !== "student") {
      return res.status(403).json({
        success: false,
        message: "Password reset is only available for students"
      });
    }

    // Verify OTP one more time
    const recentOtp = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);

    if (recentOtp.length === 0 || recentOtp[0].otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP"
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await User.findByIdAndUpdate(user._id, { password: hashedPassword });

    // Delete used OTP
    await OTP.deleteMany({ email });

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now login with your new password."
    });

  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({
      success: false,
      message: "Error resetting password",
      error: error.message
    });
  }
};