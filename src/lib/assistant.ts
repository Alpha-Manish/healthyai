import type { useRecovery } from "./recovery-store";

type Store = ReturnType<typeof useRecovery>;

const DISCLAIMER =
  "\n\n_RecoverAI provides recovery assistance and does not replace professional medical advice._";

const REFUSAL =
  "I can't advise on diagnoses, new medicines or dose changes — only your doctor can do that. I can help you follow the recovery plan already in your discharge report. For anything about your condition or medication changes, please contact " +
  "your care team.";

const UNSAFE = [
  "diagnose",
  "what disease",
  "do i have",
  "prescribe",
  "increase dose",
  "double dose",
  "stop taking",
  "extra tablet",
  "change dose",
  "which antibiotic",
  "is it cancer",
  "infection?",
];

function fmtDate(d: string) {
  return new Date(`${d}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function answerQuestion(q: string, s: Store): string {
  const t = q.toLowerCase().trim();

  if (UNSAFE.some((k) => t.includes(k))) return REFUSAL + DISCLAIMER;

  if (/(today|need to do|to-?do|task today|schedule)/.test(t)) {
    const pending = s.todayTasks.filter((x) => x.status === "pending" || x.status === "snoozed");
    const lines = pending.map((x) => `- **${x.time} · ${x.category}** — ${x.title}`);
    return (
      `Here's what's left for Day ${s.currentDay} of your recovery:\n${lines.join("\n") || "- Nothing pending, everything for today is recorded. 🎉"}` +
      DISCLAIMER
    );
  }

  if (/(missed|skipped|forgot)/.test(t)) {
    const missed = s.tasks.filter((x) => x.day <= s.currentDay && x.status === "missed");
    const grouped = new Map<string, number>();
    missed.forEach((m) => grouped.set(m.title, (grouped.get(m.title) ?? 0) + 1));
    const lines = [...grouped.entries()].map(([title, count]) => `- ${title} — ${count}×`);
    return (
      `You have ${missed.length} missed task${missed.length === 1 ? "" : "s"} so far:\n${lines.join("\n") || "- None so far, well done."}` +
      (s.repeatedMissed.length
        ? `\n\n⚠️ Repeatedly missed important tasks: ${s.repeatedMissed.map((r) => r.title).join(", ")}. Please mention this at your follow-up.`
        : "") +
      DISCLAIMER
    );
  }

  if (/(next medicine|next medication|next tablet|when.*medicine)/.test(t)) {
    const next = s.todayTasks.find((x) => x.category === "Medicine" && x.status === "pending");
    return next
      ? `Your next medicine is **${next.title}** at **${next.time}** — ${next.detail}.` + DISCLAIMER
      : "No more medicine doses are pending in today's schedule." + DISCLAIMER;
  }

  if (/(follow-?up|appointment|next visit)/.test(t)) {
    return (
      `Your follow-up visit is on **${fmtDate(s.report.followUpDate)}** (recovery day ${s.followUpDay}) with ${s.patient.doctor} at ${s.patient.hospital}.` +
      DISCLAIMER
    );
  }

  if (/(summar|my plan|recovery plan|overview)/.test(t)) {
    return (
      `**Your recovery plan**\n- Surgery: ${s.patient.surgeryType} (day ${s.currentDay} of recovery)\n- Medicines: ${s.report.medicines
        .map((m) => `${m.name} — ${m.schedule}`)
        .join("; ")}\n- Wound care: ${s.report.woundCare.join(" ")}\n- Activity: ${s.report.activity.join(" ")}\n- Diet: ${s.report.diet.join(" ")}\n- Follow-up: ${fmtDate(s.report.followUpDate)}\n- Adherence so far: ${s.adherence}%` +
      DISCLAIMER
    );
  }

  if (/(wound|dressing|bandage|stitch)/.test(t)) {
    return `**Wound care instructions from your report**\n${s.report.woundCare.map((w) => `- ${w}`).join("\n")}` + DISCLAIMER;
  }

  if (/(eat|food|diet|drink|water)/.test(t)) {
    return `**Diet instructions from your report**\n${s.report.diet.map((w) => `- ${w}`).join("\n")}` + DISCLAIMER;
  }

  if (/(walk|exercise|activity|lift|drive|gym)/.test(t)) {
    return `**Activity and restrictions from your report**\n${s.report.activity.map((w) => `- ${w}`).join("\n")}` + DISCLAIMER;
  }

  if (/(warning sign|danger|emergency|when.*doctor|call doctor)/.test(t)) {
    return (
      `Contact your healthcare provider promptly if you notice:\n${s.report.warningSigns.map((w) => `- ${w}`).join("\n")}\n\nFor severe bleeding, breathing difficulty or fainting, seek emergency care immediately.` +
      DISCLAIMER
    );
  }

  if (/(risk|how am i doing|progress|adherence|score)/.test(t)) {
    return (
      `Your current risk level is **${s.currentRisk.toUpperCase()}** and your adherence score is **${s.adherence}%**.` +
      (s.latestCheckIn
        ? `\n\nFrom your last check-in: ${s.latestCheckIn.reasons.join(" ")}\n\n${s.latestCheckIn.recommendation}`
        : "\n\nComplete today's daily check-in so I can review your symptoms.") +
      DISCLAIMER
    );
  }

  if (/(pain|hurt|ache)/.test(t)) {
    return (
      "Some discomfort is expected after surgery. Your report allows Paracetamol 650 mg as advised by your doctor — follow the schedule exactly as written, do not add doses. If pain is severe (8+/10), worsening, or comes with fever, contact your healthcare provider promptly." +
      DISCLAIMER
    );
  }

  return (
    `I can help with your recovery plan for day ${s.currentDay}. Try asking:\n- "What do I need to do today?"\n- "What tasks have I missed?"\n- "When is my next medicine?"\n- "When is my follow-up?"\n- "Summarize my recovery plan."` +
    DISCLAIMER
  );
}

export const SUGGESTED_QUESTIONS = [
  "What do I need to do today?",
  "What tasks have I missed?",
  "When is my next medicine?",
  "When is my follow-up?",
  "Summarize my recovery plan.",
  "What are my warning signs?",
];
