import type { CheckIn, RiskLevel } from "./recovery-types";

export type CheckInInput = Omit<
  CheckIn,
  "id" | "day" | "createdAt" | "risk" | "reasons" | "recommendation"
>;

const HIGH_KEYWORDS = [
  "chest pain",
  "breathless",
  "can't breathe",
  "cannot breathe",
  "shortness of breath",
  "fainted",
  "unconscious",
  "pus",
  "foul smell",
  "vomiting blood",
  "yellow eyes",
  "jaundice",
  "wound opened",
  "calf pain",
  "confused",
];

const MEDIUM_KEYWORDS = [
  "nausea",
  "vomit",
  "no appetite",
  "constipation",
  "cannot sleep",
  "burning urine",
  "chills",
  "headache",
  "tired",
  "weak",
  "itching",
  "swelling",
];

/** Rule-based analysis plus keyword-based reading of the free-text notes. */
export function analyzeCheckIn(input: CheckInInput): {
  risk: RiskLevel;
  reasons: string[];
  recommendation: string;
} {
  const reasons: string[] = [];
  let high = false;
  let medium = false;

  if (input.woundOpening) {
    high = true;
    reasons.push("You reported the wound opening up, which needs prompt review.");
  }
  if (input.bleeding) {
    high = true;
    reasons.push("Bleeding from the surgical site was reported.");
  }
  if (input.pain >= 8) {
    high = true;
    reasons.push(`Pain level reported as ${input.pain}/10, which is severe.`);
  } else if (input.pain >= 5) {
    medium = true;
    reasons.push(`Pain level reported as ${input.pain}/10, higher than expected at this stage.`);
  }
  if (input.fever && (input.redness || input.discharge)) {
    high = true;
    reasons.push("Fever together with wound redness or discharge was reported.");
  } else if (input.fever) {
    medium = true;
    reasons.push("Fever was reported in your check-in.");
  }
  if (input.redness) {
    medium = true;
    reasons.push("Redness or swelling around the wound was reported.");
  }
  if (input.discharge) {
    medium = true;
    reasons.push("Discharge from the wound was reported.");
  }
  if (input.legSwelling && input.dizziness) {
    high = true;
    reasons.push("Leg swelling together with dizziness was reported.");
  } else {
    if (input.legSwelling) {
      medium = true;
      reasons.push("Leg swelling was reported.");
    }
    if (input.dizziness) {
      medium = true;
      reasons.push("Dizziness was reported.");
    }
  }
  if (input.dehydration) {
    medium = true;
    reasons.push("Signs of dehydration (dry mouth, low urine, thirst) were reported.");
  }

  const text = `${input.otherSymptoms} ${input.notes}`.toLowerCase();
  const highHits = HIGH_KEYWORDS.filter((k) => text.includes(k));
  const mediumHits = MEDIUM_KEYWORDS.filter((k) => text.includes(k));
  if (highHits.length > 0) {
    high = true;
    reasons.push(`Your notes mention: ${highHits.join(", ")}.`);
  } else if (mediumHits.length > 0) {
    medium = true;
    reasons.push(`Your notes mention: ${mediumHits.join(", ")}.`);
  }

  const risk: RiskLevel = high ? "high" : medium ? "medium" : "low";
  if (reasons.length === 0) {
    reasons.push("No warning signs were reported in today's check-in.");
  }

  const recommendation =
    risk === "high"
      ? "Potential warning signs detected. Please contact your healthcare provider promptly, or go to the nearest emergency department if you feel unwell."
      : risk === "medium"
        ? "Some symptoms need watching. Keep following your recovery plan, rest, stay hydrated, and inform your doctor's clinic today if these symptoms continue or get worse."
        : "Your recovery looks on track. Keep following your medicines, wound care, gentle activity and diet instructions from your discharge plan.";

  return { risk, reasons, recommendation };
}
