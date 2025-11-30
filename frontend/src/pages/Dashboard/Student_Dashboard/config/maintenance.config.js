export const REQUEST_TYPES = [
  {
    value: "plumbing",
    label: "Plumbing",
    helper: "Leaks, faucets, bathrooms, drainage issues",
  },
  {
    value: "electrical",
    label: "Electrical",
    helper: "Power outages, switches, lighting problems",
  },
  {
    value: "furniture",
    label: "Furniture",
    helper: "Beds, desks, chairs, storage repairs",
  },
  {
    value: "cleaning",
    label: "Cleaning",
    helper: "Deep clean, pest control, sanitation",
  },
  {
    value: "ac_cooling",
    label: "AC / Cooling",
    helper: "Air conditioning, fans, ventilation",
  },
  {
    value: "network",
    label: "Network / IT",
    helper: "Wi-Fi, LAN, authentication issues",
  },
  {
    value: "security",
    label: "Security",
    helper: "Door locks, windows, safety concerns",
  },
  {
    value: "others",
    label: "Other",
    helper: "Anything else that needs attention",
  },
];

export const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "in-progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

export const DESCRIPTION_LIMIT = 500;
