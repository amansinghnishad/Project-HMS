const jwt = require("jsonwebtoken");
require("dotenv").config();

const ensureSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET must be set for authentication middleware.");
  }
};

const extractToken = (req) => {
  if (req.cookies?.token) return req.cookies.token;
  if (req.body?.token) return req.body.token;

  const authHeader = req.header("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }

  return null;
};

const verifyToken = (token) => {
  ensureSecret();
  return jwt.verify(token, process.env.JWT_SECRET);
};

exports.auth = (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ success: false, message: "Authentication token missing." });
    }

    try {
      req.user = verifyToken(token);
    } catch (error) {
      return res.status(401).json({ success: false, message: "Invalid or expired token." });
    }

    return next();
  } catch (error) {
    console.error("Auth middleware error", error);
    return res.status(500).json({ success: false, message: "Authentication processing failed." });
  }
};

const createRoleGuard = (...allowedRoles) => (req, res, next) => {
  try {
    if (!req.user?.role) {
      return res.status(403).json({ success: false, message: "Access denied. Role information missing." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires role: ${allowedRoles.join(" or ")}.`,
      });
    }

    return next();
  } catch (error) {
    console.error("Role guard error", error);
    return res.status(500).json({ success: false, message: "User role validation failed." });
  }
};

exports.isStudent = createRoleGuard("student");
exports.isProvost = createRoleGuard("provost");
exports.isChiefProvost = createRoleGuard("chiefProvost");
exports.isProvostOrChief = createRoleGuard("provost", "chiefProvost");
exports.isProvostOrAdmin = createRoleGuard("provost", "admin");
