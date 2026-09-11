import { useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { RiskBadge } from "./risk-badge";
import { useRecovery } from "@/lib/recovery-store";
import type { CheckIn } from "@/lib/recovery-types";

const symptomFields = [
  { key: "fever", label: "Fever or chills" },
  { key: "redness", label: "Wound redness or swelling" },
  { key: "bleeding", label: "Bleeding from the wound" },
  { key: "discharge", label: "Discharge or pus from the wound" },
  { key: "woundOpening", label: "Wound opening up" },
  { key: "dizziness", label: "Dizziness or feeling faint" },
  { key: "dehydration", label: "Dehydration signs (dry mouth, low urine)" },
  { key: "legSwelling", label: "Leg swelling or calf pain" },
] as const;

type Flags = Record<(typeof symptomFields)[number]["key"], boolean>;

const emptyFlags: Flags = {
  fever: false,
  redness: false,
  bleeding: false,
  discharge: false,
  woundOpening: false,
  dizziness: false,
  dehydration: false,
  legSwelling: false,
};

export function CheckInDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { submitCheckIn } = useRecovery();
  const [pain, setPain] = useState(3);
  const [flags, setFlags] = useState<Flags>(emptyFlags);
  const [temperature, setTemperature] = useState("");
  const [otherSymptoms, setOtherSymptoms] = useState("");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<CheckIn | null>(null);
  const [analysing, setAnalysing] = useState(false);

  function reset() {
    setPain(3);
    setFlags(emptyFlags);
    setTemperature("");
    setOtherSymptoms("");
    setNotes("");
    setResult(null);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="size-5 text-primary" />
            {result ? "Check-in reviewed" : "Daily check-in"}
          </DialogTitle>
          <DialogDescription>
            {result
              ? "Here's what we noticed in your answers."
              : "A few quick questions about how you're feeling today."}
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-5">
            <div className="space-y-3 rounded-xl border bg-muted/40 p-4">
              <div className="flex items-center justify-between">
                <Label>Pain level</Label>
                <span className="text-sm font-semibold text-primary">{pain}/10</span>
              </div>
              <Slider
                value={[pain]}
                min={0}
                max={10}
                step={1}
                onValueChange={(v) => setPain(v[0] ?? 0)}
              />

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>No pain</span>
                <span>Worst pain</span>
              </div>
            </div>

            <div className="space-y-1">
              {symptomFields.map((f) => (
                <div
                  key={f.key}
                  className="flex items-center justify-between rounded-lg px-1 py-2 text-sm"
                >
                  <Label htmlFor={f.key} className="font-normal">
                    {f.label}
                  </Label>
                  <Switch
                    id={f.key}
                    checked={flags[f.key]}
                    onCheckedChange={(v) => setFlags({ ...flags, [f.key]: v })}
                  />
                </div>
              ))}
            </div>

            {flags.fever && (
              <div className="space-y-1.5">
                <Label htmlFor="temp">Temperature (optional)</Label>
                <Input
                  id="temp"
                  value={temperature}
                  placeholder="e.g. 100.8 °F"
                  onChange={(e) => setTemperature(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="other">Other symptoms</Label>
              <Input
                id="other"
                value={otherSymptoms}
                placeholder="e.g. nausea, headache"
                onChange={(e) => setOtherSymptoms(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes for your care team</Label>
              <Textarea
                id="notes"
                rows={3}
                value={notes}
                placeholder="Anything else you want to record about today…"
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              disabled={analysing}
              onClick={async () => {
                setAnalysing(true);
                try {
                  const entry = await submitCheckIn({
                    pain,
                    temperature,
                    otherSymptoms,
                    notes,
                    ...flags,
                  });
                  setResult(entry);
                } finally {
                  setAnalysing(false);
                }
              }}
            >
              {analysing ? "Analysing your symptoms…" : "Submit check-in"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <RiskBadge level={result.risk} className="text-sm" />
            <div>
              <h4 className="text-sm font-semibold">Why this risk level</h4>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {result.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
            <Separator />
            <div className="rounded-xl border bg-primary/5 p-4 text-sm">
              <h4 className="mb-1 font-semibold text-primary">Recommendation</h4>
              <p className="text-muted-foreground">{result.recommendation}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              This is recovery guidance only, not a diagnosis. RecoverAI does not replace
              professional medical advice.
            </p>
            <Button
              className="w-full"
              onClick={() => {
                onOpenChange(false);
                reset();
              }}
            >
              Back to dashboard
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
