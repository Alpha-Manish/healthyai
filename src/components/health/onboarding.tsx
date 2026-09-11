import { useState } from "react";
import {
  Activity,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  FileText,
  HeartPulse,
  Loader2,
  Pill,
  ShieldAlert,
  Stethoscope,
  Salad,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { demoPatient, demoReport } from "@/lib/demo-data";
import { useRecovery } from "@/lib/recovery-store";
import type { Patient } from "@/lib/recovery-types";

const fields: { key: keyof Patient; label: string; type?: string; placeholder: string }[] = [
  { key: "name", label: "Full name", placeholder: "Anita Sharma" },
  { key: "age", label: "Age", type: "number", placeholder: "46" },
  { key: "surgeryType", label: "Surgery type", placeholder: "Gallbladder removal" },
  { key: "surgeryDate", label: "Surgery date", type: "date", placeholder: "" },
  { key: "doctor", label: "Doctor", placeholder: "Dr. R. Menon" },
  { key: "hospital", label: "Hospital", placeholder: "Sunrise Hospital" },
  { key: "phone", label: "Contact number", placeholder: "+91 98200 41122" },
  { key: "email", label: "Email", type: "email", placeholder: "you@example.com" },
];

export function Onboarding() {
  const { completeOnboarding } = useRecovery();
  const [step, setStep] = useState(1);
  const [patient, setPatient] = useState<Patient>({ ...demoPatient });
  const [fileName, setFileName] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(false);

  const report = demoReport;

  function runExtraction(name: string) {
    setFileName(name);
    setExtracting(true);
    setExtracted(false);
    setTimeout(() => {
      setExtracting(false);
      setExtracted(true);
      toast.success("Report processed", {
        description: "Recovery details were extracted. Please review them below.",
      });
    }, 1600);
  }

  return (
    <main className="min-h-screen bg-gradient-medical/5">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-16">
        <header className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-float">
            <HeartPulse className="size-7" />
          </div>
          <h1 className="text-3xl font-bold sm:text-4xl">HealthyAI</h1>
          <p className="mt-2 text-muted-foreground">
            Post-Operative Recovery Assistant — set up your recovery plan in three quick steps.
          </p>
        </header>

        <div className="mb-6 flex items-center justify-center gap-2">
          {["Registration", "Report import", "Review"].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  step === i + 1
                    ? "bg-primary text-primary-foreground"
                    : step > i + 1
                      ? "bg-low-soft text-low"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}. {label}
              </span>
              {i < 2 && <span className="h-px w-4 bg-border sm:w-8" />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Stethoscope className="size-5 text-primary" /> Patient registration
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {fields.map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <Label htmlFor={f.key}>{f.label}</Label>
                  <Input
                    id={f.key}
                    type={f.type ?? "text"}
                    value={patient[f.key]}
                    placeholder={f.placeholder}
                    onChange={(e) => setPatient({ ...patient, [f.key]: e.target.value })}
                  />
                </div>
              ))}
              <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 pt-2">
                <p className="text-xs text-muted-foreground">
                  Demo details are pre-filled — edit anything you like.
                </p>
                <Button
                  onClick={() => {
                    if (!patient.name || !patient.surgeryDate) {
                      toast.error("Please add your name and surgery date.");
                      return;
                    }
                    setStep(2);
                  }}
                >
                  Continue <ArrowRight className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="size-5 text-primary" /> Medical report import
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 px-6 py-10 text-center transition-colors hover:bg-primary/10">
                <Upload className="size-8 text-primary" />
                <span className="font-medium">Upload your discharge summary (PDF or document)</span>
                <span className="text-xs text-muted-foreground">
                  We read the instructions and turn them into daily tasks
                </span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) runExtraction(f.name);
                  }}
                />
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => runExtraction("discharge-summary-demo.pdf")}
                  disabled={extracting}
                >
                  Use demo report
                </Button>
                {fileName && (
                  <span className="text-sm text-muted-foreground">
                    {extracting ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" /> Extracting from {fileName}…
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-low">
                        <CheckCircle2 className="size-4" /> {fileName}
                      </span>
                    )}
                  </span>
                )}
              </div>

              <Separator />
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button disabled={!extracted} onClick={() => setStep(3)}>
                  Review extracted details <ArrowRight className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="size-5 text-primary" /> Review your recovery information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <Section icon={<Stethoscope className="size-4" />} title="Surgery details">
                <p>{report.surgeryDetails}</p>
              </Section>
              <Section icon={<Pill className="size-4" />} title="Medicines">
                <ul className="space-y-1">
                  {report.medicines.map((m) => (
                    <li key={m.name}>
                      <span className="font-medium text-foreground">{m.name}</span> — {m.dose},{" "}
                      {m.schedule}
                    </li>
                  ))}
                </ul>
              </Section>
              <Section icon={<HeartPulse className="size-4" />} title="Wound care">
                <List items={report.woundCare} />
              </Section>
              <Section icon={<Activity className="size-4" />} title="Activity restrictions">
                <List items={report.activity} />
              </Section>
              <Section icon={<Salad className="size-4" />} title="Diet">
                <List items={report.diet} />
              </Section>
              <Section icon={<CalendarClock className="size-4" />} title="Follow-up">
                <p>
                  {new Date(`${report.followUpDate}T00:00:00`).toDateString()} with {patient.doctor}
                </p>
              </Section>
              <Section icon={<ShieldAlert className="size-4" />} title="Warning signs">
                <List items={report.warningSigns} />
              </Section>

              <Separator />
              <div className="flex flex-wrap justify-between gap-3">
                <Button variant="ghost" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  onClick={() => {
                    completeOnboarding(patient, report);
                    toast.success("Recovery schedule generated");
                  }}
                >
                  Confirm & generate daily schedule <ArrowRight className="size-4" />
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                RecoverAI provides recovery assistance and does not replace professional medical
                advice.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-muted/40 p-4">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
        {icon} {title}
      </h3>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );
}
