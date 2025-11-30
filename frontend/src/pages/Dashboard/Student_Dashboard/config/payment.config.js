export const PAYMENT_STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "created", label: "Created" },
  { value: "captured", label: "Captured" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
];

export const PAYMENT_TYPE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "hostel", label: "Hostel" },
  { value: "mess", label: "Mess" },
];

export const SEMESTER_OPTIONS = [
  { value: "odd", label: "Odd semester" },
  { value: "even", label: "Even semester" },
];

export const FEE_SELECTION_OPTIONS = [
  {
    value: "hostel",
    title: "Hostel fee",
    helper: "Full-year accommodation charges",
  },
  {
    value: "mess",
    title: "Mess fee",
    helper: "Semester-based mess subscription",
  },
];

export const PAYMENT_PRIMARY_BUTTON_CLASS =
  "inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-600 to-red-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-orange-700 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";
