import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { authApi } from "@/services/api";
import { Save } from "lucide-react";

function toInputDate(iso?: string) {
  if (!iso) return "";
  return iso.includes("T") ? iso.split("T")[0] : iso;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">{children}</label>;
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:disabled:bg-slate-950";

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
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold text-slate-950 dark:text-white">Profile</h2>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <h3 className="mb-4 border-b border-slate-100 pb-3 text-base font-bold text-slate-950 dark:border-slate-800 dark:text-white">
          Basic Details
        </h3>
        <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <div>
            <FieldLabel>First Name</FieldLabel>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <FieldLabel>Role/Designation</FieldLabel>
            <input value={user?.role ?? ""} disabled className={inputClass} />
          </div>

          <div>
            <FieldLabel>Last Name</FieldLabel>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <FieldLabel>Department</FieldLabel>
            <input value={department} onChange={(e) => setDepartment(e.target.value)} className={inputClass} />
          </div>

          <div>
            <FieldLabel>Official Email</FieldLabel>
            <input value={user?.email ?? ""} disabled className={inputClass} />
          </div>
          <div>
            <FieldLabel>Location</FieldLabel>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" className={inputClass} />
          </div>

          <div>
            <FieldLabel>DOB</FieldLabel>
            <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={inputClass} />
          </div>
          <div>
            <FieldLabel>DOJ</FieldLabel>
            <input type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} className={inputClass} />
          </div>
        </div>
      </div>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
