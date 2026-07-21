import { useMemo, useState, useEffect } from "react";
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
import { useAuth } from "@/contexts/AuthContext";

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
  onBulkSubmit?: (payload: {
    recipientIds: number[];
    categoryId: number | null;
    message: string;
  }) => Promise<void> | void;
  initialEmployeeId?: number | null;
  pointsEnabled?: boolean;
  quickTemplates?: { label: string; emoji: string; text: string }[];
  bulkEnabled?: boolean;
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
  onBulkSubmit,
  initialEmployeeId = null,
  pointsEnabled = true,
  quickTemplates,
  bulkEnabled = false,
}: NominationWizardProps) {
  const { user } = useAuth();
  const [stepIdx, setStepIdx] = useState(0);
  const [awardSearch, setAwardSearch] = useState("");
  const [empSearch, setEmpSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [employeeId, setEmployeeId] = useState<number | null>(initialEmployeeId ?? null);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [awardCycle, setAwardCycle] = useState("");

  // Bulk/Team state variables
  const [recipientType, setRecipientType] = useState<"individual" | "team">("individual");
  const [bulkType, setBulkType] = useState<"bu" | "cu" | "dept" | "custom">("bu");
  const [selectedBUId, setSelectedBUId] = useState<number | null>(null);
  const [selectedCUId, setSelectedCUId] = useState<number | null>(null);
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
  const [customSearch, setCustomSearch] = useState("");

  const bus = useMemo(() => {
    return employees.filter(
      (e) => e.userRole === "bu_manager" || e.role === "BU Head" || e.role === "BU Lead"
    );
  }, [employees]);

  useEffect(() => {
    if (bus.length > 0 && selectedBUId === null) {
      setSelectedBUId(bus[0].id);
    }
  }, [bus, selectedBUId]);

  const cus = useMemo(() => {
    return employees.filter(
      (e) => e.userRole === "cu_manager" || e.role === "CU Lead"
    );
  }, [employees]);

  useEffect(() => {
    if (cus.length > 0 && selectedCUId === null) {
      setSelectedCUId(cus[0].id);
    }
  }, [cus, selectedCUId]);

  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.department && !e.department.toUpperCase().startsWith("BU ")) {
        set.add(e.department);
      }
    });
    return Array.from(set).sort();
  }, [employees]);

  useEffect(() => {
    if (departments.length > 0 && !selectedDept) {
      setSelectedDept(departments[0]);
    }
  }, [departments, selectedDept]);

  const bulkRecipients = useMemo(() => {
    if (recipientType !== "team") return [];
    if (bulkType === "bu") {
      if (!selectedBUId) return [];
      const getDescendants = (mgrId: number): ApiEmployee[] => {
        const direct = employees.filter((e) => e.managerId === mgrId);
        const indirect = direct.flatMap((d) => getDescendants(d.id));
        return [...direct, ...indirect];
      };
      return getDescendants(selectedBUId).filter((e) => e.id !== currentUserId);
    }
    if (bulkType === "cu") {
      if (!selectedCUId) return [];
      const getDescendants = (mgrId: number): ApiEmployee[] => {
        const direct = employees.filter((e) => e.managerId === mgrId);
        const indirect = direct.flatMap((d) => getDescendants(d.id));
        return [...direct, ...indirect];
      };
      return getDescendants(selectedCUId).filter((e) => e.id !== currentUserId);
    }
    if (bulkType === "dept") {
      if (!selectedDept) return [];
      return employees.filter((e) => e.department === selectedDept && e.id !== currentUserId);
    }
    if (bulkType === "custom") {
      return employees.filter((e) => selectedEmployeeIds.includes(e.id));
    }
    return [];
  }, [recipientType, bulkType, selectedBUId, selectedCUId, selectedDept, selectedEmployeeIds, employees, currentUserId]);

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
    (stepIdx === 1 && (recipientType === "individual" ? employeeId !== null : bulkRecipients.length > 0)) ||
    stepIdx === 2;

  const isPerformance = selectedCategory?.awardType === "performance";

  const canSubmit =
    categoryId !== null &&
    (categoryId !== -1 || customCategory.trim().length > 0) &&
    (recipientType === "individual" ? employeeId !== null : bulkRecipients.length > 0) &&
    (!isPerformance || !!awardCycle) &&
    (recipientType === "individual" ? !isTenureInvalid : true) &&
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
    if (
      idx === 2 &&
      categoryId !== null &&
      (recipientType === "individual" ? employeeId !== null : bulkRecipients.length > 0)
    )
      return setStepIdx(2);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (recipientType === "individual") {
      if (employeeId === null) return;
      await onSubmit({
        toEmployeeId: employeeId,
        categoryId: categoryId === -1 ? null : categoryId,
        message: message.trim(),
        customCategory: categoryId === -1 ? customCategory.trim() : undefined,
        awardCycle: isPerformance ? awardCycle : undefined,
      });
    } else {
      if (onBulkSubmit) {
        await onBulkSubmit({
          recipientIds: bulkRecipients.map((r) => r.id),
          categoryId: categoryId === -1 ? null : categoryId,
          message: message.trim(),
        });
      }
    }
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
    setSelectedBUId(bus.length > 0 ? bus[0].id : null);
    setSelectedCUId(cus.length > 0 ? cus[0].id : null);
    setSelectedDept(departments.length > 0 ? departments[0] : "");
    setSelectedEmployeeIds([]);
    setCustomSearch("");
  };

  if (sent) {
    const isSpotAward = categoryId === -1 || selectedCategory?.awardType === "spot";
    const isAutoApproved = isSpotAward && (user?.userRole === "bu_manager" || user?.userRole === "admin");
    const finalSuccessTitle = isAutoApproved ? "Nomination Approved! 🏆" : successTitle;
    const finalSuccessMessage = isAutoApproved
      ? "The nomination has been automatically approved and 500 points have been allocated."
      : successMessage;

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
          <h2 className="text-xl font-bold text-slate-950 dark:text-white">{finalSuccessTitle}</h2>
          <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{finalSuccessMessage}</p>
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
                {bulkEnabled && (
                  <div className="flex justify-center mb-6">
                    <div className="inline-flex rounded-xl bg-slate-200/60 p-1 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setRecipientType("individual")}
                        className={cn(
                          "rounded-lg px-4 py-1.5 text-xs font-semibold transition",
                          recipientType === "individual"
                            ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white"
                            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        )}
                      >
                        👤 Individual Employee
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecipientType("team")}
                        className={cn(
                          "rounded-lg px-4 py-1.5 text-xs font-semibold transition",
                          recipientType === "team"
                            ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white"
                            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        )}
                      >
                        👥 Team / Unit
                      </button>
                    </div>
                  </div>
                )}

                {recipientType === "individual" ? (
                  <>
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
                  </>
                ) : (
                  <div className="space-y-6">
                    {/* Group Type Selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recipient Group Type</label>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {(["bu", "cu", "dept", "custom"] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setBulkType(t)}
                            className={cn(
                              "rounded-xl py-2.5 px-3 text-xs font-semibold border text-center transition",
                              bulkType === t
                                ? "bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-950/40 dark:border-blue-400 dark:text-blue-300"
                                : "bg-white border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 hover:bg-slate-55 dark:hover:bg-slate-900/60"
                            )}
                          >
                            {t === "bu" && "🏢 BU Team"}
                            {t === "cu" && "👥 CU Team"}
                            {t === "dept" && "📂 Department"}
                            {t === "custom" && "⚙️ Custom Select"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Specific Group Detail Selector */}
                    <div className="space-y-2">
                      {bulkType === "bu" && (
                        <>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select BU Team</label>
                          <select
                            value={selectedBUId ?? ""}
                            onChange={(e) => setSelectedBUId(Number(e.target.value) || null)}
                            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                          >
                            {bus.map((bu) => (
                              <option key={bu.id} value={bu.id}>
                                {bu.name} Team
                              </option>
                            ))}
                          </select>
                        </>
                      )}

                      {bulkType === "cu" && (
                        <>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select CU Team</label>
                          <select
                            value={selectedCUId ?? ""}
                            onChange={(e) => setSelectedCUId(Number(e.target.value) || null)}
                            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                          >
                            {cus.map((cu) => (
                              <option key={cu.id} value={cu.id}>
                                {cu.name} Team
                              </option>
                            ))}
                          </select>
                        </>
                      )}

                      {bulkType === "dept" && (
                        <>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Department</label>
                          <select
                            value={selectedDept}
                            onChange={(e) => setSelectedDept(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                          >
                            {departments.map((dept) => (
                              <option key={dept} value={dept}>
                                {dept}
                              </option>
                            ))}
                          </select>
                        </>
                      )}

                      {bulkType === "custom" && (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <input
                              value={customSearch}
                              onChange={(e) => setCustomSearch(e.target.value)}
                              placeholder="Search employee by name or dept..."
                              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => setSelectedEmployeeIds([])}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-white"
                            >
                              Clear All
                            </button>
                          </div>

                          <div className="grid max-h-[180px] gap-2 overflow-y-auto sm:grid-cols-2">
                            {selectableEmployees
                              .filter(
                                (e) =>
                                  e.name.toLowerCase().includes(customSearch.toLowerCase()) ||
                                  e.department?.toLowerCase().includes(customSearch.toLowerCase())
                              )
                              .map((emp) => {
                                const isSelected = selectedEmployeeIds.includes(emp.id);
                                return (
                                  <button
                                    key={emp.id}
                                    type="button"
                                    onClick={() =>
                                      setSelectedEmployeeIds((prev) =>
                                        prev.includes(emp.id)
                                          ? prev.filter((id) => id !== emp.id)
                                          : [...prev, emp.id]
                                      )
                                    }
                                    className={cn(
                                      "flex items-center gap-2 p-2 rounded-xl border text-left transition bg-white dark:bg-slate-950",
                                      isSelected
                                        ? "border-blue-500 ring-1 ring-blue-500/30"
                                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                                    )}
                                  >
                                    <UserAvatar name={emp.name} avatar={emp.avatar} size="h-7 w-7" fallbackClassName="text-[10px]" />
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-xs font-bold text-slate-800 dark:text-white leading-tight">{emp.name}</p>
                                      <p className="truncate text-[9px] text-slate-400 mt-0.5">{emp.department} · {emp.role}</p>
                                    </div>
                                    {isSelected && (
                                      <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                                        <Check className="h-2.5 w-2.5" />
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Selected Team Summary - Below selection */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Selected Team Summary</h4>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Selected Group:{" "}
                            <span className="font-semibold text-blue-600 dark:text-sky-400">
                              {bulkType === "bu" && (bus.find((bu) => bu.id === selectedBUId)?.name ? `${bus.find((bu) => bu.id === selectedBUId)?.name} Team` : "None")}
                              {bulkType === "cu" && (cus.find((cu) => cu.id === selectedCUId)?.name ? `${cus.find((cu) => cu.id === selectedCUId)?.name} Team` : "None")}
                              {bulkType === "dept" && (selectedDept ? `${selectedDept} Department` : "None")}
                              {bulkType === "custom" && "Custom Selection"}
                            </span>
                          </p>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-3 py-1.5 text-center dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] text-muted-foreground font-semibold">Total Recipients</span>
                          <p className="text-lg font-extrabold text-slate-900 dark:text-white leading-none mt-0.5">
                            {bulkRecipients.length}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Recipient Members</p>
                        {bulkRecipients.length === 0 ? (
                          <p className="text-xs text-muted-foreground py-4 text-center">No recipients resolved in this group.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto p-1">
                            {bulkRecipients.map((emp) => (
                              <div
                                key={emp.id}
                                className="flex items-center gap-2 p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-xl"
                              >
                                <UserAvatar name={emp.name} avatar={emp.avatar} size="h-6 w-6" fallbackClassName="text-[9px]" />
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-800 dark:text-white leading-none">{emp.name}</p>
                                  <p className="text-[9px] text-slate-400 mt-0.5">{emp.department} · {emp.role}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
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
                    <p className="text-xs leading-snug text-slate-500 dark:text-slate-400">
                      {(() => {
                        const isSpotAward = categoryId === -1 || selectedCategory?.awardType === "spot";
                        const isAutoApproved = isSpotAward && (user?.userRole === "bu_manager" || user?.userRole === "admin");
                        return isAutoApproved ? "This nomination will be approved immediately." : footerNote;
                      })()}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                  <p className="mb-3 text-sm font-bold text-slate-950 dark:text-white">Preview</p>
                  {recipientType === "individual" ? (
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
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                        <span className="text-lg">👥</span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                          {bulkType === "bu" && (bus.find((bu) => bu.id === selectedBUId)?.name ? `${bus.find((bu) => bu.id === selectedBUId)?.name} Team` : "BU Team")}
                          {bulkType === "cu" && (cus.find((cu) => cu.id === selectedCUId)?.name ? `${cus.find((cu) => cu.id === selectedCUId)?.name} Team` : "CU Team")}
                          {bulkType === "dept" && (selectedDept ? `${selectedDept} Department` : "Department")}
                          {bulkType === "custom" && "Custom Selection"}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {bulkRecipients.length} recipients selected
                        </p>
                      </div>
                    </div>
                  )}
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
