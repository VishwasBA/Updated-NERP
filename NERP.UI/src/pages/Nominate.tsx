import { Card, CardContent } from "@/components/ui/card";
import { Award, Lock, ArrowRight, Heart, ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  useEmployees,
  useAwardCategories,
  useCreateRecognition,
} from "@/hooks/useApiData";
import { toast } from "sonner";
import NominationWizard from "@/components/nomination/NominationWizard";
import { Button } from "@/components/ui/button";

export default function Nominate() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const { data: categories = [], isLoading: categoriesLoading } = useAwardCategories();
  const createMutation = useCreateRecognition();

  // Prefill employee ID passed in location state
  const prefillEmployeeId = (location.state as { employeeId?: number } | null)?.employeeId ?? null;

  const isManager = user?.userRole === "cu_manager" || user?.userRole === "bu_manager" || user?.userRole === "admin";

  const managerCategories = categories.filter((c) => c.managerOnly);

  const handleNominate = async ({
    toEmployeeId,
    categoryId,
    message,
    customCategory,
    awardCycle,
  }: {
    toEmployeeId: number;
    categoryId: number | null;
    message: string;
    customCategory?: string;
    awardCycle?: string;
  }) => {
    try {
      await createMutation.mutateAsync({
        toEmployeeId,
        message,
        categoryId,
        type: "nomination",
        customCategory,
        awardCycle,
      });
      toast.success("Nomination submitted for approval! 🏆");
      // Go back to the dashboard after successful submission
      navigate("/nominations");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit nomination";
      toast.error(msg);
      throw err;
    }
  };

  if (!isManager) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card className="glass-card py-16 text-center">
          <CardContent>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Lock className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="mb-2 text-2xl font-bold">Manager Access Required</h2>
            <p className="text-muted-foreground">
              Only managers and admins can nominate employees for award categories.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (employeesLoading || categoriesLoading) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card className="glass-card py-16 text-center">
          <CardContent>
            <p className="text-muted-foreground">Loading nomination form...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container-page space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate("/nominations")}
            className="gap-1.5 mb-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Button>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            Create Nomination
            <Award className="h-7 w-7 text-primary" />
          </h1>
          <p className="mt-1 text-muted-foreground">Recognize outstanding employees with formal nominations</p>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Card 1: Send Appreciation */}
        <Card className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-950 p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between h-full group hover:border-pink-200 dark:hover:border-pink-900/50">
          <CardContent className="p-0 flex flex-col h-full justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-pink-50 dark:bg-pink-950/30 p-3 text-pink-600 dark:text-pink-400 group-hover:scale-110 transition duration-200 shrink-0">
                <Heart className="h-6 w-6 fill-current" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Send Appreciation</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Recognize employees instantly through Kudos/Appreciation.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-2">
              <Button
                onClick={() => navigate("/appreciate", { state: { employeeId: prefillEmployeeId } })}
                className="w-full sm:w-auto bg-pink-600 text-white hover:bg-pink-700 font-semibold gap-1.5 rounded-xl transition"
              >
                Go to Appreciation <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Create Nomination */}
        <Card className="rounded-2xl border-2 border-indigo-600/30 bg-indigo-50/10 dark:border-indigo-500/20 dark:bg-indigo-950/10 p-5 shadow-sm flex flex-col justify-between h-full group">
          <CardContent className="p-0 flex flex-col h-full justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 p-3 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition duration-200 shrink-0">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Create Nomination</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Nominate employees for Spot Awards and Performance Awards.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-2">
              <Button
                disabled
                className="w-full sm:w-auto bg-indigo-600 text-white font-semibold gap-1.5 rounded-xl opacity-90 cursor-default"
              >
                Current Flow: Create Nomination
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <NominationWizard
        heading="New Nomination"
        categories={managerCategories}
        employees={employees}
        currentUserId={user?.id}
        isSubmitting={createMutation.isPending}
        submitLabel="Submit Nomination"
        successTitle="Nomination Submitted!"
        successMessage="The nomination will be reviewed for approval before it's added to the Wall of Fame."
        footerNote="Your nomination will be sent to the admin for approval."
        onSubmit={handleNominate}
        initialEmployeeId={prefillEmployeeId}
      />
    </div>
  );
}
