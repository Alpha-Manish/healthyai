import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/recovery-types";

const config: Record<RiskLevel, { label: string; dot: string; wrap: string }> = {
  low: {
    label: "Low risk",
    dot: "bg-low",
    wrap: "bg-low-soft text-low border-low/30",
  },
  medium: {
    label: "Medium risk",
    dot: "bg-medium",
    wrap: "bg-medium-soft text-medium-foreground border-medium/40",
  },
  high: {
    label: "High risk",
    dot: "bg-high",
    wrap: "bg-high-soft text-high border-high/30",
  },
};

export function RiskBadge({
  level,
  className,
  label,
}: {
  level: RiskLevel;
  className?: string;
  label?: string;
}) {
  const c = config[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
        c.wrap,
        className,
      )}
    >
      <span className={cn("size-2 rounded-full", c.dot)} />
      {label ?? c.label}
    </span>
  );
}

export const riskLabel: Record<RiskLevel, string> = {
  low: "🟢 Low",
  medium: "🟡 Medium",
  high: "🔴 High",
};
