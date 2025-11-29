const express = require("express");

const {
    createHostelFeeOrder,
    createMessFeeOrder,
    verifyPaymentSignature,
    getPaymentHistory,
    getAllPayments,
} = require("../controllers/paymentController");
const { auth, isStudent, isProvostOrChief } = require("../middleware/auth");

const router = express.Router();

router.post("/create-hostel-fee-order", auth, isStudent, createHostelFeeOrder);
router.post("/create-mess-fee-order", auth, isStudent, createMessFeeOrder);
router.post("/verify-payment", auth, isStudent, verifyPaymentSignature);
router.get("/my-history", auth, isStudent, getPaymentHistory);
router.get("/all-payments", auth, isProvostOrChief, getAllPayments);

module.exports = router;
