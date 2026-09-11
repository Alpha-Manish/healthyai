import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { demoPatient, demoReport, generateSchedule, RECOVERY_DAYS } from "./demo-data";
import { analyzeCheckIn, type CheckInInput } from "./symptom-analysis";
import { analyzeCheckInWithAi } from "./symptom-analysis.functions";
import type {
  AlertItem,
  CheckIn,
  ExtractedReport,
  Notification,
  Patient,
  RiskLevel,
  Task,
  TaskCategory,
  TimelineEvent,
} from "./recovery-types";

export const TASK_CATEGORIES: TaskCategory[] = [
  "Medicine",
  "Wound Care",
  "Exercise",
  "Diet",
  "Follow-up",
  "Daily Check-in",
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function dayNumberFrom(surgeryDate: string) {
  const start = new Date(`${surgeryDate}T00:00:00`);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.round((now.getTime() - start.getTime()) / 86400000);
  return Math.min(Math.max(diff + 1, 1), RECOVERY_DAYS);
}

function dateForDay(surgeryDate: string, day: number) {
  const d = new Date(`${surgeryDate}T00:00:00`);
  d.setDate(d.getDate() + day - 1);
  return d.toISOString().slice(0, 10);
}

type Store = {
  onboarded: boolean;
  patient: Patient;
  report: ExtractedReport;
  tasks: Task[];
  checkIns: CheckIn[];
  alerts: AlertItem[];
  notifications: Notification[];
  currentDay: number;
  followUpDay: number;
  todayTasks: Task[];
  upcoming: Task[];
  adherence: number;
  adherenceByCategory: { category: TaskCategory; score: number; total: number }[];
  repeatedMissed: { category: TaskCategory; title: string; count: number }[];
  currentRisk: RiskLevel;
  latestCheckIn: CheckIn | null;
  latestAlert: AlertItem | null;
  unreadCount: number;
  timeline: TimelineEvent[];
  completeOnboarding: (patient: Patient, report: ExtractedReport) => void;
  setTaskStatus: (id: string, status: Task["status"]) => void;
  snoozeTask: (id: string) => void;
  submitCheckIn: (input: CheckInInput) => Promise<CheckIn>;
  markAllRead: () => void;
  resetDemo: () => void;
};

const RecoveryContext = createContext<Store | null>(null);

export function RecoveryProvider({ children }: { children: ReactNode }) {
  const [onboarded, setOnboarded] = useState(false);
  const [patient, setPatient] = useState<Patient>(demoPatient);
  const [report, setReport] = useState<ExtractedReport>(demoReport);

  const currentDay = dayNumberFrom(patient.surgeryDate);
  const followUpDay = useMemo(() => {
    const start = new Date(`${patient.surgeryDate}T00:00:00`);
    const f = new Date(`${report.followUpDate}T00:00:00`);
    return Math.max(1, Math.round((f.getTime() - start.getTime()) / 86400000) + 1);
  }, [patient.surgeryDate, report.followUpDate]);

  const [tasks, setTasks] = useState<Task[]>(() =>
    generateSchedule(RECOVERY_DAYS, dayNumberFrom(demoPatient.surgeryDate), 10),
  );
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>(() => [
    {
      id: uid(),
      createdAt: new Date().toISOString(),
      kind: "update",
      title: "Recovery plan ready",
      message: "Your daily recovery schedule was created from your discharge report.",
      read: false,
    },
    {
      id: uid(),
      createdAt: new Date().toISOString(),
      kind: "reminder",
      title: "Dressing change at 10:00",
      message: "Clean the incision sites and apply fresh sterile gauze.",
      read: false,
    },
  ]);

  const pushNotification = useCallback((n: Omit<Notification, "id" | "createdAt" | "read">) => {
    setNotifications((prev) => [
      { ...n, id: uid(), createdAt: new Date().toISOString(), read: false },
      ...prev,
    ]);
  }, []);

  const completeOnboarding = useCallback(
    (p: Patient, r: ExtractedReport) => {
      setPatient(p);
      setReport(r);
      const day = dayNumberFrom(p.surgeryDate);
      const start = new Date(`${p.surgeryDate}T00:00:00`);
      const f = new Date(`${r.followUpDate}T00:00:00`);
      const fDay = Math.max(1, Math.round((f.getTime() - start.getTime()) / 86400000) + 1);
      setTasks(generateSchedule(RECOVERY_DAYS, day, fDay));
      setOnboarded(true);
      pushNotification({
        kind: "update",
        title: "Daily schedule generated",
        message: `${r.medicines.length} medicines, wound care, activity and diet tasks added to your plan.`,
      });
    },
    [pushNotification],
  );

  const setTaskStatus = useCallback(
    (id: string, status: Task["status"]) => {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
      const task = tasks.find((t) => t.id === id);
      if (task && status === "missed" && task.important) {
        pushNotification({
          kind: "missed",
          title: `Missed: ${task.title}`,
          message: "This is an important recovery task. Try to complete it as soon as you can.",
        });
      }
    },
    [tasks, pushNotification],
  );

  const snoozeTask = useCallback(
    (id: string) => {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: "snoozed" } : t)));
      const task = tasks.find((t) => t.id === id);
      pushNotification({
        kind: "reminder",
        title: `Snoozed: ${task?.title ?? "Task"}`,
        message: "We will remind you again in 30 minutes.",
      });
    },
    [tasks, pushNotification],
  );

  const submitCheckIn = useCallback(
    async (input: CheckInInput) => {
      let analysis: { risk: RiskLevel; reasons: string[]; recommendation: string };
      try {
        analysis = await analyzeCheckInWithAi({
          data: { ...input, day: currentDay, surgeryType: patient.surgeryType },
        });
      } catch (error) {
        console.error("AI symptom analysis unavailable", error);
        analysis = analyzeCheckIn(input);
      }
      const entry: CheckIn = {
        ...input,
        ...analysis,
        id: uid(),
        day: currentDay,
        createdAt: new Date().toISOString(),
      };
      setCheckIns((prev) => [entry, ...prev]);
      setTasks((prev) =>
        prev.map((t) =>
          t.day === currentDay && t.category === "Daily Check-in"
            ? { ...t, status: "completed" }
            : t,
        ),
      );
      if (analysis.risk !== "low") {
        const alert: AlertItem = {
          id: uid(),
          createdAt: new Date().toISOString(),
          level: analysis.risk,
          title:
            analysis.risk === "high"
              ? "Potential warning signs detected"
              : "Symptoms that need watching",
          message: analysis.recommendation,
          reasons: analysis.reasons,
        };
        setAlerts((prev) => [alert, ...prev]);
        pushNotification({ kind: "alert", title: alert.title, message: alert.message });
      } else {
        pushNotification({
          kind: "update",
          title: "Check-in recorded — low risk",
          message: "No warning signs today. Keep following your recovery plan.",
        });
      }
      return entry;
    },
    [currentDay, pushNotification],
  );

  const todayTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.day === currentDay)
        .slice()
        .sort((a, b) => a.time.localeCompare(b.time)),
    [tasks, currentDay],
  );

  const upcoming = useMemo(() => {
    const now = new Date();
    const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const later = todayTasks.filter(
      (t) => (t.status === "pending" || t.status === "snoozed") && t.time >= hhmm,
    );
    const pool = later.length
      ? later
      : todayTasks.filter((t) => t.status === "pending" || t.status === "snoozed");
    return pool.slice(0, 4);
  }, [todayTasks]);

  const scored = useMemo(() => tasks.filter((t) => t.day <= currentDay), [tasks, currentDay]);

  const adherence = useMemo(() => {
    const done = scored.filter((t) => t.status === "completed").length;
    return scored.length ? Math.round((done / scored.length) * 100) : 0;
  }, [scored]);

  const adherenceByCategory = useMemo(
    () =>
      TASK_CATEGORIES.map((category) => {
        const items = scored.filter((t) => t.category === category);
        const done = items.filter((t) => t.status === "completed").length;
        return {
          category,
          total: items.length,
          score: items.length ? Math.round((done / items.length) * 100) : 0,
        };
      }).filter((c) => c.total > 0),
    [scored],
  );

  const repeatedMissed = useMemo(() => {
    const map = new Map<string, { category: TaskCategory; title: string; count: number }>();
    scored
      .filter((t) => t.status === "missed" && t.important)
      .forEach((t) => {
        const key = `${t.category}|${t.title}`;
        const existing = map.get(key);
        if (existing) existing.count += 1;
        else map.set(key, { category: t.category, title: t.title, count: 1 });
      });
    return [...map.values()].filter((m) => m.count >= 2).sort((a, b) => b.count - a.count);
  }, [scored]);

  const latestCheckIn = checkIns[0] ?? null;
  const latestAlert = alerts[0] ?? null;
  const currentRisk: RiskLevel = latestCheckIn
    ? latestCheckIn.risk
    : repeatedMissed.length > 0
      ? "medium"
      : "low";

  const timeline = useMemo<TimelineEvent[]>(() => {
    const events: TimelineEvent[] = [
      {
        id: "surgery",
        day: 1,
        date: patient.surgeryDate,
        kind: "surgery",
        label: "Surgery day",
        detail: patient.surgeryType,
      },
    ];
    for (let day = 1; day <= currentDay; day++) {
      const dayTasks = tasks.filter((t) => t.day === day);
      const done = dayTasks.filter((t) => t.status === "completed").length;
      const missed = dayTasks.filter((t) => t.status === "missed").length;
      events.push({
        id: `day-${day}`,
        day,
        date: dateForDay(patient.surgeryDate, day),
        kind: "task",
        label: `Day ${day}`,
        detail: `${done} completed · ${missed} missed of ${dayTasks.length} tasks`,
      });
    }
    checkIns.forEach((c) => {
      events.push({
        id: `ci-${c.id}`,
        day: c.day,
        date: dateForDay(patient.surgeryDate, c.day),
        kind: "checkin",
        label: `Check-in — pain ${c.pain}/10`,
        detail: c.reasons[0] ?? "",
        level: c.risk,
      });
    });
    alerts.forEach((a) => {
      events.push({
        id: `al-${a.id}`,
        day: currentDay,
        date: dateForDay(patient.surgeryDate, currentDay),
        kind: "alert",
        label: a.title,
        detail: a.message,
        level: a.level,
      });
    });
    events.push({
      id: "followup",
      day: followUpDay,
      date: report.followUpDate,
      kind: "followup",
      label: "Follow-up visit",
      detail: `${patient.doctor} · ${patient.hospital}`,
    });
    return events.sort((a, b) => a.day - b.day);
  }, [tasks, checkIns, alerts, currentDay, patient, report.followUpDate, followUpDay]);

  const value: Store = {
    onboarded,
    patient,
    report,
    tasks,
    checkIns,
    alerts,
    notifications,
    currentDay,
    followUpDay,
    todayTasks,
    upcoming,
    adherence,
    adherenceByCategory,
    repeatedMissed,
    currentRisk,
    latestCheckIn,
    latestAlert,
    unreadCount: notifications.filter((n) => !n.read).length,
    timeline,
    completeOnboarding,
    setTaskStatus,
    snoozeTask,
    submitCheckIn,
    markAllRead: () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))),
    resetDemo: () => setOnboarded(false),
  };

  return <RecoveryContext.Provider value={value}>{children}</RecoveryContext.Provider>;
}

export function useRecovery() {
  const ctx = useContext(RecoveryContext);
  if (!ctx) throw new Error("useRecovery must be used inside RecoveryProvider");
  return ctx;
}
