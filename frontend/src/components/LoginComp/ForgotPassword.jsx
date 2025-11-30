import React, { useState } from "react";
import { FaEnvelope, FaLock, FaKey } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { authService } from "../../services/api/authService";

const ForgotPassword = ({ onBackToLogin }) => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };
  const handleSendOTP = async (e, { showSuccessToast = true } = {}) => {
    e?.preventDefault?.();
    if (!formData.email) {
      setErrors({ email: "Email is required" });
      return;
    }

    if (!validateEmail(formData.email)) {
      setErrors({ email: "Please enter a valid email address" });
      return;
    }

    setLoading(true);
    try {
      await authService.sendResetPasswordOtp(formData.email);
      setStep(2);
      setErrors({});
      if (showSuccessToast) {
        toast.success("OTP sent successfully to your email!");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast.error(
        error.message ||
          error?.payload?.message ||
          "Failed to send OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };
  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (!formData.otp) {
      setErrors({ otp: "OTP is required" });
      return;
    }

    if (formData.otp.length !== 6) {
      setErrors({ otp: "OTP must be 6 digits" });
      return;
    }

    setLoading(true);
    try {
      await authService.verifyResetPasswordOtp({
        email: formData.email,
        otp: formData.otp,
      });
      setStep(3);
      setErrors({});
      toast.success("OTP verified successfully!");
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast.error(
        error.message ||
          error?.payload?.message ||
          "Invalid OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };
  const handleResetPassword = async (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (!validatePassword(formData.newPassword)) {
      newErrors.newPassword = "Password must be at least 6 characters long";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({
        email: formData.email,
        otp: formData.otp,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      setErrors({});
      setStep(4); // Move to success step
      toast.success(
        "🎉 Password reset successfully! You can now login with your new password.",
        {
          duration: 4000,
          style: {
            background: "#10B981",
            color: "#fff",
          },
        }
      );
      // Auto redirect to login after 3 seconds
      setTimeout(() => {
        onBackToLogin();
      }, 3000);
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error(
        error.message ||
          error?.payload?.message ||
          "Failed to reset password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };
  const renderStepIndicator = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-400">
        <span className={step >= 1 ? "text-blue-600" : undefined}>Request</span>
        <span className={step >= 2 ? "text-blue-600" : undefined}>Verify</span>
        <span className={step >= 3 ? "text-blue-600" : undefined}>Reset</span>
      </div>
      <div className="mt-2 h-1 rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{ width: `${Math.min((step - 1) / 2, 1) * 100}%` }}
        />
      </div>
    </div>
  );

  const renderEmailStep = () => (
    <form onSubmit={(e) => handleSendOTP(e)} className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-600">
          Enter your registered email address
        </label>
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition focus-within:border-blue-500">
          <FaEnvelope className="text-blue-500" />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            className="w-full border-none bg-transparent text-base text-slate-800 outline-none placeholder:text-slate-400"
            required
          />
        </div>
        {errors.email && (
          <p className="mt-1 text-sm text-red-500">{errors.email}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-blue-600 py-3 text-base font-semibold text-white transition hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Sending OTP..." : "Send OTP"}
      </button>
    </form>
  );

  const renderOTPStep = () => (
    <form onSubmit={handleVerifyOTP} className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-600">
          Enter the OTP sent to {formData.email}
        </label>
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition focus-within:border-blue-500">
          <FaKey className="text-blue-500" />
          <input
            type="text"
            name="otp"
            value={formData.otp}
            onChange={handleChange}
            placeholder="Enter 6-digit OTP"
            maxLength="6"
            className="w-full border-none bg-transparent text-base text-slate-800 outline-none placeholder:text-slate-400"
            required
          />
        </div>
        {errors.otp && (
          <p className="mt-1 text-sm text-red-500">{errors.otp}</p>
        )}
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-base font-semibold text-slate-600 transition hover:border-blue-500 hover:text-blue-600"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-xl bg-blue-600 py-3 text-base font-semibold text-white transition hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
      </div>
      <button
        type="button"
        onClick={async () => {
          if (loading) return;
          toast.loading("Resending OTP...", { id: "resend-otp" });
          try {
            await handleSendOTP(undefined, { showSuccessToast: false });
            toast.success("OTP resent successfully!", { id: "resend-otp" });
          } catch (error) {
            toast.error("Failed to resend OTP", { id: "resend-otp" });
          }
        }}
        disabled={loading}
        className="w-full text-sm font-semibold text-blue-600 transition hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Didn't receive OTP? Resend
      </button>
    </form>
  );

  const renderPasswordStep = () => (
    <form onSubmit={handleResetPassword} className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-600">
          New Password
        </label>
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition focus-within:border-blue-500">
          <FaLock className="text-blue-500" />
          <input
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            placeholder="Enter new password"
            className="w-full border-none bg-transparent text-base text-slate-800 outline-none placeholder:text-slate-400"
            required
          />
        </div>
        {errors.newPassword && (
          <p className="mt-1 text-sm text-red-500">{errors.newPassword}</p>
        )}
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-600">
          Confirm New Password
        </label>
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition focus-within:border-blue-500">
          <FaLock className="text-blue-500" />
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm new password"
            className="w-full border-none bg-transparent text-base text-slate-800 outline-none placeholder:text-slate-400"
            required
          />
        </div>
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
        )}
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setStep(2)}
          className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-base font-semibold text-slate-600 transition hover:border-blue-500 hover:text-blue-600"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-xl bg-blue-600 py-3 text-base font-semibold text-white transition hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </div>
    </form>
  );

  const renderSuccessStep = () => (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
          <div className="text-3xl font-bold text-green-600">✓</div>
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-xl font-semibold text-green-600">
          Password Reset Successful!
        </h3>
        <p className="mb-4 text-slate-600">
          Your password has been successfully reset. You can now login with your
          new password.
        </p>
        <p className="text-sm text-slate-500">
          You will be redirected to the login page automatically in a few
          seconds...
        </p>
      </div>
      <button
        onClick={onBackToLogin}
        className="w-full rounded-xl bg-green-600 py-3 text-base font-semibold text-white transition hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-white"
      >
        Go to Login Now
      </button>
    </div>
  );
  return (
    <section className="bg-gray-50">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-16 md:px-10 lg:flex-row lg:items-start">
        <aside className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-10">
          <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">
            Help centre
          </h2>
          <h3 className="mt-3 text-2xl font-semibold text-slate-900">
            Password recovery in three steps
          </h3>
          <p className="mt-3 text-sm text-slate-600">
            We&apos;ll send a verification code to the email associated with
            your hostel account. Follow the steps to regain access securely.
          </p>
          <ol className="mt-6 space-y-4 text-sm text-slate-600">
            <li className="flex gap-3">
              <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-xs font-semibold text-blue-600">
                1
              </span>
              <div>
                <p className="font-semibold text-slate-800">Request a code</p>
                <p className="mt-1 leading-relaxed">
                  Enter the institutional email you used during registration and
                  we&apos;ll email you a one-time password.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-xs font-semibold text-blue-600">
                2
              </span>
              <div>
                <p className="font-semibold text-slate-800">Verify ownership</p>
                <p className="mt-1 leading-relaxed">
                  Type the 6-digit code from the email. This confirms the
                  request came from you.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-xs font-semibold text-blue-600">
                3
              </span>
              <div>
                <p className="font-semibold text-slate-800">
                  Create a new password
                </p>
                <p className="mt-1 leading-relaxed">
                  Set a strong password, confirm it, and you&apos;re ready to
                  sign in again.
                </p>
              </div>
            </li>
          </ol>
          <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
            <p className="font-semibold">Need extra assistance?</p>
            <p className="mt-1">
              Contact the hostel digital support team at
              <a
                href="mailto:hms-support@lkouniv.ac.in"
                className="ml-1 font-semibold underline"
              >
                hms-support@lkouniv.ac.in
              </a>
              .
            </p>
          </div>
        </aside>

        <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
          <header className="mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              Reset password
            </span>
            <h1 className="mt-4 text-3xl font-semibold text-slate-900">
              Recover account access
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {step === 1 && "Enter the email linked to your HMS account."}
              {step === 2 &&
                "Confirm the one-time password sent to your email."}
              {step === 3 && "Choose a secure password and confirm the change."}
              {step === 4 && "All set! Sign in again with your new password."}
            </p>
          </header>

          {renderStepIndicator()}

          <div className="space-y-8">
            {step === 1 && renderEmailStep()}
            {step === 2 && renderOTPStep()}
            {step === 3 && renderPasswordStep()}
            {step === 4 && renderSuccessStep()}
          </div>

          {step !== 4 && (
            <div className="mt-8 text-center text-sm">
              <button
                onClick={onBackToLogin}
                className="font-semibold text-blue-600 transition hover:text-blue-700"
              >
                Back to login
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ForgotPassword;
