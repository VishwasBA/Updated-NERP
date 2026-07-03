import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useEmployees,
  useMyRecognitions,
  useRecognitions,
} from "@/hooks/useApiData";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Award,
  CalendarDays,
  MapPin,
  Mail,
  Trophy,
  Users,
  Heart,
  Sparkles,
} from "lucide-react";

import ProfileCard from "@/components/dashboard/ProfileCard";
import StatCard from "@/components/dashboard/StatCard";
import TimelineItem from "@/components/dashboard/TimelineItem";
import AwardCard from "@/components/dashboard/AwardCard";

function formatDate(date?: string) {
  if (!date) return "Not available";

  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function Profile() {
  const { user, loading: authLoading } = useAuth();

  const { data: employees = [], isLoading: employeesLoading } =
    useEmployees();

  const { data: recognitions = [], isLoading: recognitionsLoading } =
    useRecognitions({
      status: "approved",
    });

  const {
    data: myRecognitions = [],
    isLoading: myRecognitionsLoading,
  } = useMyRecognitions();

  const isLoading =
    authLoading ||
    employeesLoading ||
    recognitionsLoading ||
    myRecognitionsLoading;

  const receivedRecognitions = useMemo(
    () =>
      myRecognitions
        .filter((item) => item.toEmployeeId === user?.id)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        ),
    [myRecognitions, user?.id]
  );

  const sentRecognitions = useMemo(
    () =>
      myRecognitions.filter(
        (item) => item.fromEmployee?.id === user?.id
      ),
    [myRecognitions, user?.id]
  );

  const awardRecognitions = useMemo(
    () =>
      receivedRecognitions.filter(
        (item) => item.type === "nomination"
      ),
    [receivedRecognitions]
  );

  const badgeCount = useMemo(
    () =>
      new Set(
        awardRecognitions
          .map((item) => item.category?.name)
          .filter(Boolean)
      ).size,
    [awardRecognitions]
  );

  const monthlyRecognitions = useMemo(() => {
    const now = new Date();

    return receivedRecognitions.filter((item) => {
      const created = new Date(item.createdAt);

      return (
        created.getMonth() === now.getMonth() &&
        created.getFullYear() === now.getFullYear()
      );
    });
  }, [receivedRecognitions]);

  const leaderboardRank = useMemo(() => {
    if (!user || employees.length === 0) return null;

    const rankings = employees.map((employee) => {
      const points = recognitions
        .filter(
          (rec) =>
            rec.toEmployee?.id === employee.id &&
            rec.type === "nomination"
        )
        .reduce((sum, rec) => sum + (rec.points || 0), 0);

      return {
        id: employee.id,
        points,
      };
    });

    const sorted = [...rankings].sort(
      (a, b) => b.points - a.points
    );

    const index = sorted.findIndex(
      (entry) => entry.id === user.id
    );

    return index >= 0 ? index + 1 : null;
  }, [employees, recognitions, user]);

  const totalPoints = user?.totalPoints ?? 0;

  const profileFields = [
    {
      label: "Employee ID",
      value: user?.id ?? "Not available",
    },
    {
      label: "Email",
      value: user?.email ?? "Not available",
    },
    {
      label: "Department",
      value: user?.department ?? "Not available",
    },
    {
      label: "Designation",
      value: user?.role ?? "Not available",
    },
    {
      label: "Role",
      value: user?.userRole ?? "Not available",
    },
    {
      label: "Location",
      value: user?.location ?? "Not available",
    },
    {
      label: "Joining Date",
      value: "Not available",
    },
  ];

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="h-40 animate-pulse rounded-3xl bg-muted" />

        <div className="grid gap-6 lg:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="h-48 animate-pulse rounded-3xl bg-muted"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <Card className="overflow-hidden border">
        <div className="bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 p-8 text-white">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em]">
                Employee Profile
              </p>

              <h1 className="text-3xl font-bold">
                {user?.name ?? "Employee"}
              </h1>

              <p className="mt-2 text-white/80">
                Track recognitions, awards, points and
                achievements.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {user?.department ?? "No Department"}
              </Badge>

              <Badge variant="outline">
                {user?.userRole ?? "No Role"}
              </Badge>

              {leaderboardRank !== null && (
                <Badge>
                  <Trophy className="mr-1 h-3 w-3" />
                  Rank #{leaderboardRank}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
        {/* Left */}
        <div className="space-y-6">
          <ProfileCard
            name={user?.name}
            avatar={user?.avatar}
            department={user?.department}
            role={user?.role}
            id={user?.id}
            email={user?.email}
            joined={"Not available"}
            completion={100}
          />

          <div className="grid gap-3">
            <StatCard
              title="Total Points"
              value={totalPoints}
              icon={<Trophy className="h-5 w-5" />}
            />

            <StatCard
              title="Recognitions"
              value={receivedRecognitions.length}
              icon={<Heart className="h-5 w-5" />}
            />

            <StatCard
              title="Leaderboard"
              value={
                leaderboardRank !== null
                  ? `#${leaderboardRank}`
                  : "—"
              }
              icon={<Users className="h-5 w-5" />}
            />
          </div>
        </div>

        {/* Right */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                Recognition Summary
              </CardTitle>
              <CardDescription>
                Performance overview
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <StatCard
                  title="Points"
                  value={totalPoints}
                  icon={<Heart className="h-5 w-5" />}
                />

                <StatCard
                  title="Awards"
                  value={awardRecognitions.length}
                  icon={<Award className="h-5 w-5" />}
                />

                <StatCard
                  title="Badges"
                  value={badgeCount}
                  icon={<Sparkles className="h-5 w-5" />}
                />

                <StatCard
                  title="Sent"
                  value={sentRecognitions.length}
                  icon={<Users className="h-5 w-5" />}
                />

                <StatCard
                  title="Monthly"
                  value={monthlyRecognitions.length}
                  icon={
                    <CalendarDays className="h-5 w-5" />
                  }
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  Recognition History
                </CardTitle>
              </CardHeader>

              <CardContent>
                {receivedRecognitions.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                    No recognitions received
                  </div>
                ) : (
                  <div className="space-y-3">
                    {receivedRecognitions
                      .slice(0, 6)
                      .map((recognition) => (
                        <TimelineItem
                          key={recognition.id}
                          id={recognition.id}
                          fromName={
                            recognition.fromEmployee?.name
                          }
                          message={recognition.message}
                          points={recognition.points}
                          category={
                            recognition.category?.name ??
                            recognition.type
                          }
                          date={formatDate(
                            recognition.createdAt
                          )}
                          avatar={
                            recognition.fromEmployee
                              ?.avatar
                          }
                        />
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  Awards Received
                </CardTitle>
              </CardHeader>

              <CardContent>
                {awardRecognitions.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                    No awards earned
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {awardRecognitions
                      .slice(0, 4)
                      .map((recognition) => (
                        <AwardCard
                          key={recognition.id}
                          title={
                            recognition.category?.name ??
                            "Award"
                          }
                          description={
                            recognition.category
                              ?.description ||
                            recognition.message
                          }
                          badge={`${recognition.points} pts`}
                          date={formatDate(
                            recognition.createdAt
                          )}
                        />
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Personal Information
          </CardTitle>
          <CardDescription>
            Employee directory details
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {profileFields.map((field) => (
              <div
                key={field.label}
                className="rounded-xl border p-4"
              >
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  {field.label}
                </p>

                <p className="mt-2 font-medium">
                  {field.value}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}