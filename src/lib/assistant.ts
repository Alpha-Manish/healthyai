import type { useRecovery } from "./recovery-store";

type Store = ReturnType<typeof useRecovery>;

export const DISCLAIMER =
  "_RecoverAI provides recovery assistance and does not replace professional medical advice._";

export const SUGGESTED_QUESTIONS = [
  "What do I need to do today?",
  "What tasks have I missed?",
  "When is my next medicine?",
  "When is my follow-up?",
  "Summarize my recovery plan.",
  "What are my warning signs?",
];

function fmtDate(d: string) {
  return new Date(`${d}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/**
 * Compact, human-readable snapshot of the patient's own recovery data.
 * Sent with every assistant question so answers stay grounded in the plan.
 */
export function buildRecoveryContext(s: Store): string {
  const p = s.patient;
  const r = s.report;

  const pending = s.todayTasks
    .filter((t) => t.status === "pending" || t.status === "snoozed")
    .map((t) => `- ${t.time} · ${t.category} · ${t.title} (${t.detail})`);

  const doneToday = s.todayTasks
    .filter((t) => t.status === "completed")
    .map((t) => `- ${t.time} · ${t.title}`);

  const missed = s.tasks
    .filter((t) => t.day <= s.currentDay && t.status === "missed")
    .map((t) => `- Day ${t.day} · ${t.title}`);

  const upcoming = s.upcoming.slice(0, 6).map((t) => `- Day ${t.day} · ${t.time} · ${t.title}`);

  const checkIns = s.checkIns
    .slice(0, 3)
    .map(
      (c) =>
        `- Day ${c.day}: risk ${c.risk}, pain ${c.pain}/10${c.fever ? ", fever" : ""}${
          c.redness ? ", redness" : ""
        }${c.discharge ? ", discharge" : ""}${c.notes ? `, notes: ${c.notes}` : ""}`,
    );

  return [
    `PATIENT: ${p.name}, age ${p.age}. Surgery: ${p.surgeryType} on ${fmtDate(p.surgeryDate)}.`,
    `Care team: ${p.doctor} at ${p.hospital}.`,
    `Recovery day ${s.currentDay}. Adherence ${s.adherence}%. Current risk level: ${s.currentRisk}.`,
    `Follow-up appointment: ${fmtDate(r.followUpDate)} (recovery day ${s.followUpDay}).`,
    ``,
    `DISCHARGE SUMMARY: ${r.surgeryDetails}`,
    `MEDICINES:\n${r.medicines.map((m) => `- ${m.name} ${m.dose} — ${m.schedule}`).join("\n")}`,
    `WOUND CARE:\n${r.woundCare.map((x) => `- ${x}`).join("\n")}`,
    `ACTIVITY:\n${r.activity.map((x) => `- ${x}`).join("\n")}`,
    `DIET:\n${r.diet.map((x) => `- ${x}`).join("\n")}`,
    `WARNING SIGNS:\n${r.warningSigns.map((x) => `- ${x}`).join("\n")}`,
    ``,
    `TODAY'S PENDING TASKS:\n${pending.join("\n") || "- none, everything for today is recorded"}`,
    `TODAY'S COMPLETED TASKS:\n${doneToday.join("\n") || "- none yet"}`,
    `MISSED TASKS SO FAR:\n${missed.join("\n") || "- none"}`,
    `REPEATEDLY MISSED:\n${
      s.repeatedMissed.map((x) => `- ${x.title} (${x.count}×)`).join("\n") || "- none"
    }`,
    `UPCOMING TASKS:\n${upcoming.join("\n") || "- none scheduled"}`,
    `RECENT CHECK-INS:\n${checkIns.join("\n") || "- no check-ins recorded yet"}`,
  ].join("\n");
}
