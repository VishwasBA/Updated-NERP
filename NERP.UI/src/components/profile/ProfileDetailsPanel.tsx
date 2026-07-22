import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { authApi } from "@/services/api";
import { Save, RefreshCw } from "lucide-react";
import { UserAvatar } from "@/components/ui/avatar";

function toInputDate(iso?: string) {
  if (!iso) return "";
  return iso.includes("T") ? iso.split("T")[0] : iso;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{children}</label>;
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:disabled:bg-slate-950/60 h-11";

export default function ProfileDetailsPanel() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const parts = (user.name ?? "").trim().split(/\s+/);
    setFirstName(parts[0] ?? "");
    setLastName(parts.slice(1).join(" "));
    setDepartment(user.department ?? "");
    setLocation(user.location ?? "");
    setBirthDate(toInputDate(user.birthDate));
    setJoiningDate(toInputDate(user.joiningDate));
  }, [user]);

  const handleSave = async () => {
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!fullName) {
      toast({ title: "Validation Error", description: "First name is required.", variant: "destructive" });
      return;
    }

    if (birthDate) {
      const birth = new Date(birthDate);
      const today = new Date();
      if (birth >= today) {
        toast({ title: "Validation Error", description: "Birth date must be in the past.", variant: "destructive" });
        return;
      }
      // Check if employee is at least 16 years old
      const ageLimitDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
      if (birth > ageLimitDate) {
        toast({ title: "Validation Error", description: "Employee must be at least 16 years old.", variant: "destructive" });
        return;
      }
    }

    if (joiningDate) {
      const joining = new Date(joiningDate);
      const today = new Date();
      // Allow joining date to be pre-hire up to 3 months in future
      const maxFutureDate = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());
      if (joining > maxFutureDate) {
        toast({ title: "Validation Error", description: "Joining date cannot be more than 3 months in the future.", variant: "destructive" });
        return;
      }
    }

    try {
      setSaving(true);
      await authApi.updateProfile({
        name: fullName,
        department: department.trim(),
        location: location.trim(),
        birthDate: birthDate || undefined,
        joiningDate: joiningDate || undefined,
      });
      await refreshUser();
      toast({ title: "Changes saved", description: "Your profile has been updated successfully." });
    } catch (err: unknown) {
      const description = err instanceof Error ? err.message : "Something went wrong.";
      toast({ title: "Error saving changes", description, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-12">
      {/* Profile Header Card */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          {/* Large Avatar */}
          <div className="relative shrink-0 flex flex-col items-center gap-3">
            <div className="relative rounded-full ring-4 ring-slate-100 dark:ring-slate-900 shadow-lg">
              <UserAvatar name={user?.name} size="h-28 w-28" fallbackClassName="text-4xl font-extrabold" />
            </div>
          </div>

          {/* Profile Name & Title */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {user?.name}
            </h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 text-sm text-slate-500 dark:text-slate-400">
              <span className="font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300">
                {user?.role || "Employee"}
              </span>
              <span className="text-slate-300 dark:text-slate-800">•</span>
              <span className="font-semibold">{user?.department || "Nexer Team"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Basic Details Form */}
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <h3 className="mb-6 border-b border-slate-100 pb-4 text-lg font-bold text-slate-950 dark:border-slate-800 dark:text-white">
          Basic Details
        </h3>
        
        <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          {/* Column 1 */}
          <div className="flex flex-col gap-6">
            <div>
              <FieldLabel>First Name</FieldLabel>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <FieldLabel>Last Name</FieldLabel>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <FieldLabel>Email Address</FieldLabel>
              <input value={user?.email ?? ""} disabled className={inputClass} />
            </div>
            <div>
              <FieldLabel>DOB (Date of Birth)</FieldLabel>
              <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={inputClass} />
            </div>
          </div>

          {/* Column 2 */}
          <div className="flex flex-col gap-6">
            <div>
              <FieldLabel>Role/Designation</FieldLabel>
              <input value={user?.role ?? ""} disabled className={inputClass} />
            </div>
            <div>
              <FieldLabel>Department</FieldLabel>
              <input value={department} onChange={(e) => setDepartment(e.target.value)} className={inputClass} />
            </div>
            <div>
              <FieldLabel>Location</FieldLabel>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" className={inputClass} />
            </div>
            <div>
              <FieldLabel>DOJ (Date of Joining)</FieldLabel>
              <input type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700 disabled:opacity-60 disabled:pointer-events-none active:scale-[0.98] duration-150"
        >
          {saving ? <RefreshCw className="h-4.5 w-4.5 animate-spin" /> : <Save className="h-4.5 w-4.5" />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
