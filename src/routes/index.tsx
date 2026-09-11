import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  Bell,
  BellRing,
  Bot,
  CalendarCheck,
  Check,
  ClipboardCheck,
  Clock,
  HeartPulse,
  Pill,
  Salad,
  ShieldAlert,
  SkipForward,
  Timer,
  TrendingUp,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AssistantSheet } from "@/components/health/assistant-sheet";
import { CheckInDialog } from "@/components/health/checkin-dialog";
import { Onboarding } from "@/components/health/onboarding";
import { RecoveryTimeline } from "@/components/health/recovery-timeline";
import { RiskBadge, riskLabel } from "@/components/health/risk-badge";
import { RecoveryProvider, useRecovery } from "@/lib/recovery-store";
import type { TaskCategory, TimeSlot } from "@/lib/recovery-types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HealthyAI — Post-Operative Recovery Assistant" },
      {
        name: "description",
        content:
          "HealthyAI helps post-operative patients follow their recovery plan, track daily tasks, log symptoms and spot warning signs early.",
      },
      { property: "og:title", content: "HealthyAI — Post-Operative Recovery Assistant" },
      {
        property: "og:description",
        content:
          "Track recovery tasks, adherence, symptoms and risk levels with the RecoverAI Assistant.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RecoveryProvider>
      <App />
    </RecoveryProvider>
  ),
});

function App() {
  const { onboarded } = useRecovery();
  return onboarded ? <Dashboard /> : <Onboarding />;
}

const categoryIcons: Record<TaskCategory, React.ReactNode> = {
  Medicine: <Pill className="size-4" />,
  "Wound Care": <HeartPulse className="size-4" />,
  Exercise: <Activity className="size-4" />,
  Diet: <Salad className="size-4" />,
  "Follow-up": <CalendarCheck className="size-4" />,
  "Daily Check-in": <ClipboardCheck className="size-4" />,
};

const slots: TimeSlot[] = ["Morning", "Afternoon", "Evening", "Night"];

function Dashboard() {
  const s = useRecovery();
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

  const firstName = s.patient.name.split(" ")[0];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <HeartPulse className="size-5" />
            </span>
            <div className="leading-tight">
              <p className="font-bold">HealthyAI</p>
              <p className="text-[11px] text-muted-foreground">Post-Operative Recovery</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button size="sm" onClick={() => setAssistantOpen(true)}>
              <Bot className="size-4" /> <span className="hidden sm:inline">AI Assistant</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {/* Welcome */}
        <section className="overflow-hidden rounded-2xl bg-gradient-medical p-6 text-primary-foreground shadow-float">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm opacity-90">Welcome back,</p>
              <h1 className="text-2xl font-bold sm:text-3xl">{firstName}</h1>
              <p className="mt-1 text-sm opacity-90">
                Day {s.currentDay} of recovery · {s.patient.surgeryType}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setCheckInOpen(true)}>
                <ClipboardCheck className="size-4" /> Daily check-in
              </Button>
              <Button variant="secondary" onClick={() => setAssistantOpen(true)}>
                <Bot className="size-4" /> Ask RecoverAI
              </Button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<TrendingUp className="size-4" />}
            label="Adherence score"
            value={`${s.adherence}%`}
            hint="Completed tasks ÷ total tasks"
          >
            <Progress value={s.adherence} className="mt-3 h-2" />
          </StatCard>
          <StatCard
            icon={<Clock className="size-4" />}
            label="Recovery day"
            value={`Day ${s.currentDay}`}
            hint={`Surgery on ${new Date(`${s.patient.surgeryDate}T00:00:00`).toDateString()}`}
          />
          <StatCard
            icon={<ShieldAlert className="size-4" />}
            label="Current risk level"
            value={riskLabel[s.currentRisk]}
            hint={
              s.latestCheckIn
                ? "From your latest check-in"
                : "Complete today's check-in to update this"
            }
          />
          <StatCard
            icon={<CalendarCheck className="size-4" />}
            label="Next follow-up"
            value={new Date(`${s.report.followUpDate}T00:00:00`).toLocaleDateString(undefined, {
              day: "numeric",
              month: "short",
            })}
            hint={`${s.patient.doctor} · ${s.patient.hospital}`}
          />
        </section>

        {/* Alerts */}
        {s.repeatedMissed.length > 0 && (
          <Card className="border-medium/40 bg-medium-soft shadow-card">
            <CardContent className="flex flex-wrap items-start gap-3 py-5">
              <AlertTriangle className="mt-0.5 size-5 text-medium-foreground" />
              <div className="flex-1">
                <p className="font-semibold text-medium-foreground">
                  Important tasks missed repeatedly
                </p>
                <ul className="mt-1 space-y-0.5 text-sm text-medium-foreground/90">
                  {s.repeatedMissed.map((r) => (
                    <li key={r.title}>
                      {r.title} ({r.category}) — missed {r.count} times
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-sm text-medium-foreground/90">
                  Please try to complete these tasks and mention them at your follow-up visit.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {s.latestAlert && (
          <Card
            className={`shadow-card ${
              s.latestAlert.level === "high"
                ? "border-high/40 bg-high-soft"
                : "border-medium/40 bg-medium-soft"
            }`}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <BellRing className="size-4" /> Latest health alert
                <RiskBadge level={s.latestAlert.level} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{s.latestAlert.title}</p>
              <ul className="list-disc space-y-0.5 pl-5 opacity-90">
                {s.latestAlert.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <p className="opacity-90">{s.latestAlert.message}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Today's tasks */}
          <Card className="shadow-card lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardCheck className="size-4 text-primary" /> Today's tasks — Day{" "}
                {s.currentDay}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="Morning">
                <TabsList className="w-full">
                  {slots.map((slot) => (
                    <TabsTrigger key={slot} value={slot} className="flex-1 text-xs sm:text-sm">
                      {slot}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {slots.map((slot) => {
                  const list = s.todayTasks.filter((t) => t.slot === slot);
                  return (
                    <TabsContent key={slot} value={slot} className="mt-4 space-y-3">
                      {list.length === 0 && (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                          No tasks scheduled for the {slot.toLowerCase()}.
                        </p>
                      )}
                      {list.map((t) => (
                        <div
                          key={t.id}
                          className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3"
                        >
                          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            {categoryIcons[t.category]}
                          </span>
                          <div className="min-w-[9rem] flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold">{t.title}</p>
                              {t.important && (
                                <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                                  important
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {t.time} · {t.category} — {t.detail}
                            </p>
                          </div>
                          <StatusPill status={t.status} />
                          {t.status !== "completed" && (
                            <div className="flex gap-1.5">
                              <Button
                                size="sm"
                                onClick={() => {
                                  if (t.category === "Daily Check-in") {
                                    setCheckInOpen(true);
                                    return;
                                  }
                                  s.setTaskStatus(t.id, "completed");
                                  toast.success(`Completed: ${t.title}`);
                                }}
                              >
                                <Check className="size-4" /> Complete
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => s.snoozeTask(t.id)}
                                title="Snooze 30 minutes"
                              >
                                <Timer className="size-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => s.setTaskStatus(t.id, "missed")}
                                title="Mark missed"
                              >
                                <X className="size-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => s.setTaskStatus(t.id, "skipped")}
                                title="Skip"
                              >
                                <SkipForward className="size-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </TabsContent>
                  );
                })}
              </Tabs>
            </CardContent>
          </Card>

          {/* Reminders + category progress */}
          <div className="space-y-6">
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bell className="size-4 text-primary" /> Upcoming reminders
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {s.upcoming.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    All of today's tasks are recorded. Nice work!
                  </p>
                )}
                {s.upcoming.map((t) => (
                  <div key={t.id} className="rounded-xl border bg-muted/40 p-3">
                    <p className="text-sm font-semibold">
                      {t.time} — {t.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{t.detail}</p>
                    <div className="mt-2 flex gap-1.5">
                      <Button
                        size="sm"
                        onClick={() => {
                          if (t.category === "Daily Check-in") return setCheckInOpen(true);
                          s.setTaskStatus(t.id, "completed");
                          toast.success(`Completed: ${t.title}`);
                        }}
                      >
                        Complete
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => s.snoozeTask(t.id)}>
                        Snooze
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => s.setTaskStatus(t.id, "missed")}
                      >
                        Missed
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="size-4 text-primary" /> Progress by category
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {s.adherenceByCategory.map((c) => (
                  <div key={c.category}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium">{c.category}</span>
                      <span className="text-muted-foreground">{c.score}%</span>
                    </div>
                    <Progress value={c.score} className="h-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Timeline */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4 text-primary" /> Recovery timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RecoveryTimeline events={s.timeline} currentDay={s.currentDay} />
          </CardContent>
        </Card>

        <Separator />
        <footer className="pb-10 text-center text-xs text-muted-foreground">
          RecoverAI provides recovery assistance and does not replace professional medical advice.
          <br />
          In an emergency, contact your hospital or local emergency services immediately.
        </footer>
      </main>

      <Button
        onClick={() => setAssistantOpen(true)}
        className="fixed bottom-5 right-5 z-30 h-14 rounded-full px-5 shadow-float"
      >
        <Bot className="size-5" /> RecoverAI
      </Button>

      <CheckInDialog open={checkInOpen} onOpenChange={setCheckInOpen} />
      <AssistantSheet open={assistantOpen} onOpenChange={setAssistantOpen} />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className="shadow-card">
      <CardContent className="py-5">
        <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span className="text-primary">{icon}</span> {label}
        </p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        {children}
      </CardContent>
    </Card>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: "bg-low-soft text-low",
    missed: "bg-high-soft text-high",
    skipped: "bg-muted text-muted-foreground",
    snoozed: "bg-medium-soft text-medium-foreground",
    pending: "bg-secondary text-secondary-foreground",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${map[status]}`}>
      {status}
    </span>
  );
}

function NotificationBell() {
  const { notifications, unreadCount, markAllRead } = useRecovery();
  return (
    <Popover onOpenChange={(o) => o && markAllRead()}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <p className="border-b px-4 py-3 text-sm font-semibold">Notifications</p>
        <div className="max-h-80 divide-y overflow-y-auto">
          {notifications.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No notifications yet.
            </p>
          )}
          {notifications.map((n) => (
            <div key={n.id} className="px-4 py-3">
              <p className="text-sm font-medium">{n.title}</p>
              <p className="text-xs text-muted-foreground">{n.message}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                {n.kind}
              </p>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
