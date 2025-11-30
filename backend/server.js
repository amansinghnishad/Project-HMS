require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const maintenanceRoutes = require("./routes/maintenanceRoutes");
const allotmentRoutes = require("./routes/allotmentRoutes"); // Added allotment routes
const paymentRoutes = require("./routes/paymentRoutes"); // Added payment routes
const noticeRoutes = require("./routes/noticeRoutes"); // Added notice routes
const publicNoticeRoutes = require("./routes/publicNoticeRoutes"); // Added public notice routes
const dataBase = require("./config/dataBase");

const app = express();
const PORT = process.env.PORT || 4000; // Ensure this matches the frontend's API URL

dataBase.connect();

// CORS middleware
app.use(cors({
  origin: [
    'http://localhost:5173', // local frontend
    , 'https://project-hms-beta.vercel.app' // deployed frontend
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  credentials: true
}));
app.use(express.json());

// Serve static files (uploaded PDFs and attachments)
app.use('/uploads', express.static('uploads'));

// default route
app.get('/', (req, res) => {
  return res.json({
    success: true,
    message: "your server is running",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/service-requests', maintenanceRoutes); // Add maintenance routes
app.use('/api/allotment', allotmentRoutes); // Added allotment routes
app.use("/api/payment", paymentRoutes); // Added payment routes
app.use("/api/notices", noticeRoutes); // Added notice routes
app.use("/api/public-notices", publicNoticeRoutes); // Added public notice routes

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Internal server error" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});
