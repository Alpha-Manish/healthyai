import { useEffect, useRef, useState } from "react";
import { Bot, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { answerQuestion, SUGGESTED_QUESTIONS } from "@/lib/assistant";
import { useRecovery } from "@/lib/recovery-store";

type Msg = { id: number; role: "user" | "assistant"; text: string };

/** Very small markdown renderer for **bold**, _italic_ and "- " lists. */
function RichText({ text }: { text: string }) {
  return (
    <div className="space-y-1">
      {text.split("\n").map((line, i) => {
        const html = line
          .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
          .replace(/_(.+?)_/g, "<em>$1</em>");
        if (line.startsWith("- ")) {
          return (
            <p
              key={i}
              className="pl-4 -indent-2 before:mr-1 before:content-['•']"
              dangerouslySetInnerHTML={{ __html: html.slice(2) }}
            />
          );
        }
        if (!line.trim()) return <div key={i} className="h-1" />;
        return <p key={i} dangerouslySetInnerHTML={{ __html: html }} />;
      })}
    </div>
  );
}

export function AssistantSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const store = useRecovery();
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: 0,
      role: "assistant",
      text: `Hello ${store.patient.name.split(" ")[0]}! I'm **RecoverAI Assistant**. I can answer questions using your discharge report and recovery plan. I can't diagnose, prescribe or change your medicines.\n\n_RecoverAI provides recovery assistance and does not replace professional medical advice._`,
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  function ask(question: string) {
    const q = question.trim();
    if (!q || thinking) return;
    setMessages((prev) => [...prev, { id: Date.now(), role: "user", text: q }]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", text: answerQuestion(q, store) },
      ]);
      setThinking(false);
    }, 600);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b bg-primary/5 p-5">
          <SheetTitle className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Bot className="size-5" />
            </span>
            RecoverAI Assistant
          </SheetTitle>
          <SheetDescription>Answers based on your recovery plan — never a diagnosis.</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-5">
          <div className="space-y-4 py-5">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Bot className="size-4" />
                  </span>
                )}
                <div
                  className={`max-w-[85%] text-sm leading-relaxed ${
                    m.role === "user"
                      ? "rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-primary-foreground"
                      : "text-foreground"
                  }`}
                >
                  <RichText text={m.text} />
                </div>
                {m.role === "user" && (
                  <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <User className="size-4" />
                  </span>
                )}
              </div>
            ))}
            {thinking && (
              <p className="animate-pulse text-sm text-muted-foreground">
                RecoverAI is checking your plan…
              </p>
            )}
            <div ref={endRef} />
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.slice(0, 4).map((q) => (
              <button
                key={q}
                onClick={() => ask(q)}
                className="rounded-full border bg-secondary px-3 py-1 text-xs text-secondary-foreground transition-colors hover:bg-accent"
              >
                {q}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
          >
            <Input
              value={input}
              autoFocus
              placeholder="Ask about your recovery plan…"
              onChange={(e) => setInput(e.target.value)}
            />
            <Button type="submit" size="icon" disabled={!input.trim() || thinking}>
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
