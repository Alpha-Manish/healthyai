import { createServerFn } from "@tanstack/react-start";
import { NoObjectGeneratedError, Output, streamText } from "ai";
import { z } from "zod";
import { analyzeCheckIn, type CheckInInput } from "./symptom-analysis";
import type { RiskLevel } from "./recovery-types";

export type CheckInAnalysis = {
  risk: RiskLevel;
  reasons: string[];
  recommendation: string;
};

const inputSchema = z.object({
  pain: z.number(),
  fever: z.boolean(),
  temperature: z.string(),
  redness: z.boolean(),
  bleeding: z.boolean(),
  discharge: z.boolean(),
  woundOpening: z.boolean(),
  dizziness: z.boolean(),
  dehydration: z.boolean(),
  legSwelling: z.boolean(),
  otherSymptoms: z.string(),
  notes: z.string(),
  day: z.number().optional(),
  surgeryType: z.string().optional(),
});

const outputSchema = z.object({
  risk: z.enum(["low", "medium", "high"]),
  reasons: z.array(z.string()),
  recommendation: z.string(),
});

const SYSTEM = `You triage a post-surgery patient's daily symptom check-in inside a recovery app.

Return:
- risk: "high" for possible emergencies or serious complications (wound opening, bleeding, severe pain 8+/10, fever with pus/redness/discharge, leg swelling with dizziness, breathing or chest problems), "medium" for symptoms that need watching, "low" when nothing concerning is reported.
- reasons: 1-4 short sentences in plain language, each naming a specific thing the patient reported. Only mention what was actually reported.
- recommendation: 1-3 short sentences of practical next steps.

RULES: never diagnose, never name a disease or infection, never suggest or change any medicine or dose. For high risk, tell the patient to contact their care team promptly or go to the nearest emergency department. Warm, calm, no medical jargon. Be conservative: when unsure, choose the higher risk level.`;

function describe(data: z.infer<typeof inputSchema>) {
  const flags = [
    data.fever && "fever",
    data.redness && "redness or swelling around the wound",
    data.bleeding && "bleeding from the wound",
    data.discharge && "discharge from the wound",
    data.woundOpening && "the wound opening up",
    data.dizziness && "dizziness",
    data.dehydration && "signs of dehydration",
    data.legSwelling && "leg swelling",
  ].filter(Boolean) as string[];

  return [
    data.surgeryType ? `Surgery: ${data.surgeryType}.` : null,
    data.day ? `Recovery day: ${data.day}.` : null,
    `Pain: ${data.pain}/10.`,
    `Temperature: ${data.temperature || "not recorded"}.`,
    `Reported symptoms: ${flags.length ? flags.join(", ") : "none of the checklist symptoms"}.`,
    `Other symptoms: ${data.otherSymptoms || "none"}.`,
    `Patient notes: ${data.notes || "none"}.`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Escalates the AI risk to the rule-based risk when the rules are more cautious. */
function merge(ai: CheckInAnalysis, rules: CheckInAnalysis): CheckInAnalysis {
  const order: RiskLevel[] = ["low", "medium", "high"];
  const risk = order.indexOf(rules.risk) > order.indexOf(ai.risk) ? rules.risk : ai.risk;
  const reasons = ai.reasons.length ? ai.reasons : rules.reasons;
  return {
    risk,
    reasons: reasons.slice(0, 4),
    recommendation: ai.recommendation.trim() || rules.recommendation,
  };
}

export const analyzeCheckInWithAi = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<CheckInAnalysis> => {
    const rules = analyzeCheckIn(data as CheckInInput);
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return rules;

    const { createLovableAiGatewayProvider, RECOVERY_MODEL } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(apiKey);

    try {
      const result = streamText({
        model: gateway(RECOVERY_MODEL),
        system: SYSTEM,
        prompt: `Today's check-in:\n${describe(data)}`,
        output: Output.object({ schema: outputSchema }),
      });
      const output = (await result.output) as CheckInAnalysis;
      return merge(output, rules);
    } catch (error) {
      if (!NoObjectGeneratedError.isInstance(error)) {
        console.error("symptom analysis failed", error);
      }
      return rules;
    }
  });
