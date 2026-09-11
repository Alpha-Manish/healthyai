export type TimeSlot = "Morning" | "Afternoon" | "Evening" | "Night";
export type TaskCategory =
  | "Medicine"
  | "Wound Care"
  | "Exercise"
  | "Diet"
  | "Follow-up"
  | "Daily Check-in";
export type TaskStatus = "pending" | "completed" | "missed" | "skipped" | "snoozed";
export type RiskLevel = "low" | "medium" | "high";

export type Patient = {
  name: string;
  age: string;
  surgeryType: string;
  surgeryDate: string;
  doctor: string;
  hospital: string;
  phone: string;
  email: string;
};

export type ExtractedReport = {
  surgeryDetails: string;
  medicines: { name: string; dose: string; schedule: string }[];
  woundCare: string[];
  activity: string[];
  diet: string[];
  followUpDate: string;
  warningSigns: string[];
};

export type Task = {
  id: string;
  day: number; // recovery day the task belongs to
  category: TaskCategory;
  title: string;
  detail: string;
  slot: TimeSlot;
  time: string; // HH:MM
  important: boolean;
  status: TaskStatus;
};

export type CheckIn = {
  id: string;
  day: number;
  createdAt: string;
  pain: number;
  fever: boolean;
  temperature: string;
  redness: boolean;
  bleeding: boolean;
  discharge: boolean;
  woundOpening: boolean;
  dizziness: boolean;
  dehydration: boolean;
  legSwelling: boolean;
  otherSymptoms: string;
  notes: string;
  risk: RiskLevel;
  reasons: string[];
  recommendation: string;
};

export type AlertItem = {
  id: string;
  createdAt: string;
  level: RiskLevel;
  title: string;
  message: string;
  reasons: string[];
};

export type Notification = {
  id: string;
  createdAt: string;
  kind: "reminder" | "missed" | "alert" | "update";
  title: string;
  message: string;
  read: boolean;
};

export type TimelineEvent = {
  id: string;
  day: number;
  date: string;
  kind: "surgery" | "task" | "checkin" | "risk" | "alert" | "followup";
  label: string;
  detail: string;
  level?: RiskLevel;
};
