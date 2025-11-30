import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/api/authService";

const Submit = ({ formData }) => {
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    alert(
      "You are about to submit your application. Please confirm all details are correct."
    );
    if (!agreeToTerms) {
      setError("Please agree to the terms before submitting.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await authService.registerStudentProfile({
        email: formData.email,
        studentName: formData.studentName,
        fatherName: formData.fatherName,
        motherName: formData.motherName,
        gender: formData.gender,
        department: formData.courseName,
        courseName: formData.courseName,
        semester: formData.semester,
        rollno: formData.rollno,
        sgpaOdd: formData.sgpaOdd,
        sgpaEven: formData.sgpaEven,
        roomPreference: formData.roomPreference,
        admissionYear: new Date().getFullYear(),
        contactNumber: formData.mobile,
        password: formData.password,
      });

      alert("Application submitted successfully!");
      setSuccess(true);
      setTimeout(() => {
        navigate("/login/student-login");
      }, 2000);
    } catch (err) {
      const message =
        err?.payload?.message ||
        err?.message ||
        "Registration failed. Please try again.";

      if (message.toLowerCase().includes("already registered")) {
        setError(
          "A user with this email already exists. Please login or use a different email."
        );
      } else {
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-center">
      {!success ? (
        <div className="space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 text-sky-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.6}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
              Ready to Submit
            </h2>
            <p className="mx-auto max-w-md text-sm text-slate-500">
              By submitting, you confirm that all details are accurate and agree
              to the programme terms and privacy policy.
            </p>
          </div>

          <label className="mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-600">
            <input
              type="checkbox"
              checked={agreeToTerms}
              onChange={() => setAgreeToTerms((prev) => !prev)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <span>
              I agree to the
              <a
                href="#"
                className="mx-1 text-sky-600 transition-colors hover:text-sky-700"
              >
                Terms of Service
              </a>
              and
              <a
                href="#"
                className="ml-1 text-sky-600 transition-colors hover:text-sky-700"
              >
                Privacy Policy
              </a>
              .
            </span>
          </label>
          {error && (
            <div className="mx-auto max-w-md rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !agreeToTerms}
            className={`inline-flex w-full items-center justify-center rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 sm:w-auto ${
              isSubmitting || !agreeToTerms
                ? "cursor-not-allowed bg-slate-300"
                : "bg-sky-600 hover:bg-sky-700"
            }`}
          >
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </button>
          <p className="text-xs text-slate-400">
            A confirmation email will be sent to your registered address.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.6}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-emerald-700 sm:text-xl">
            Registration Successful
          </h2>
          <p className="mx-auto max-w-md text-sm text-slate-500">
            Your application has been submitted. You will be redirected to the
            login page shortly.
          </p>
        </div>
      )}
    </div>
  );
};

export default Submit;
