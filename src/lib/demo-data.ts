import type { ExtractedReport, Patient, Task, TaskCategory, TimeSlot } from "./recovery-types";

export const RECOVERY_DAYS = 21;

export function daysAgoISO(days: number) {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function daysAheadISO(days: number) {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export const demoPatient: Patient = {
  name: "Anita Sharma",
  age: "46",
  surgeryType: "Laparoscopic Gallbladder Removal (Cholecystectomy)",
  surgeryDate: daysAgoISO(5),
  doctor: "Dr. R. Menon",
  hospital: "Sunrise Multispeciality Hospital",
  phone: "+91 98200 41122",
  email: "anita.sharma@example.com",
};

export const demoReport: ExtractedReport = {
  surgeryDetails:
    "Laparoscopic cholecystectomy performed under general anaesthesia. Four small port incisions on the abdomen. Uneventful procedure, discharged the next day.",
  medicines: [
    { name: "Paracetamol 650 mg", dose: "1 tablet", schedule: "Three times a day after food" },
    { name: "Cefuroxime 500 mg", dose: "1 tablet", schedule: "Twice a day for 7 days" },
    { name: "Pantoprazole 40 mg", dose: "1 tablet", schedule: "Once daily before breakfast" },
  ],
  woundCare: [
    "Keep all four incision sites clean and dry.",
    "Change the dressing once daily with sterile gauze.",
    "Sponge bath only until day 7; no soaking or swimming.",
  ],
  activity: [
    "Short indoor walks 3 times a day, increase gradually.",
    "No lifting above 5 kg for 4 weeks.",
    "Deep breathing exercises 10 times every few hours.",
    "No driving for 2 weeks.",
  ],
  diet: [
    "Low-fat, light meals for 2 weeks.",
    "At least 8 glasses of water daily.",
    "Add fibre to prevent constipation; avoid fried and spicy food.",
  ],
  followUpDate: daysAheadISO(4),
  warningSigns: [
    "Fever above 100.4°F (38°C)",
    "Increasing redness, swelling or pus at incision sites",
    "Heavy bleeding or wound opening",
    "Severe or worsening abdominal pain",
    "Persistent vomiting or inability to drink fluids",
    "Yellowing of eyes or skin",
    "Calf pain or leg swelling",
  ],
};

type Template = {
  category: TaskCategory;
  title: string;
  detail: string;
  slot: TimeSlot;
  time: string;
  important: boolean;
};

const templates: Template[] = [
  {
    category: "Medicine",
    title: "Pantoprazole 40 mg",
    detail: "1 tablet before breakfast",
    slot: "Morning",
    time: "07:30",
    important: true,
  },
  {
    category: "Medicine",
    title: "Cefuroxime 500 mg",
    detail: "1 tablet after breakfast (antibiotic)",
    slot: "Morning",
    time: "09:00",
    important: true,
  },
  {
    category: "Wound Care",
    title: "Dressing change",
    detail: "Clean the 4 incision sites and apply sterile gauze",
    slot: "Morning",
    time: "10:00",
    important: true,
  },
  {
    category: "Exercise",
    title: "Short indoor walk",
    detail: "5–10 minutes of slow walking indoors",
    slot: "Morning",
    time: "11:00",
    important: false,
  },
  {
    category: "Diet",
    title: "Low-fat lunch + 2 glasses water",
    detail: "Light, low-fat meal. Avoid fried and spicy food",
    slot: "Afternoon",
    time: "13:00",
    important: false,
  },
  {
    category: "Medicine",
    title: "Paracetamol 650 mg",
    detail: "1 tablet after lunch if pain",
    slot: "Afternoon",
    time: "14:00",
    important: false,
  },
  {
    category: "Exercise",
    title: "Deep breathing exercise",
    detail: "10 slow deep breaths, repeat twice",
    slot: "Afternoon",
    time: "16:00",
    important: false,
  },
  {
    category: "Medicine",
    title: "Cefuroxime 500 mg",
    detail: "1 tablet after dinner (antibiotic)",
    slot: "Evening",
    time: "20:30",
    important: true,
  },
  {
    category: "Exercise",
    title: "Evening walk",
    detail: "5–10 minutes of slow walking",
    slot: "Evening",
    time: "18:30",
    important: false,
  },
  {
    category: "Daily Check-in",
    title: "Daily symptom check-in",
    detail: "Answer a few quick questions about how you feel",
    slot: "Night",
    time: "21:00",
    important: true,
  },
  {
    category: "Medicine",
    title: "Paracetamol 650 mg",
    detail: "1 tablet at bedtime if pain",
    slot: "Night",
    time: "22:00",
    important: false,
  },
];

/** Converts recovery instructions into simple daily tasks for each recovery day. */
export function generateSchedule(days: number, currentDay: number, followUpDay: number): Task[] {
  const tasks: Task[] = [];
  for (let day = 1; day <= days; day++) {
    templates.forEach((t, i) => {
      tasks.push({
        id: `d${day}-t${i}`,
        day,
        ...t,
        status: "pending",
      });
    });
    if (day === followUpDay) {
      tasks.push({
        id: `d${day}-followup`,
        day,
        category: "Follow-up",
        title: "Follow-up visit with Dr. R. Menon",
        detail: "Sunrise Multispeciality Hospital, OPD 3 — carry your reports",
        slot: "Morning",
        time: "11:30",
        important: true,
        status: "pending",
      });
    }
  }
  // Seed realistic history so the demo shows adherence + repeated missed tasks.
  return tasks.map((task) => {
    if (task.day >= currentDay) return task;
    const seed = (task.day * 31 + task.id.length * 7 + task.time.charCodeAt(1)) % 10;
    if (task.category === "Wound Care" && task.day % 2 === 0) {
      return { ...task, status: "missed" as const };
    }
    if (seed === 3) return { ...task, status: "missed" as const };
    if (seed === 7) return { ...task, status: "skipped" as const };
    return { ...task, status: "completed" as const };
  });
}
