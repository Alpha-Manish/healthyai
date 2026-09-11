# Real AI for the RecoverAI assistant

Right now the project workspace is empty and the app only exists in the uploaded ZIP. Its assistant answers questions from a fixed list of keyword rules, and the symptom check-in scores risk by matching words like "chest pain". Both will be replaced with real Gemini answers, powered by the built-in AI that comes with the app (no key to paste, no external account).

## What gets built

1. **Restore the app** — bring the uploaded project (home screen, timeline, check-in dialog, onboarding, assistant panel, styling) into the workspace so it runs in the preview.
2. **Live AI chat assistant** — the assistant panel streams real answers from Gemini instead of canned text. Each question is sent along with a compact snapshot of the patient's own recovery data (name, day number, today's tasks, missed tasks, medicines, upcoming follow-ups, recent check-ins) so answers stay personal and grounded.
3. **Safety rules kept** — the same boundaries as today, now enforced through the AI's instructions plus a server-side guard: no diagnosis, no prescribing, no dose changes, always redirect those to the care team, and always append the medical disclaimer.
4. **AI symptom analysis** — when a check-in is submitted, the symptoms and vitals go to Gemini, which returns a risk level (low / medium / high), the reasons behind it, and a recommendation. The existing keyword scoring stays as an instant fallback if the AI is unreachable, so a check-in never fails to save.
5. **Visible states** — a typing indicator while the assistant answers, a short "analysing" state on the check-in, and a plain-language message if the AI is temporarily unavailable.

## Technical notes

- Chat: streaming server route `src/routes/api/chat.ts` using the AI SDK (`streamText`) with the Lovable AI Gateway provider helper in `src/lib/ai-gateway.server.ts`; client switches to `useChat` with `DefaultChatTransport`. Model: `google/gemini-3.8-flash`.
- Symptom analysis: `createServerFn` in `src/lib/symptom-analysis.functions.ts` using `streamText` + `Output.object` with a small, constraint-free schema (`risk`, `reasons[]`, `recommendation`), wrapped in a `NoObjectGeneratedError` guard that falls back to the current `analyzeCheckIn` heuristic. `recovery-store.tsx` awaits the server function and keeps the local result as fallback.
- Recovery context is serialised on the client and sent with each request; no database is added, state stays where it is today.
- `LOVABLE_API_KEY` is read server-side only; gateway errors (rate limit, credits) surface as readable in-app messages.
