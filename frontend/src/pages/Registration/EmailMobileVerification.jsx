import React, { useState } from "react";
import { authService } from "../../services/api/authService";

const labelClass = "mb-2 block text-sm font-medium text-slate-700";
const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100";
const actionButtonClass =
  "inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 sm:w-auto";

const EmailMobileVerification = ({ formData, handleChange, onOtpVerified }) => {
  const [otpSent, setOtpSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [isOtpVerifiedLocal, setIsOtpVerifiedLocal] = useState(false);

  const checkEmailExists = async () => {
    if (!formData.email) {
      alert("Please enter your email address first.");
      return null;
    }

    try {
      setIsCheckingEmail(true);
      const payload = await authService.checkEmail(formData.email);
      setEmailExists(Boolean(payload?.exists));
      return payload;
    } catch (error) {
      const existingStatus = error?.payload?.status;
      if (existingStatus) {
        setEmailExists(true);
        return error.payload;
      }
      setEmailExists(false);
      return null;
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const sendOtp = async () => {
    if (!formData.email) {
      alert("Please enter your email address before sending OTP.");
      return;
    }
    setIsCheckingEmail(true);
    try {
      const emailCheck = await checkEmailExists();
      if (emailCheck?.exists) {
        setEmailExists(true);
        alert("This email is already registered. Please login instead.");
        return;
      }
      const response = await authService.sendOtp(formData.email);
      setOtpSent(true);
      alert("OTP sent to your email.");
      if (response.expiresAt) {
        localStorage.setItem("otpExpiresAt", response.expiresAt);
      }
    } catch (error) {
      alert(error.message || error?.payload?.message || "Failed to send OTP");
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const verifyOtp = async () => {
    if (!formData.otp) {
      alert("Please enter the OTP to verify.");
      return;
    }
    setIsVerifying(true);
    try {
      const verifyRes = await authService.verifyOtp({
        email: formData.email,
        otp: formData.otp,
      });
      if (verifyRes.success) {
        alert("OTP verified successfully!");
        setIsOtpVerifiedLocal(true);
        onOtpVerified(true);
      } else {
        alert("Invalid OTP. Please try again.");
        setIsOtpVerifiedLocal(false);
        onOtpVerified(false);
      }
    } catch (error) {
      alert(error.message || error?.payload?.message || "Failed to verify OTP");
      setIsOtpVerifiedLocal(false);
      onOtpVerified(false);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
          Verify Your Contact Details
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          We will send a one-time password to confirm your email before you can
          continue.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className={labelClass}>Email Address *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={inputClass}
            placeholder="name@example.com"
            required
          />
          <p className="mt-1 text-xs text-slate-400">
            A verification code will be sent to this address.
          </p>
          {emailExists && (
            <p className="mt-2 text-xs text-rose-600">
              This email is already registered. Please sign in instead.
            </p>
          )}
        </div>

        <div>
          <label className={labelClass}>Mobile Number *</label>
          <div className="flex rounded-lg border border-slate-300 bg-white focus-within:border-sky-500 focus-within:ring-4 focus-within:ring-sky-100">
            <span className="flex items-center px-3 text-sm text-slate-500">
              +91
            </span>
            <input
              type="tel"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              className="flex-1 rounded-r-lg border-0 px-3 py-2 text-sm text-slate-900 focus:outline-none"
              placeholder="Enter your mobile number"
              required
            />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={inputClass}
              placeholder="Create a password"
              required
            />
          </div>
          <div>
            <label className={labelClass}>Confirm Password *</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`${inputClass} ${
                formData.password &&
                formData.confirmPassword &&
                formData.password !== formData.confirmPassword
                  ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                  : ""
              }`}
              placeholder="Re-enter password"
              required
            />
            {formData.password &&
              formData.confirmPassword &&
              formData.password !== formData.confirmPassword && (
                <p className="mt-2 text-xs text-rose-600">
                  Passwords do not match.
                </p>
              )}
          </div>
        </div>

        <div>
          <label className={labelClass}>Verification OTP *</label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="text"
              name="otp"
              value={formData.otp}
              onChange={handleChange}
              className={inputClass}
              placeholder="Enter OTP"
              disabled={!otpSent}
              required
            />
            {!otpSent ? (
              <button
                className={`${actionButtonClass} ${
                  isCheckingEmail
                    ? "cursor-not-allowed bg-slate-300"
                    : "bg-sky-600 hover:bg-sky-700"
                }`}
                onClick={sendOtp}
              >
                Send OTP
              </button>
            ) : (
              <button
                className={`${actionButtonClass} ${
                  isVerifying
                    ? "cursor-not-allowed bg-slate-300"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
                onClick={verifyOtp}
                disabled={isVerifying}
              >
                {isVerifying ? "Verifying..." : "Verify OTP"}
              </button>
            )}
          </div>
          {otpSent && !isOtpVerifiedLocal && (
            <button
              className="mt-2 text-xs font-medium text-sky-600 hover:text-sky-700"
              onClick={sendOtp}
              disabled={isCheckingEmail}
            >
              Resend OTP
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Fields marked with * are mandatory.
      </p>
    </div>
  );
};

export default EmailMobileVerification;
