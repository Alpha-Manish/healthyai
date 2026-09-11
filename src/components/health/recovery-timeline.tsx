import {
  Activity,
  AlertTriangle,
  CalendarCheck,
  ClipboardCheck,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";
import type { TimelineEvent } from "@/lib/recovery-types";
import { RiskBadge } from "./risk-badge";

const icons: Record<TimelineEvent["kind"], React.ReactNode> = {
  surgery: <Stethoscope className="size-4" />,
  task: <Activity className="size-4" />,
  checkin: <ClipboardCheck className="size-4" />,
  risk: <ShieldAlert className="size-4" />,
  alert: <AlertTriangle className="size-4" />,
  followup: <CalendarCheck className="size-4" />,
};

export function RecoveryTimeline({
  events,
  currentDay,
}: {
  events: TimelineEvent[];
  currentDay: number;
}) {
  return (
    <ol className="relative space-y-4 border-l border-border pl-6">
      {events.map((e) => (
        <li key={e.id} className="relative">
          <span
            className={`absolute -left-[34px] flex size-7 items-center justify-center rounded-full border-2 border-background ${
              e.kind === "alert"
                ? "bg-high-soft text-high"
                : e.day > currentDay
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary/10 text-primary"
            }`}
          >
            {icons[e.kind]}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{e.label}</p>
            {e.level && <RiskBadge level={e.level} />}
            {e.day > currentDay && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                upcoming
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date(`${e.date}T00:00:00`).toLocaleDateString(undefined, {
              day: "numeric",
              month: "short",
            })}{" "}
            · {e.detail}
          </p>
        </li>
      ))}
    </ol>
  );
}
