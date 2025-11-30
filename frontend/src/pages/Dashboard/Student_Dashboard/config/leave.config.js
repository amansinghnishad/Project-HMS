export const LEAVE_TYPES = [
  {
    value: "sick",
    label: "Sick",
    helper: "Doctor visits, recovery, health concerns",
  },
  {
    value: "emergency",
    label: "Emergency",
    helper: "Family emergencies or urgent matters",
  },
  {
    value: "personal",
    label: "Personal",
    helper: "Personal commitments or events",
  },
  {
    value: "vacation",
    label: "Vacation",
    helper: "Planned time away from campus",
  },
  { value: "other", label: "Other", helper: "Anything else that needs leave" },
];

export const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export const DESCRIPTION_LIMIT = 500;
