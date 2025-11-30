import React from "react";

const labelClass = "mb-2 block text-sm font-medium text-slate-700";

const HostelSelection = ({ formData, handleChange }) => (
  <div className="space-y-8">
    <div>
      <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
        Hostel Preferences
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        Choose your preferences so we can suggest the best accommodation
        options.
      </p>
    </div>

    <div className="space-y-6">
      <div>
        <label className={labelClass}>Gender *</label>
        <div className="grid gap-3 sm:grid-cols-2">
          {["male", "female"].map((option) => {
            const isActive = formData.gender === option;
            return (
              <button
                type="button"
                key={option}
                onClick={() =>
                  handleChange({ target: { name: "gender", value: option } })
                }
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 ${
                  isActive
                    ? "border-sky-500 bg-sky-50 text-sky-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <span>{option}</span>
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                    isActive ? "border-sky-500 bg-sky-500" : "border-slate-300"
                  }`}
                >
                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className={labelClass}>Room Preference *</label>
        <select
          name="roomPreference"
          value={formData.roomPreference}
          onChange={handleChange}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
          required
        >
          <option value="">Select room type</option>
          <option value="single">Single occupancy</option>
          <option value="double">Double sharing</option>
          <option value="triple">Triple sharing</option>
        </select>
      </div>
    </div>

    <p className="text-xs text-slate-400">
      Fields marked with * are mandatory.
    </p>
  </div>
);

export default HostelSelection;
