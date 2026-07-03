import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";
``
import {
  Award,
  CheckCircle,
  Lock,
  ChevronsUpDown
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployees, useAwardCategories, useCreateRecognition } from "@/hooks/useApiData";
import { toast } from "sonner";

export default function Nominations() {
  const { user } = useAuth();
  const { data: employees = [] } = useEmployees();
  const { data: categories = [] } = useAwardCategories();
  const createMutation = useCreateRecognition();

  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
const otherEmployees = employees.filter(e => e.id !== user?.id);

  const [search, setSearch] = useState("");
const [open, setOpen] = useState(false);

const filteredEmployees = otherEmployees.filter(emp =>
  `${emp.name} ${emp.role}`
    .toLowerCase()
    .includes(search.toLowerCase())
);

  const isManager = user?.userRole === "manager" || user?.userRole === "admin";
  const managerCategories = categories.filter(c => c.managerOnly);
  
  const handleNominate = async () => {
    if (!selectedEmployee || !selectedCategory || !message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      await createMutation.mutateAsync({
        toEmployeeId: Number(selectedEmployee),
        message: message.trim(),
        categoryId: Number(selectedCategory),
        type: "nomination",
      });
      setSent(true);
      toast.success("Nomination submitted for approval! 🏆");
      setTimeout(() => {
        setSent(false);
        setSelectedEmployee("");
        setSelectedCategory("");
        setMessage("");
      }, 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit nomination";
      toast.error(message);
    }
  };

  if (!isManager) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="glass-card text-center py-16">
          <CardContent>
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Manager Access Required</h2>
            <p className="text-muted-foreground">Only managers and admins can nominate employees for award categories.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="glass-card text-center py-16">
          <CardContent>
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Nomination Submitted!</h2>
            <p className="text-muted-foreground">The nomination will be reviewed for approval.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
    <h1 className="text-3xl font-bold">
      <div className="flex items-center gap-2">
        <span className="font-medium">
          Nominate for an Award
        </span>
        <Award className="text-3xl text-primary" />
      </div>
    </h1>
    <p className="text-muted-foreground mt-1">Recognize outstanding employees with formal nominations</p>
  </div>
  
  {/* <div>
        <h1 className="text-2xl font-bold">Nominate for Award</h1>
        <p className="text-muted-foreground mt-1">Recognize outstanding employees with formal nominations</p>
      </div> */}

  <div className="grid lg:grid-cols-3 gap-8 mt-8">

  {/* LEFT SIDE */}
  <div className="lg:col-span-2">

    <Card className="glass-card">
      <CardContent className="p-6 space-y-6">

        <div>
  <label className="text-sm font-medium mb-2 block">
    Nominate Employee
  </label>
  

  <div className="relative">
    <input
      type="text"
      placeholder="Search employee..."
      value={
        open
          ? search
          : selectedEmployee
          ? otherEmployees.find(
              e => String(e.id) === selectedEmployee
            )?.name || ""
          : ""
      }
      onChange={(e) => {
        setSearch(e.target.value);
        setSelectedEmployee("");
        setOpen(true);
      }}
      onFocus={() => setOpen(true)}
      className={`w-full h-10 px-3 pr-10 rounded-md bg-background outline-none
      ${
        open
          ? "border border-primary ring-1 ring-primary"
          : "border border-input"
      }`}
    />

    <button
      type="button"
      onClick={() => setOpen(!open)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
    >
      <ChevronsUpDown className="h-4 w-4" />
    </button>

    {open && (
      <div className="absolute z-50 w-full mt-1 bg-background dark:bg-slate-900 text-foreground border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
        {filteredEmployees.length === 0 ? (
          <div className="p-3 text-sm text-muted-foreground">
            No employee found
          </div>
        ) : (
          filteredEmployees.map(emp => (
            <div
              key={emp.id}
              className="flex items-center gap-2 px-3 py-2 cursor-pointer text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => {
                setSelectedEmployee(String(emp.id));
                setSearch("");
                setOpen(false);
              }}
            >
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px]">
                  {emp.avatar}
                </AvatarFallback>
              </Avatar>

              <span>
                {emp.name} · {emp.role}
              </span>
            </div>
          ))
        )}
      </div>
    )}
  </div>
</div>
<div>
  <label className="text-sm font-medium mb-3 block">
    Select Award Category
  </label>
  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
      {managerCategories.map(cat => (
        <button
          key={cat.id}
          onClick={() => setSelectedCategory(String(cat.id))}
          className={`
            h-24
            rounded-xl
            border
            transition-all
            ${
              selectedCategory === String(cat.id)
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary"
            }
          `}
        >
          <div className="text-2xl">{cat.icon}</div>

          <div className="text-sm font-medium mt-2">
            {cat.name}
          </div>

          <div className="text-xs text-muted-foreground">
            +{cat.points} pts
          </div>
        </button>
      ))}
    </div>
    </div>
        {/* REMOVE AWARD CATEGORY SELECT DROPDOWN */}

        <div>
          <label className="text-sm font-medium mb-2 block">
            Nomination Reason
          </label>

          <Textarea
            placeholder="Explain why this employee deserves this award..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={6}
            className="resize-none"
          />
        </div>
        <div>
  <label className="text-sm font-medium mb-2 block">
    Quick Templates
  </label>

  <div className="flex flex-wrap gap-2">
    {[
  "Outstanding performance!",
  "Great innovation!",
  "Consistent excellence!",
  "Project hero!"
].map((template) => (
      <button
        key={template}
        type="button"
        onClick={() => setMessage(template)}
        className="
          px-3 py-2
          text-sm
          rounded-lg
          border
          border-border
          hover:border-primary
          hover:bg-primary/5
          focus:outline-none
          transition-all
        "
      >
        {template.length > 35
          ? template.substring(0, 35) + "..."
          : template}
      </button>
    ))}
  </div>
</div>

        <Button
          onClick={handleNominate}
          className="
w-full
gradient-primary
text-primary-foreground
font-semibold
"
          size="lg"
          disabled={createMutation.isPending}
        >
          <Award className="w-4 h-4 mr-2" />
          {createMutation.isPending
            ? "Submitting..."
            : "Submit Nomination"}
        </Button>

      </CardContent>
    </Card>
  </div>

  {/* RIGHT SIDE PREVIEW */}
  <div>
    <Card className="glass-card sticky top-4">
      <CardContent className="p-6">

        <h3 className="font-semibold mb-4">
          Nomination Preview
        </h3>

        <div
        className="dashboard-card p-5">
          <div className="flex items-center gap-3">

            <Avatar>
  <AvatarImage
    src={
      selectedEmployee
        ? otherEmployees.find(
            e => String(e.id) === selectedEmployee
          )?.avatar
        : undefined
    }
  />

  <AvatarFallback className="dashboard-avatar">
    {selectedEmployee
      ? otherEmployees
          .find(e => String(e.id) === selectedEmployee)
          ?.name?.slice(0, 2)
          ?.toUpperCase()
      : "?"}
  </AvatarFallback>
</Avatar>

            <div>
              <p className="font-semibold">
                {selectedEmployee
                  ? otherEmployees.find(
                      e => String(e.id) === selectedEmployee
                    )?.name
                  : "Select Employee"}
              </p>

              <p className="text-sm text-muted-foreground">
                Award Nominee
              </p>
            </div>
          </div>

          {selectedCategory && (
            <Badge
  className="
    mt-4
    bg-primary
    text-primary-foreground
    border-0
  "
>
              {
                managerCategories.find(
                  c => String(c.id) === selectedCategory
                )?.name
              }
            </Badge>
          )}

          <p className="mt-4 text-sm">
            {message ||
              "Your nomination reason preview will appear here."}
          </p>

          <div className="mt-5 text-xs text-muted-foreground">
            From {user?.name}
          </div>

        </div>

      </CardContent>
    </Card>
  </div>

</div>


  

</div>
  );
}
