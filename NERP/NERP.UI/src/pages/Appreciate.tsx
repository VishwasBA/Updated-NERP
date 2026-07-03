import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
//import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, CheckCircle, ChevronsUpDown, X, Star, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useEmployees,
  useAwardCategories,
  useCreateRecognition,
  useRecentRecognitions,
} from "@/hooks/useApiData";
import { ApiRecognition } from "@/services/api";
import { toast } from "sonner";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";
``
/* ─────────────────────────────────────────
   CATEGORY CONFIG  — exact screenshot colors
───────────────────────────────────────── */
const CAT_CFG: Record<
  string,
  { icon: JSX.Element; color: string; bg: string; border: string; badge: string; text: string }
> = {
  Teamwork: {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <circle cx="8.5" cy="6.5" r="2.8" stroke="#5B6AD4" strokeWidth="1.8" />
        <path d="M2.5 19.5c0-3.1 2.7-5.5 6-5.5s6 2.4 6 5.5" stroke="#5B6AD4" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="17.5" cy="7.5" r="2.2" stroke="#5B6AD4" strokeWidth="1.7" />
        <path d="M15.5 19.5c0-2.3 1.5-4.2 3.5-5" stroke="#5B6AD4" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
    color: "#5B6AD4", bg: "#EEF0FB", border: "#5B6AD4",
    badge: "bg-[#EEF0FB] text-[#5B6AD4]", text: "text-[#5B6AD4]",
  },
  Innovation: {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M12 3.5a5.5 5.5 0 0 1 3.5 9.7c-.4.3-.5.7-.5 1.1V15H9v-.7c0-.4-.2-.8-.5-1.1A5.5 5.5 0 0 1 12 3.5z" stroke="#F5A623" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9.5 17.5h5" stroke="#F5A623" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M10.5 20h3" stroke="#F5A623" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    color: "#F5A623", bg: "#FEF6E7", border: "#F5A623",
    badge: "bg-[#FEF6E7] text-[#F5A623]", text: "text-[#F5A623]",
  },
  Leadership: {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M3.5 17h17l-1.8-8.5-4.2 3.8L12 5.5l-2.5 6.8-4.2-3.8L3.5 17z" stroke="#9B51E0" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
        <path d="M3.5 17h17" stroke="#9B51E0" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M6 20h12" stroke="#9B51E0" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    color: "#9B51E0", bg: "#F5EDFD", border: "#9B51E0",
    badge: "bg-[#F5EDFD] text-[#9B51E0]", text: "text-[#9B51E0]",
  },
  Excellence: {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M12 2.5l2.5 5.1 5.7.8-4.1 4 1 5.6L12 15.3l-5.1 2.7 1-5.6-4.1-4 5.7-.8L12 2.5z" stroke="#1DB954" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    ),
    color: "#1DB954", bg: "#E8F8EE", border: "#1DB954",
    badge: "bg-[#E8F8EE] text-[#1DB954]", text: "text-[#1DB954]",
  },
  Supportive: {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M12 20.5S3 14 3 8.5a4.5 4.5 0 0 1 9-.5 4.5 4.5 0 0 1 9 .5C21 14 12 20.5 12 20.5z" stroke="#E91E8C" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
    color: "#E91E8C", bg: "#FDE9F4", border: "#E91E8C",
    badge: "bg-[#FDE9F4] text-[#E91E8C]", text: "text-[#E91E8C]",
  },
  Ownership: {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M12 2c-1 1.5-4 5-4 9.5h8C16 7 13 3.5 12 2z" stroke="#2D9CDB" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M8 11.5l-1.5 4h11l-1.5-4" stroke="#2D9CDB" strokeWidth="1.8" strokeLinejoin="round" />
        <circle cx="12" cy="9" r="1.4" stroke="#2D9CDB" strokeWidth="1.5" />
        <path d="M9.5 15.5l-1 3.5" stroke="#2D9CDB" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M14.5 15.5l1 3.5" stroke="#2D9CDB" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
    color: "#2D9CDB", bg: "#E8F4FD", border: "#2D9CDB",
    badge: "bg-[#E8F4FD] text-[#2D9CDB]", text: "text-[#2D9CDB]",
  },
};
 
/* ─────────────────────────────────────────
   QUICK TEMPLATES
───────────────────────────────────────── */
const QUICK_TEMPLATES = [
  { label: "Great teamwork!", emoji: "👥", text: "Great teamwork! Your collaboration made a real difference to the whole team." },
  { label: "Amazing effort!",  emoji: "🚀", text: "Amazing effort! You went above and beyond and it really shows." },
  { label: "Outstanding work!", emoji: "⭐", text: "Outstanding work! The quality of your output speaks for itself." },
  { label: "Thank you!",       emoji: "❤️", text: "Thank you! Your support and dedication meant a lot to everyone around you." },
];
 
/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
 
/** API returns category as an object {id,name,...} — safely extract name */
function safeCatName(category: unknown): string {
  if (!category) return "";
  if (typeof category === "string") return category;
  if (typeof category === "object" && category !== null && "name" in category) {
    return String((category as { name: unknown }).name);
  }
  return "";
}
 
/** Relative time label */
function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
 
/* ─────────────────────────────────────────
   COMPONENT
───────────────────────────────────────── */
export default function SendAppreciation() {
  const { user } = useAuth();
  const { data: employees = [] }            = useEmployees();
  const { data: categories = [] }           = useAwardCategories();
  const { data: recentRecognitions = [] }   = useRecentRecognitions(4);
  const createMutation                      = useCreateRecognition();
 
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [message, setMessage]   = useState("");
  const [sent, setSent]         = useState(false);
  const [search, setSearch]     = useState("");
  const [open, setOpen]         = useState(false);
 
  /* Derived */
  const availableCategories = categories.filter((c) => !c.managerOnly);
  const otherEmployees      = employees.filter((e) => e.id !== user?.id);
  const filteredEmployees   = otherEmployees.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );
  const selectedEmpObj = otherEmployees.find((e) => String(e.id) === selectedEmployee);
  const selectedCatObj = availableCategories.find((c) => String(c.id) === selectedCategory);
  const selectedCatCfg = selectedCatObj ? CAT_CFG[selectedCatObj.name] : null;
 
  /* Send */
  const handleSend = async () => {
    if (!selectedEmployee || !message.trim()) {
      toast.error("Please select a colleague and write a message");
      return;
    }
    try {
      await createMutation.mutateAsync({
        toEmployeeId: Number(selectedEmployee),
        message:      message.trim(),
        categoryId:   selectedCategory ? Number(selectedCategory) : undefined,
        type:         "appreciation",
      });
      setSent(true);
      toast.success("Appreciation sent! 🎉");
      setTimeout(() => {
        setSent(false);
        setSelectedEmployee("");
        setSelectedCategory("");
        setMessage("");
        setSearch("");
      }, 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send appreciation";
      toast.error(message);
    }
  };
 
  /* ── Success screen ── */
  if (sent) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card className="glass-card text-center py-20">
          <CardContent>
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Appreciation Sent!</h2>
            <p className="text-muted-foreground">Your colleague will be notified of your recognition.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
 
  /* ── Main page ── */
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
 
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            Send Appreciation
            <Heart className="h-7 w-7 fill-red-500 text-pink-500" />
          </h1>
          <p className="text-muted-foreground mt-1">Recognize a colleague's great work and make their day!</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-muted-foreground">
            ⓘ How it works?
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-muted-foreground">
            📋 My Templates
          </Button>
        </div>
      </div>
 
      {/* 2-col grid */}
      <div className="grid lg:grid-cols-3 gap-6">
 
        {/* ── LEFT: Form ── */}
        <div className="lg:col-span-2">
          <Card className="glass-card">
            <CardContent className="p-6 space-y-5">
 
              {/* 1. Employee picker */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Who would you like to appreciate? <span className="text-red-500">*</span>
                </label>
 
                {/* Search input */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search for employee..."
                    aria-label="Search for employee"
                    aria-autocomplete="list"
                    role="combobox"
                    aria-expanded={open}
                    value={open ? search : (selectedEmpObj?.name ?? "")}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setSelectedEmployee("");
                      setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => setTimeout(() => setOpen(false), 150)}
                    className={`w-full h-10 px-3 pr-10 rounded-md bg-background text-sm outline-none transition-all border
                      ${open ? "border-primary ring-1 ring-primary" : "border-input"}`}
                  />
                  <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    <ChevronsUpDown className="h-4 w-4" />
                  </button>
 
                  {/* Dropdown */}
                  {open && (
                    <div role="listbox" aria-label="Employee search results" className="absolute z-50 w-full mt-1 bg-background dark:bg-slate-900 border border-border rounded-md shadow-lg max-h-56 overflow-y-auto">
                      {filteredEmployees.length === 0 ? (
                        <p className="p-3 text-sm text-muted-foreground">No employee found</p>
                      ) : (
                        filteredEmployees.map((emp) => (
                          <div
                            key={emp.id}
                            role="option"
                            aria-selected={String(emp.id) === selectedEmployee}
                            onMouseDown={() => {
                              setSelectedEmployee(String(emp.id));
                              setSearch("");
                              setOpen(false);
                            }}
                            className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground text-sm transition-colors"
                          >
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-[10px]">{emp.avatar}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{emp.name}</span>
                            <span className="text-muted-foreground text-xs">· {emp.department}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
 
                {/* Selected chip */}
                {selectedEmpObj && !open && (
                  <div className="flex items-center gap-2 mt-2 px-3 py-2 border border-border rounded-md bg-muted/30">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-[10px]">{selectedEmpObj.avatar}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-none">{selectedEmpObj.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{selectedEmpObj.department}</p>
                    </div>
                    <button
                      onClick={() => { setSelectedEmployee(""); setSearch(""); }}
                      className="text-muted-foreground hover:text-foreground flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
 
              {/* 2. Category */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {availableCategories.map((cat) => {
                    const cfg     = CAT_CFG[cat.name];
                    const isActive = selectedCategory === String(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(isActive ? "" : String(cat.id))}
                        style={isActive && cfg ? { background: cfg.bg, borderColor: cfg.border } : {}}
                        className={`relative flex flex-col items-center justify-center gap-1.5 h-[76px] rounded-xl border-2 transition-all duration-150
                          ${isActive ? "border-2" : "border-border bg-background hover:border-muted-foreground/40"}`}
                      >
                        {/* Blue checkmark badge */}
                        {isActive && (
                          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-white" strokeWidth={3} />
                          </span>
                        )}
                        {/* Icon */}
                        {cfg
                          ? cfg.icon
                          : <Star className="w-5 h-5 text-muted-foreground" />
                        }
                        {/* Label */}
                        <span
                          style={isActive && cfg ? { color: cfg.color } : {}}
                          className={`text-[11px] font-medium ${!isActive ? "text-muted-foreground" : ""}`}
                        >
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
 
              {/* 3. Message */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium">
                    Your message <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-muted-foreground">{message.length}/500</span>
                </div>
                <Textarea
                  placeholder="Tell them why their work matters..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 500))}
                  rows={5}
                  className="resize-none"
                />
              </div>
 
              {/* 4. Quick templates */}
              <div>
                <label className="text-sm font-medium mb-2 block">Add a template (optional)</label>
                <div className="flex flex-wrap gap-2">
                  {QUICK_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.label}
                      type="button"
                      aria-label={`Use template: ${tpl.label}`}
                      onClick={() => setMessage(tpl.text)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted/60 transition-colors"
                    >
                      <span aria-hidden>{tpl.emoji}</span>
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>
 
              {/* 5. Submit */}
              <Button
                onClick={handleSend}
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                disabled={createMutation.isPending}
              >
                <Heart className="w-4 h-4" />
                {createMutation.isPending ? "Sending..." : "Send Appreciation"}
              </Button>
 
            </CardContent>
          </Card>
        </div>
 
        {/* ── RIGHT: Preview ── */}
        <div>
          <Card className="glass-card sticky top-4">
            <CardContent className="p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm">
                <span className="text-yellow-400">✦</span> Appreciation Preview
              </h3>
 
              {/* Preview card */}
              <div className="relative rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 overflow-hidden">
                {/* Decorative sparkles */}
                <span className="absolute top-3 right-5 text-pink-300 text-xl select-none pointer-events-none">+</span>
                <span className="absolute top-7 right-9 text-indigo-200 text-sm select-none pointer-events-none">+</span>
                <span className="absolute top-1 right-14 text-pink-100 text-xs select-none pointer-events-none">+</span>
 
                {/* Recipient */}
                <div className="flex items-center gap-3">
                  <Avatar>
  <AvatarImage src={selectedEmpObj?.avatar} />
  <AvatarFallback className="bg-slate-100 dark:bg-slate-800">
    {selectedEmpObj?.name?.slice(0, 2).toUpperCase() ?? "?"}
  </AvatarFallback>
</Avatar>
                  <div>
                    <p className="font-semibold text-sm leading-none">
                      {selectedEmpObj?.name ?? (
                        <span className="text-muted-foreground font-normal">Select Employee</span>
                      )}
                    </p>
                    {selectedEmpObj && (
                      <p className="text-xs text-muted-foreground mt-0.5">{selectedEmpObj.department}</p>
                    )}
                  </div>
                </div>
 
                {/* Category badge */}
                {selectedCatObj && selectedCatCfg && (
                  <div
                    style={{ background: selectedCatCfg.bg, color: selectedCatCfg.color }}
                    className="inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-md text-xs font-medium"
                  >
                    <span className="inline-flex scale-75 origin-center">{selectedCatCfg.icon}</span>
                    {selectedCatObj.name}
                  </div>
                )}
 
                {/* Message */}
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {message || "Your appreciation message will appear here."}
                </p>
 
                {/* Sender */}
                <div className="mt-4 flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                      {user?.name?.slice(0, 2).toUpperCase() ?? "ME"}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-xs text-muted-foreground">
                    From <span className="font-medium text-foreground">{user?.name ?? "You"}</span>
                  </p>
                </div>
              </div>
 
              {/* Leaderboard notice */}
              <div className="mt-3 flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Star className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <p className="text-xs text-muted-foreground leading-snug">
                  Your appreciation will be visible to the team and added to the leaderboard.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
 
      {/* ── Recent Appreciations ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold flex items-center gap-2 text-base">
            <span>👥</span> Recent Appreciations
          </h2>
          <button className="text-sm text-primary hover:underline">View all</button>
        </div>
 
        {recentRecognitions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No recent appreciations yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {recentRecognitions.map((item, i) => {
              // Safely resolve category name from API object or string
              const catName = safeCatName(item.category) || safeCatName(item.categoryId);
              const cfg     = catName ? CAT_CFG[catName] : null;
 
              const fromName   = item.fromEmployee?.name   ?? "";
              const fromDept   = item.fromEmployee?.department ?? "";
              const fromAvatar = item.fromEmployee?.avatar  ?? fromName.slice(0, 2).toUpperCase();
 
              const toName   = item.toEmployee?.name   ?? "";
              const toDept   = item.toEmployee?.department ?? "";
              const toAvatar = item.toEmployee?.avatar  ?? toName.slice(0, 2).toUpperCase();
 
              const msgText   = typeof item.message === "string" ? item.message : "";
              const timeLabel = timeAgo(item.createdAt ?? "");
 
              return (
                <Card key={item.id ?? i} className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
 
                      {/* From */}
                      <div className="flex flex-col items-center gap-0.5 min-w-[52px]">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-[10px]">{fromAvatar}</AvatarFallback>
                        </Avatar>
                        <span className="text-[10px] text-muted-foreground text-center leading-tight">{fromName}</span>
                        <span className="text-[10px] text-muted-foreground text-center leading-tight">{fromDept}</span>
                      </div>
 
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
 
                      {/* To */}
                      <div className="flex flex-col items-center gap-0.5 min-w-[52px]">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-[10px]">{toAvatar}</AvatarFallback>
                        </Avatar>
                        <span className="text-[10px] text-muted-foreground text-center leading-tight">{toName}</span>
                        <span className="text-[10px] text-muted-foreground text-center leading-tight">{toDept}</span>
                      </div>
 
                      {/* Category badge — only if we have a valid string name */}
                      {catName && cfg && (
                        <div
                          style={{ background: cfg.bg, color: cfg.color }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium flex-shrink-0"
                        >
                          <span className="inline-flex" style={{ width: 14, height: 14, transform: "scale(0.55)", transformOrigin: "center" }}>
                            {cfg.icon}
                          </span>
                          {catName}
                        </div>
                      )}
 
                      {/* Message snippet */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{msgText}</p>
                      </div>
 
                      {/* Time */}
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap self-start flex-shrink-0">
                        {timeLabel}
                      </span>
 
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
 
    </div>
  );
}
 