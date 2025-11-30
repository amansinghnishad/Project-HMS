export const FEEDBACK_TYPES = [
  {
    value: "Room Related",
    label: "Room related",
    helper: "Facilities, repairs, cleanliness inside your room",
  },
  {
    value: "Mess Related",
    label: "Mess related",
    helper: "Food quality, hygiene, or suggestions for the mess",
  },
  {
    value: "Hostel Library",
    label: "Hostel library",
    helper: "Resources, ambience, or study arrangements",
  },
  {
    value: "Gaming Room Related",
    label: "Gaming room",
    helper: "Equipment issues or scheduling challenges",
  },
  {
    value: "Security & Safety",
    label: "Security & safety",
    helper: "Access, surveillance, or safety concerns",
  },
  {
    value: "Wi-Fi & Internet",
    label: "Wi-Fi & internet",
    helper: "Connectivity, speed, or authentication problems",
  },
  {
    value: "Other",
    label: "Something else",
    helper: "Share anything outside the listed categories",
  },
];

export const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "in-progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export const MESSAGE_LIMIT = 1000;
