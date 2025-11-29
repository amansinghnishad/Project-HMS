const Razorpay = require("razorpay");

const resolveKey = () => {
    if (process.env.RAZORPAY_KEY && process.env.RAZORPAY_SECRET) {
        return {
            key_id: process.env.RAZORPAY_KEY,
            key_secret: process.env.RAZORPAY_SECRET,
        };
    }

    if (process.env.NODE_ENV === "production") {
        throw new Error("Razorpay credentials missing in production environment.");
    }

    console.warn("Using fallback Razorpay test credentials. Set RAZORPAY_KEY and RAZORPAY_SECRET for real payments.");
    return {
        key_id: "default_test_key",
        key_secret: "default_test_secret",
    };
};

const instance = new Razorpay(resolveKey());

module.exports = instance;
