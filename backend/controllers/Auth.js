const User = require("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { fetchResult } = require("../utils/fetchResult");
require("dotenv").config();

// send otp
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    //check if the user is already present
    const checkUserPresent = await User.findOne({ email });

    if (checkUserPresent) {
      return res.status(401).json({
        success: false,
        message: `User is already registered`,
      });
    }
    var otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    console.log("OTP generated", otp);

    //check unique otp
    let result = await OTP.findOne({ otp: otp });
    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      result = await OTP.findOne({ otp: otp });
    }
    const otpPayload = { email, otp };
    //create an entry in DB
    await OTP.create(otpPayload);
    console.log(otpPayload);

    return res.status(200).json({
      success: true,
      message: `Otp sent successfully`,
      otp,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Register Student
exports.signup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      otp,
      rollno,
      dob,
      courseId,
      semester,
      examType,
      subjectId,
    } = req.body;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already registered",
      });
    }

    // 2. Fetch LU Result & Check Eligibility
    const result = await fetchResult({
      CourseId: courseId,
      Semester: semester,
      ExamType: examType,
      SubjectId: subjectId,
      Rollno: rollno,
      Dob1: dob,
    });

    if (result.status !== "success") {
      return res
        .status(404)
        .json({ success: false, message: "Result not found" });
    }

    const resultData = Object.fromEntries(
      result.result.map((item) => [item.key, item.value])
    );

    // Extract SGPA and Result Status
    const sgpa = parseFloat(resultData["SGPA"]);
    const resultStatus = resultData["Result"];

    // Extract and calculate percentage from Total Marks
    const totalMarksStr = resultData["Total Marks"] || "0 / 100";
    const [obtainedMarks, totalMarks] = totalMarksStr
      .split("/")
      .map((val) => parseInt(val.trim()));
    const percentage = (obtainedMarks / totalMarks) * 100;

    // 3. Determine Hostel Eligibility
    let isEligibleForHostel = true;
    const currentSemester = parseInt(semester);
    const isEvenSemester = currentSemester % 2 === 0;

    if (resultStatus !== "PASSED") {
      if (isEvenSemester) {
        isEligibleForHostel = false; // Backlog in even sem → not eligible
      }
    }

    if (percentage < 50) {
      isEligibleForHostel = false; // Less than 50% marks → not eligible
    }

    if (!isEligibleForHostel) {
      return res.status(403).json({
        success: false,
        message:
          "You are not eligible for hostel (due to backlog in even semester or marks < 50%)",
      });
    }

    // 4. Validate OTP
    const recentOtp = await OTP.findOne({ email }).sort({ createdAt: -1 });
    if (!recentOtp || recentOtp.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // 5. Check Passwords Match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    // 6. Hash Password & Create User
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      rollno,
      dob,
      enrollmentNo: resultData["Enrollment No."],
      name: resultData["Name of Student"],
      fatherName: resultData["Father's Name"],
      motherName: resultData["Mother's Name"],
      resultStatus,
      sgpa,
      totalMarks: resultData["Total Marks"],
      examTitle: resultData["Name of Examination"],
      isVerifiedLU: true,
    });

    // 7. Create Student Profile
    await StudentProfile.create({
      userId: newUser._id,
      rollNo: rollno,
      name: resultData["Name of Student"],
      fatherName: resultData["Father's Name"],
      motherName: resultData["Mother's Name"],
      sgpa,
      totalMarks: obtainedMarks,
      percentage,
      resultStatus,
      isEligibleForHostel,
    });

    // 8. Generate JWT Token
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: "student" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(201).json({
      success: true,
      message: "Signup successful",
      token,
      user: {
        id: newUser._id,
        name: newUser.firstName + " " + newUser.lastName,
        email: newUser.email,
        sgpa,
        resultStatus,
        isEligibleForHostel,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during signup",
    });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found. Please register first.",
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // Send response
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.firstName + " " + user.lastName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
};

exports.loginProvost = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Compare with hardcoded provost credentials
    if (email !== process.env.PROVOST_EMAIL) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid provost email" });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      process.env.PROVOST_PASSWORD_HASH
    );
    if (!passwordMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid password" });
    }

    const payload = { email, role: "provost" };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "3h",
    });

    res.status(200).json({
      success: true,
      message: "Provost login successful",
      token,
      role: "provost",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal error" });
  }
};

exports.loginChiefProvost = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Compare with hardcoded chief provost credentials
    if (email !== process.env.CHIEF_PROVOST_EMAIL) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid chief provost email" });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      process.env.CHIEF_PROVOST_PASSWORD_HASH
    );
    if (!passwordMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid password" });
    }

    const payload = { email, role: "chief-provost" };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "3h",
    });

    res.status(200).json({
      success: true,
      message: "Chief Provost login successful",
      token,
      role: "chief-provost",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal error" });
  }
};
