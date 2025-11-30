import React, { useMemo, useState } from "react";
import coursesData from "../../../utils/courseNameData.json";
import { authService } from "../../services/api/authService";

const labelClass = "mb-2 block text-sm font-medium text-slate-700";
const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100";

const CourseRegistrationForm = ({
  formData,
  handleChange,
  onEligibilityCheck,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isEligible, setIsEligible] = useState(null);
  const [error, setError] = useState(null);
  const [studentDetails, setStudentDetails] = useState({
    name: "",
    fatherName: "",
    motherName: "",
    sgpaOdd: "",
    sgpaEven: "",
    courseName: "",
  });

  const courses = useMemo(() => coursesData, []);
  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === formData.course),
    [courses, formData.course]
  );

  const resetStudentDetails = () => {
    setStudentDetails({
      name: "",
      fatherName: "",
      motherName: "",
      sgpaOdd: "",
      sgpaEven: "",
      courseName: "",
    });
  };

  const checkEligibility = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (
        !formData.course ||
        !formData.semester ||
        !formData.examType ||
        !formData.rollno ||
        !formData.dateOfBirth
      ) {
        setError("Please fill in all required fields.");
        return;
      }

      const payload = {
        CourseId: formData.course,
        year: formData.semester,
        ExamType: formData.examType,
        SubjectId: formData.subject,
        Rollno: formData.rollno,
        Dob: formData.dateOfBirth,
        Dob1: formData.dateOfBirth,
      };

      const response = await authService.checkEligibility(payload);
      const resData = response?.data || response || {};
      const eligibility = resData.hostel_eligibility || resData.eligibility;

      if (eligibility?.eligible) {
        const details = {
          name: resData.Name || "",
          fatherName: resData.Father_Name || "",
          motherName: resData.Mother_Name || "",
          sgpaOdd: resData.odd_semester_result?.SGPA || "N/A",
          sgpaEven: resData.even_semester_result?.SGPA || "N/A",
          courseName: resData.Course || selectedCourse?.name || "",
        };

        setIsEligible(true);
        setStudentDetails(details);
        onEligibilityCheck(true, details);
        return;
      }

      setIsEligible(false);
      onEligibilityCheck(false, null);
      resetStudentDetails();
      setError(
        eligibility?.message ||
          resData?.message ||
          "You are not eligible for hostel registration."
      );
    } catch (err) {
      setIsEligible(false);
      onEligibilityCheck(false, null);
      resetStudentDetails();
      setError(
        err?.payload?.message ||
          err?.message ||
          "An error occurred while checking eligibility."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
          Eligibility Details
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Fill in your academic information to confirm your eligibility before
          proceeding to the next step.
        </p>
      </div>

      {studentDetails.name && (
        <dl className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 sm:p-6">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Student Name
            </dt>
            <dd className="mt-1 text-sm text-slate-800">
              {studentDetails.name}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Father&apos;s Name
            </dt>
            <dd className="mt-1 text-sm text-slate-800">
              {studentDetails.fatherName}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Mother&apos;s Name
            </dt>
            <dd className="mt-1 text-sm text-slate-800">
              {studentDetails.motherName}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Course
            </dt>
            <dd className="mt-1 text-sm text-slate-800">
              {studentDetails.courseName || selectedCourse?.name || ""}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              SGPA (Odd Semester)
            </dt>
            <dd className="mt-1 text-sm text-slate-800">
              {studentDetails.sgpaOdd}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              SGPA (Even Semester)
            </dt>
            <dd className="mt-1 text-sm text-slate-800">
              {studentDetails.sgpaEven}
            </dd>
          </div>
        </dl>
      )}

      <div className="space-y-6">
        <div>
          <label className={labelClass}>Course Name *</label>
          <select
            name="course"
            value={formData.course}
            onChange={handleChange}
            className={inputClass}
            required
          >
            <option value="">Select course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Subject *</label>
          <select
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className={inputClass}
            required
          >
            <option value="">Select subject</option>
            {selectedCourse && (
              <option value={selectedCourse.id}>{selectedCourse.name}</option>
            )}
          </select>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Current Year *</label>
            <select
              name="semester"
              value={formData.semester}
              onChange={handleChange}
              className={inputClass}
              required
            >
              <option value="">Select year</option>
              <option value="2">Second year</option>
              <option value="3">Third year</option>
              <option value="4">Fourth year</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Exam Type *</label>
            <select
              name="examType"
              value={formData.examType}
              onChange={handleChange}
              className={inputClass}
              required
            >
              <option value="">Select exam type</option>
              <option value="regular">Regular</option>
            </select>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Roll Number *</label>
            <input
              type="text"
              name="rollno"
              value={formData.rollno}
              onChange={handleChange}
              className={inputClass}
              maxLength={15}
              placeholder="Enter your roll number"
              required
            />
          </div>
          <div>
            <label className={labelClass}>Date of Birth (DD/MM/YYYY) *</label>
            <input
              type="text"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className={inputClass}
              maxLength={10}
              placeholder="DD/MM/YYYY"
              required
            />
          </div>
        </div>
      </div>

      <div>
        <button
          onClick={checkEligibility}
          disabled={
            isLoading ||
            !formData.course ||
            !formData.semester ||
            !formData.examType ||
            !formData.rollno ||
            !formData.dateOfBirth
          }
          className={`inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 ${
            isLoading
              ? "cursor-not-allowed bg-slate-300"
              : "bg-sky-600 hover:bg-sky-700"
          }`}
        >
          {isLoading ? "Checking eligibility..." : "Check Eligibility"}
        </button>
      </div>

      {isEligible !== null && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            isEligible
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
          }`}
        >
          {isEligible
            ? "You are eligible for hostel registration."
            : error || "You are not eligible for hostel registration."}
        </div>
      )}

      {error && isEligible !== true && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <p className="text-xs text-slate-400">
        Fields marked with * are mandatory.
      </p>
    </div>
  );
};

export default CourseRegistrationForm;
