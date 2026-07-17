import { useMemo, useState } from "react";
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
  Calendar,
} from "lucide-react";
import { UserAvatar } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ApiEmployee, ApiAwardCategory } from "@/services/api";

export interface NominationWizardCategory extends ApiAwardCategory {
  awardType?: "spot" | "performance" | "appreciation";
}
export interface NominationWizardEmployee extends ApiEmployee {
  joiningDate?: string;
}

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
  onSubmit: (payload: {
    toEmployeeId: number;
    categoryId: number | null;
    message: string;
    customCategory?: string;
    awardCycle?: string;
  }) => Promise<void> | void;
  initialEmployeeId?: number | null;
  pointsEnabled?: boolean;
  quickTemplates?: { label: string; emoji: string; text: string }[];
}

const MESSAGE_LIMIT = 500;
const AWARD_CYCLES = ["Q3 2026", "Q4 2026", "Q1 2027", "Q2 2027"];

const getTenureMonths = (joiningDateStr?: string) => {
  if (!joiningDateStr) return 0;
  const joinDate = new Date(joiningDateStr);
  const diffTime = Date.now() - joinDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return Number((diffDays / 30.4375).toFixed(1));
};

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
  const [customCategory, setCustomCategory] = useState("");
  const [awardCycle, setAwardCycle] = useState("");

  const selectableEmployees = useMemo(
    () => employees.filter((e) => e.id !== currentUserId),
    [employees, currentUserId]
  );

  const allCategories = useMemo(() => {
    const isNomination = heading.toLowerCase().includes("nomination");
    if (!isNomination) return categories;

    const customOption: NominationWizardCategory = {
      id: -1,
      name: "Custom Spot Award",
      description: "Nominate for a custom Spot Award category not listed here",
      points: 500,
      icon: "✨",
      managerOnly: true,
      awardType: "spot"
    } as any;

    return [...categories, customOption];
  }, [categories, heading]);

  const filteredCategories = useMemo(() => {
    const q = awardSearch.trim().toLowerCase();
    if (!q) return allCategories;
    return allCategories.filter(
      (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    );
  }, [allCategories, awardSearch]);

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

  const selectedCategory = allCategories.find((c) => c.id === categoryId) ?? null;
  const selectedEmployee = employees.find((e) => e.id === employeeId) ?? null;

  const isRisingStar = selectedCategory?.name?.includes("Rising Star") || selectedCategory?.id === 15;
  const tenureMonths = selectedEmployee?.joiningDate ? getTenureMonths(selectedEmployee.joiningDate) : null;
  const isTenureInvalid = isRisingStar && tenureMonths !== null && tenureMonths > 6;

  const canAdvance =
    (stepIdx === 0 && categoryId !== null && (categoryId !== -1 || customCategory.trim().length > 0)) ||
    (stepIdx === 1 && employeeId !== null) ||
    stepIdx === 2;

  const isPerformance = selectedCategory?.awardType === "performance";

  const canSubmit =
    categoryId !== null &&
    (categoryId !== -1 || customCategory.trim().length > 0) &&
    employeeId !== null &&
    (!isPerformance || !!awardCycle) &&
    !isTenureInvalid &&
    message.trim().length > 0;

  const goNext = () => {
    if (!canAdvance) return;
    if (stepIdx < STEPS.length - 1) setStepIdx((s) => s + 1);
  };
  const goBack = () => {
    if (stepIdx > 0) setStepIdx((s) => s - 1);
  };
  const jumpTo = (idx: number) => {
    if (idx === 0) return setStepIdx(0);
    if (idx === 1 && categoryId !== null) return setStepIdx(1);
    if (idx === 2 && categoryId !== null && employeeId !== null) return setStepIdx(2);
  };

  const handleSubmit = async () => {
    if (!canSubmit || employeeId === null) return;
    await onSubmit({
      toEmployeeId: employeeId,
      categoryId: categoryId === -1 ? null : categoryId,
      message: message.trim(),
      customCategory: categoryId === -1 ? customCategory.trim() : undefined,
      awardCycle: isPerformance ? awardCycle : undefined,
    });
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
    setCustomCategory("");
    setAwardCycle("");
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white py-20 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
        >
          <CheckCircle2 className="h-9 w-9" />
        </motion.div>
        <div>
          <h2 className="text-xl font-bold text-slate-950 dark:text-white">{successTitle}</h2>
          <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{successMessage}</p>
        </div>
        <button
          onClick={resetAll}
          className="mt-2 rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
        >
          Start another
        </button>
      </motion.div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-950">
        <h2 className="text-lg font-bold text-slate-950 dark:text-white">{heading}</h2>
        <div className="flex items-center gap-2">
          {stepIdx > 0 && (
            <button
              onClick={goBack}
              className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
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
                canAdvance
                  ? "text-blue-600 hover:text-blue-700 dark:text-sky-400"
                  : "cursor-not-allowed text-slate-300 dark:text-slate-700"
              )}
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition",
                canSubmit && !isSubmitting
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600"
              )}
            >
              {isSubmitting ? "Submitting..." : submitLabel}
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-0 md:grid-cols-[220px_1fr]">
        {/* Left progress rail */}
        <div className="flex shrink-0 flex-row gap-4 border-b border-slate-200 bg-white px-6 py-5 dark:border-slate-800 dark:bg-slate-950 md:flex-col md:border-b-0 md:border-r md:py-8">
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
                      ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                      : "border-2 border-slate-200 text-slate-300 dark:border-slate-700 dark:text-slate-600",
                    reachable && "cursor-pointer"
                  )}
                >
                  {isDone ? <Check className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
                </button>
                <div className="hidden min-w-0 md:block">
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      isActive || isDone ? "text-slate-950 dark:text-white" : "text-slate-400 dark:text-slate-600"
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-600">{step.subtitle}</p>
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
                  <h3 className="text-base font-bold text-slate-950 dark:text-white">Award/Recognition</h3>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={awardSearch}
                      onChange={(e) => setAwardSearch(e.target.value)}
                      placeholder="Search awards..."
                      className="w-64 max-w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-700 dark:bg-slate-900"
                    />
                  </div>
                </div>

                {filteredCategories.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-400">No awards match your search.</p>
                ) : (
                  <div>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                      {filteredCategories.map((cat) => {
                        const isActive = categoryId === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setCategoryId(cat.id)}
                            className={cn(
                              "group relative flex flex-col rounded-xl border bg-white p-4 text-left shadow-sm transition-all dark:bg-slate-950",
                              isActive
                                ? "border-blue-500 ring-2 ring-blue-500/30"
                                : "border-slate-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-800"
                            )}
                          >
                            {isActive && (
                              <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                                <Check className="h-3 w-3" />
                              </span>
                            )}
                            <div className="mb-3 flex h-16 w-full items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 text-3xl dark:from-blue-950/40 dark:to-indigo-950/30">
                              {cat.icon || "🏆"}
                            </div>
                            <p className="text-sm font-bold text-slate-950 dark:text-white">{cat.name}</p>
                            <div className="mt-2 border-t border-slate-100 pt-2 dark:border-slate-800">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Criteria</p>
                              <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                                {cat.description}
                              </p>
                            </div>
                            <p className="mt-2 text-xs font-semibold text-blue-600 dark:text-sky-400">
                              {pointsEnabled ? `+${cat.points} pts` : "Kudos · no points"}
                            </p>
                          </button>
                        );
                      })}
                    </div>

                    {categoryId === -1 && (
                      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20 max-w-md">
                        <label className="text-sm font-semibold text-slate-900 dark:text-white">
                          Custom Category Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          placeholder="e.g. Integrity Leader, Technical Excellence..."
                          className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-700 dark:bg-slate-900"
                        />
                      </div>
                    )}
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
                  <h3 className="text-base font-bold text-slate-950 dark:text-white">Recipient</h3>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={empSearch}
                      onChange={(e) => setEmpSearch(e.target.value)}
                      placeholder="Search employee..."
                      className="w-64 max-w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-700 dark:bg-slate-900"
                    />
                  </div>
                </div>

                {filteredEmployees.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-400">No employees match your search.</p>
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
                            "flex items-center gap-3 rounded-xl border bg-white p-3 text-left transition dark:bg-slate-950",
                            isActive
                              ? "border-blue-500 ring-2 ring-blue-500/30"
                              : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 dark:border-slate-800 dark:hover:bg-slate-900"
                          )}
                        >
                          <UserAvatar name={emp.name} avatar={emp.avatar} size="h-10 w-10" fallbackClassName="text-xs font-bold" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{emp.name}</p>
                            <p className="flex items-center gap-1 truncate text-xs text-slate-500 dark:text-slate-400">
                              <Briefcase className="h-3 w-3 shrink-0" /> {emp.department}
                              {emp.role ? ` · ${emp.role}` : ""}
                            </p>
                            <p className="flex items-center gap-1 truncate text-xs text-slate-400 dark:text-slate-500">
                              <Mail className="h-3 w-3 shrink-0" /> {emp.email}
                            </p>
                          </div>
                          {isActive && (
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
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
                  <h3 className="mb-3 text-base font-bold text-slate-950 dark:text-white">Details</h3>
                  
                  {isTenureInvalid && (
                    <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-950/40 dark:bg-rose-950/20">
                      <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                        ❌ Not Eligible: "Rising Star (BA)" requires a maximum tenure of 6 months. {selectedEmployee?.name} has {tenureMonths} months of tenure (joined on {selectedEmployee?.joiningDate}).
                      </p>
                    </div>
                  )}

                  {isPerformance && (
                    <div className="mb-4">
                      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Award Cycle <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={awardCycle}
                        onChange={(e) => setAwardCycle(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-700 dark:bg-slate-900"
                      >
                        <option value="">Select Cycle...</option>
                        {AWARD_CYCLES.map((cycle) => (
                          <option key={cycle} value={cycle}>
                            {cycle}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Citation / message <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-xs text-slate-400">
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
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-blue-950/30"
                        >
                          <span>{tpl.emoji}</span> {tpl.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, MESSAGE_LIMIT))}
                    placeholder="Explain why this person deserves recognition..."
                    rows={8}
                    className="resize-none"
                  />
                  <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-slate-100 p-3 dark:bg-slate-800/50">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
                      <Award className="h-3.5 w-3.5" />
                    </div>
                    <p className="text-xs leading-snug text-slate-500 dark:text-slate-400">{footerNote}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                  <p className="mb-3 text-sm font-bold text-slate-950 dark:text-white">Preview</p>
                  <div className="flex items-center gap-3">
                    <UserAvatar name={selectedEmployee?.name} avatar={selectedEmployee?.avatar} size="h-11 w-11" fallbackClassName="text-sm font-bold" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                        {selectedEmployee?.name ?? "Select a recipient"}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {selectedEmployee?.department ?? "—"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 dark:bg-blue-950/30">
                    <span className="text-lg leading-none">{selectedCategory?.icon || "🏆"}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-blue-700 dark:text-sky-300">
                        {categoryId === -1 ? (customCategory || "Custom Spot Award") : (selectedCategory?.name ?? "Select an award")}
                      </p>
                      {selectedCategory && (
                        <p className="text-xs font-medium text-blue-500 dark:text-sky-400">
                          {pointsEnabled ? `+${selectedCategory.points} pts` : "Kudos · no points awarded"}
                        </p>
                      )}
                    </div>
                  </div>

                  {isPerformance && awardCycle && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 dark:bg-indigo-950/30">
                      <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                        Cycle: {awardCycle}
                      </p>
                    </div>
                  )}

                  <p className="mt-3 line-clamp-6 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
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
