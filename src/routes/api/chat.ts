import { createFileRoute } from "@tanstack/react-router";
import { streamText, type ModelMessage } from "ai";
import {
  RECOVERY_MODEL,
  createLovableAiGatewayProvider,
  getLovableAiGatewayRunId,
} from "@/lib/ai-gateway.server";

const SYSTEM = `You are "RecoverAI Assistant", a post-surgery recovery companion inside a patient's recovery app.

STRICT SAFETY RULES — never break these:
- You are NOT a doctor. Never diagnose, never name a possible disease or infection, never prescribe, never suggest starting/stopping a medicine, and never suggest changing a dose, timing or brand.
- If the patient asks for a diagnosis, a new medicine, a dose change, or "do I have X?", refuse clearly and warmly and tell them only their doctor or care team can answer that. Then offer help with the plan they already have.
- If the message describes emergency warning signs (severe chest pain, trouble breathing, heavy bleeding, fainting, wound opening, high fever with pus/foul smell), tell them to contact their care team immediately or go to the nearest emergency department.
- Only use facts from the RECOVERY CONTEXT below. Never invent medicines, doses, dates, tasks or test results. If something is not in the context, say you don't have it in their plan and suggest asking the care team.

STYLE:
- Warm, calm, short. Plain language a patient understands, no medical jargon.
- Use markdown: **bold** for key items, "- " bullet lists for tasks. Keep replies under about 150 words.
- End every reply on its own line with exactly: _RecoverAI provides recovery assistance and does not replace professional medical advice._`;

type Body = {
  messages?: { role: "user" | "assistant"; content: string }[];
  context?: string;
};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return new Response("The AI assistant is not configured yet.", { status: 500 });
        }

        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return new Response("Invalid request.", { status: 400 });
        }

        const history = (body.messages ?? [])
          .filter((m) => typeof m.content === "string" && m.content.trim().length > 0)
          .slice(-12);

        if (history.length === 0) {
          return new Response("No question was sent.", { status: 400 });
        }

        const messages: ModelMessage[] = history.map(
          (m) => ({ role: m.role, content: m.content }) as ModelMessage,
        );

        const system = `${SYSTEM}\n\nRECOVERY CONTEXT (the patient's own data):\n${
          body.context ?? "No recovery data available."
        }`;

        const initialRunId = getLovableAiGatewayRunId(request);
        const gateway = createLovableAiGatewayProvider(apiKey, initialRunId);

        try {
          const result = streamText({
            model: gateway(RECOVERY_MODEL),
            system,
            messages,
            abortSignal: request.signal,
            onError: ({ error }) => console.error("chat stream error", error),
          });

          return result.toTextStreamResponse();
        } catch (error) {
          console.error("chat route error", error);
          const status =
            typeof error === "object" && error && "statusCode" in error
              ? Number((error as { statusCode: unknown }).statusCode)
              : 500;
          const message =
            status === 429
              ? "The assistant is busy right now. Please try again in a moment."
              : status === 402
                ? "The AI assistant is out of credits. Please contact the app owner."
                : "The assistant couldn't answer just now. Please try again.";
          return new Response(message, { status: status || 500 });
        }
      },
    },
  },
});
