import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  User as UserIcon,
  FileText,
  Search,
  Check,
  ChevronRight,
  ChevronLeft,
  Mail,
  Briefcase,
  CheckCircle2,
} from "lucide-react";
import { UserAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import EmojiPicker from "@/components/ui/EmojiPicker";
import Confetti from "@/components/nomination/Confetti";
import { cn } from "@/lib/utils";
import type { ApiEmployee, ApiAwardCategory } from "@/services/api";

export interface NominationWizardCategory extends ApiAwardCategory {}
export interface NominationWizardEmployee extends ApiEmployee {}

interface StepDef {
  key: "award" | "recipient" | "details";
  title: string;
  subtitle: string;
  icon: typeof Award;
}

const STEPS: StepDef[] = [
  { key: "award", title: "Award/Recognition", subtitle: "Search and select any award", icon: Award },
  { key: "recipient", title: "Recipient", subtitle: "Search and select employee", icon: UserIcon },
  { key: "details", title: "Details", subtitle: "Enter citation and other details", icon: FileText },
];

export interface NominationWizardProps {
  heading: string;
  categories: NominationWizardCategory[];
  employees: NominationWizardEmployee[];
  currentUserId?: number;
  isSubmitting?: boolean;
  submitLabel?: string;
  successTitle: string;
  successMessage: string;
  footerNote: string;
  onSubmit: (payload: { toEmployeeId: number; categoryId: number; message: string }) => Promise<void> | void;
  /** Pre-selects a recipient (e.g. deep-linked from the Manager Dashboard's
   * "Nominate"/"Recognize" action) so it's already chosen once the user
   * reaches the recipient step. */
  initialEmployeeId?: number | null;
  /** Whether this flow actually awards the category's points. Kudos/
   * appreciation sent by an employee never carries points (only a
   * manager's nomination does) — set false so the wizard doesn't show a
   * "+N pts" badge that wouldn't actually be granted. */
  pointsEnabled?: boolean;
  /** Optional one-tap starter phrases shown above the message textarea. */
  quickTemplates?: { label: string; emoji: string; text: string }[];
}

const MESSAGE_LIMIT = 500;

export default function NominationWizard({
  heading,
  categories,
  employees,
  currentUserId,
  isSubmitting,
  submitLabel = "Submit",
  successTitle,
  successMessage,
  footerNote,
  onSubmit,
  initialEmployeeId = null,
  pointsEnabled = true,
  quickTemplates,
}: NominationWizardProps) {
  const [stepIdx, setStepIdx] = useState(0);
  const [awardSearch, setAwardSearch] = useState("");
  const [empSearch, setEmpSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [employeeId, setEmployeeId] = useState<number | null>(initialEmployeeId ?? null);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectableEmployees = useMemo(
    () => employees.filter((e) => e.id !== currentUserId),
    [employees, currentUserId]
  );

  const filteredCategories = useMemo(() => {
    const q = awardSearch.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    );
  }, [categories, awardSearch]);

  const filteredEmployees = useMemo(() => {
    const q = empSearch.trim().toLowerCase();
    if (!q) return selectableEmployees;
    return selectableEmployees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.department?.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q)
    );
  }, [selectableEmployees, empSearch]);

  const selectedCategory = categories.find((c) => c.id === categoryId) ?? null;
  const selectedEmployee = employees.find((e) => e.id === employeeId) ?? null;

  const canAdvance =
    (stepIdx === 0 && categoryId !== null) ||
    (stepIdx === 1 && employeeId !== null) ||
    stepIdx === 2;

  const canSubmit = categoryId !== null && employeeId !== null && message.trim().length > 0;

  const goNext = () => {
    if (!canAdvance) return;
    if (stepIdx < STEPS.length - 1) setStepIdx((s) => s + 1);
  };
  const goBack = () => {
    if (stepIdx > 0) setStepIdx((s) => s - 1);
  };
  const jumpTo = (idx: number) => {
    // Only allow jumping to a step that's already reachable.
    if (idx === 0) return setStepIdx(0);
    if (idx === 1 && categoryId !== null) return setStepIdx(1);
    if (idx === 2 && categoryId !== null && employeeId !== null) return setStepIdx(2);
  };

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current;
    if (!el) {
      setMessage((m) => (m + emoji).slice(0, MESSAGE_LIMIT));
      return;
    }
    const start = el.selectionStart ?? message.length;
    const end = el.selectionEnd ?? message.length;
    const next = (message.slice(0, start) + emoji + message.slice(end)).slice(0, MESSAGE_LIMIT);
    setMessage(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + emoji.length;
      el.setSelectionRange(cursor, cursor);
    });
  };

  const handleSubmit = async () => {
    if (!canSubmit || !categoryId || !employeeId) return;
    await onSubmit({ toEmployeeId: employeeId, categoryId, message: message.trim() });
    setSent(true);
  };

  const resetAll = () => {
    setSent(false);
    setStepIdx(0);
    setCategoryId(null);
    setEmployeeId(null);
    setMessage("");
    setAwardSearch("");
    setEmpSearch("");
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative flex flex-col items-center justify-center gap-4 overflow-hidden rounded-[24px] border border-border bg-card py-20 text-center shadow-card"
      >
        <Confetti />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success"
        >
          <CheckCircle2 className="h-9 w-9" />
        </motion.div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{successTitle}</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{successMessage}</p>
        </div>
        <button
          onClick={resetAll}
          className="mt-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-glow-primary transition hover:bg-primary/90"
        >
          Start another
        </button>
      </motion.div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-border bg-card shadow-card">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 className="text-lg font-bold text-foreground">{heading}</h2>
        <div className="flex items-center gap-2">
          {stepIdx > 0 && (
            <button
              onClick={goBack}
              className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
          )}
          {stepIdx < STEPS.length - 1 ? (
            <button
              onClick={goNext}
              disabled={!canAdvance}
              className={cn(
                "inline-flex items-center gap-1 text-sm font-semibold transition",
                canAdvance ? "text-primary hover:text-primary/80" : "cursor-not-allowed text-muted-foreground/40"
              )}
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              loading={isSubmitting}
              size="sm"
              className="px-4"
            >
              {submitLabel}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-0 md:grid-cols-[220px_1fr]">
        {/* Left progress rail */}
        <div className="flex shrink-0 flex-row gap-4 border-b border-border bg-muted/30 px-6 py-5 md:flex-col md:border-b-0 md:border-r md:py-8">
          {STEPS.map((step, idx) => {
            const isActive = idx === stepIdx;
            const isDone = idx < stepIdx;
            const reachable =
              idx === 0 || (idx === 1 && categoryId !== null) || (idx === 2 && categoryId !== null && employeeId !== null);
            return (
              <div key={step.key} className="flex flex-1 items-start gap-3 md:flex-none">
                <button
                  type="button"
                  onClick={() => jumpTo(idx)}
                  disabled={!reachable}
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition",
                    isActive || isDone
                      ? "bg-primary text-primary-foreground shadow-glow-primary"
                      : "border-2 border-border text-muted-foreground/50",
                    reachable && "cursor-pointer"
                  )}
                >
                  {isDone ? <Check className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
                </button>
                <div className="hidden min-w-0 md:block">
                  <p className={cn("text-sm font-semibold", isActive || isDone ? "text-foreground" : "text-muted-foreground/60")}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground/60">{step.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="min-h-[420px] p-6">
          <AnimatePresence mode="wait">
            {stepIdx === 0 && (
              <motion.div
                key="award"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-base font-bold text-foreground">Award/Recognition</h3>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={awardSearch}
                      onChange={(e) => setAwardSearch(e.target.value)}
                      placeholder="Search awards..."
                      className="w-64 max-w-full rounded-full border border-border bg-card py-2 pl-9 pr-3 text-sm shadow-card focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                {filteredCategories.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">No awards match your search.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {filteredCategories.map((cat) => {
                      const isActive = categoryId === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategoryId(cat.id)}
                          className={cn(
                            "group relative flex flex-col rounded-2xl border bg-card p-4 text-left shadow-card transition-all",
                            isActive
                              ? "border-primary ring-2 ring-primary/30"
                              : "border-border hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card-hover"
                          )}
                        >
                          {isActive && (
                            <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <Check className="h-3 w-3" />
                            </span>
                          )}
                          <div className="mb-3 flex h-16 w-full items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 text-3xl">
                            {cat.icon || "🏆"}
                          </div>
                          <p className="text-sm font-bold text-foreground">{cat.name}</p>
                          <div className="mt-2 border-t border-border pt-2">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">Criteria</p>
                            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{cat.description}</p>
                          </div>
                          <p className="mt-2 text-xs font-semibold text-primary">
                            {pointsEnabled ? `+${cat.points} pts` : "Kudos · no points"}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {stepIdx === 1 && (
              <motion.div
                key="recipient"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-base font-bold text-foreground">Recipient</h3>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={empSearch}
                      onChange={(e) => setEmpSearch(e.target.value)}
                      placeholder="Search employee..."
                      className="w-64 max-w-full rounded-full border border-border bg-card py-2 pl-9 pr-3 text-sm shadow-card focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                {filteredEmployees.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">No employees match your search.</p>
                ) : (
                  <div className="grid max-h-[420px] gap-2 overflow-y-auto sm:grid-cols-2">
                    {filteredEmployees.map((emp) => {
                      const isActive = employeeId === emp.id;
                      return (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => setEmployeeId(emp.id)}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl border bg-card p-3 text-left transition",
                            isActive
                              ? "border-primary ring-2 ring-primary/30"
                              : "border-border hover:border-primary/40 hover:bg-primary/5"
                          )}
                        >
                          <UserAvatar name={emp.name} size="h-10 w-10" fallbackClassName="text-xs font-bold" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-foreground">{emp.name}</p>
                            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                              <Briefcase className="h-3 w-3 shrink-0" /> {emp.department}
                              {emp.role ? ` · ${emp.role}` : ""}
                            </p>
                            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground/70">
                              <Mail className="h-3 w-3 shrink-0" /> {emp.email}
                            </p>
                          </div>
                          {isActive && (
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <Check className="h-3 w-3" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {stepIdx === 2 && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="grid gap-6 lg:grid-cols-[1.3fr_1fr]"
              >
                <div>
                  <h3 className="mb-3 text-base font-bold text-foreground">Details</h3>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">
                      Citation / message <span className="text-destructive">*</span>
                    </label>
                    <span className="text-xs text-muted-foreground">
                      {message.length}/{MESSAGE_LIMIT}
                    </span>
                  </div>
                  {quickTemplates && quickTemplates.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {quickTemplates.map((tpl) => (
                        <button
                          key={tpl.label}
                          type="button"
                          onClick={() => setMessage(tpl.text.slice(0, MESSAGE_LIMIT))}
                          className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                        >
                          <span>{tpl.emoji}</span> {tpl.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="relative">
                    <Textarea
                      ref={textareaRef}
                      value={message}
                      onChange={(e) => setMessage(e.target.value.slice(0, MESSAGE_LIMIT))}
                      placeholder="Explain why this person deserves recognition..."
                      rows={8}
                      className="resize-none rounded-2xl pr-11"
                    />
                    <div className="absolute bottom-2 right-2">
                      <EmojiPicker onSelect={insertEmoji} />
                    </div>
                  </div>
                  <div className="mt-3 flex items-start gap-2.5 rounded-2xl bg-muted/60 p-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                      <Award className="h-3.5 w-3.5" />
                    </div>
                    <p className="text-xs leading-snug text-muted-foreground">{footerNote}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
                  <p className="mb-3 text-sm font-bold text-foreground">Preview</p>
                  <div className="flex items-center gap-3">
                    <UserAvatar name={selectedEmployee?.name} size="h-11 w-11" fallbackClassName="text-sm font-bold" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {selectedEmployee?.name ?? "Select a recipient"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{selectedEmployee?.department ?? "—"}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-2">
                    <span className="text-lg leading-none">{selectedCategory?.icon || "🏆"}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-primary">
                        {selectedCategory?.name ?? "Select an award"}
                      </p>
                      {selectedCategory && (
                        <p className="text-xs font-medium text-primary/80">
                          {pointsEnabled ? `+${selectedCategory.points} pts` : "Kudos · no points awarded"}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-6 text-sm leading-relaxed text-foreground/80">
                    {message || "Your message preview will appear here."}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
