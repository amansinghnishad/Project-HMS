import React from "react";

const Section = ({ title, children }) => (
  <section className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 sm:px-6">
    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
      {title}
    </h3>
    <div className="mt-4 text-sm text-slate-700">{children}</div>
  </section>
);

const InfoRow = ({ label, value }) => (
  <div className="grid gap-2 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4">
    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
      {label}
    </span>
    <span className="text-sm text-slate-700">{value}</span>
  </div>
);

const Preview = ({ formData }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
        Review Your Details
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        Ensure the information below is correct before submitting your
        application.
      </p>
    </div>

    <Section title="Personal Information">
      <div className="space-y-4">
        <InfoRow
          label="Student Name"
          value={formData.studentName || "Not available"}
        />
        <InfoRow
          label="Father's Name"
          value={formData.fatherName || "Not available"}
        />
        <InfoRow
          label="Mother's Name"
          value={formData.motherName || "Not available"}
        />
        <InfoRow
          label="Roll Number"
          value={formData.rollno || "Not provided"}
        />
        <InfoRow
          label="Course"
          value={formData.courseName || "Not available"}
        />
        <InfoRow
          label="Current Year"
          value={formData.semester || "Not provided"}
        />
        <InfoRow
          label="SGPA (Odd)"
          value={formData.sgpaOdd || "Not available"}
        />
        <InfoRow
          label="SGPA (Even)"
          value={formData.sgpaEven || "Not available"}
        />
      </div>
    </Section>

    <Section title="Contact Information">
      <div className="space-y-4">
        <InfoRow label="Email" value={formData.email || "Not provided"} />
        <InfoRow label="Mobile" value={formData.mobile || "Not provided"} />
      </div>
    </Section>

    <Section title="Hostel Preferences">
      <div className="space-y-4">
        <InfoRow
          label="Gender"
          value={
            formData.gender === "male"
              ? "Male"
              : formData.gender === "female"
              ? "Female"
              : "Not selected"
          }
        />
        <InfoRow
          label="Room Preference"
          value={
            formData.roomPreference === "single"
              ? "Single occupancy"
              : formData.roomPreference === "double"
              ? "Double sharing"
              : formData.roomPreference === "triple"
              ? "Triple sharing"
              : "Not selected"
          }
        />
      </div>
    </Section>

    <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700 sm:text-sm">
      Please review all information carefully. Submissions cannot be edited once
      they are sent.
    </p>
  </div>
);

export default Preview;
