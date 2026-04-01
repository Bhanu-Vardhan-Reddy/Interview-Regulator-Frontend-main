import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueries, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  getSession,
  logout as clearAuthSession,
  type ExpertProfile,
} from "@/lib/authStorage";
import {
  createInterview,
  fetchCandidateInterviews,
  fetchExpertDashboardStats,
  fetchExpertProfile,
  fetchInterviewAssignments,
  fetchQuestionsBySession,
  isBackendUserId,
  type InterviewOut,
} from "@/lib/dashboardApi";
import {
  Shield,
  Briefcase,
  Clock,
  Star,
  LogOut,
  Plus,
  Calendar,
  Award,
  Users,
  BookOpen,
  Loader2,
} from "lucide-react";

export const AuthenticationSystem: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const user = getSession()?.profile ?? null;
  const backendLinked = Boolean(user && isBackendUserId(user.id));
  const candidateId = user?.type === "candidate" ? user.id : "";
  const expertId = user?.type === "expert" ? user.id : "";

  const candidateInterviewsQuery = useQuery({
    queryKey: ["candidate-interviews", candidateId],
    queryFn: () => fetchCandidateInterviews(candidateId),
    enabled: Boolean(user?.type === "candidate" && backendLinked && candidateId),
  });

  const expertStatsQuery = useQuery({
    queryKey: ["expert-dashboard-stats", expertId],
    queryFn: () => fetchExpertDashboardStats(expertId),
    enabled: Boolean(user?.type === "expert" && backendLinked && expertId),
  });

  const expertRemoteQuery = useQuery({
    queryKey: ["expert-profile-remote", expertId],
    queryFn: () => fetchExpertProfile(expertId),
    enabled: Boolean(user?.type === "expert" && backendLinked && expertId),
  });

  const interviewRows = useMemo((): InterviewOut[] => {
    if (!backendLinked || user?.type !== "candidate") return [];
    return candidateInterviewsQuery.data ?? [];
  }, [backendLinked, user?.type, candidateInterviewsQuery.data]);

  const expertForUi = useMemo((): ExpertProfile | null => {
    if (!user || user.type !== "expert") return null;
    const remote = expertRemoteQuery.data;
    if (!remote) return user as ExpertProfile;
    return {
      ...(user as ExpertProfile),
      name: remote.name,
      expertise: remote.expertise,
      seniority: remote.seniority,
    };
  }, [user, expertRemoteQuery.data]);

  const handleLogout = () => {
    clearAuthSession();
    toast({
      title: "Logged out successfully",
      description: "Thank you for using DRDO RAC Interview System",
    });
    navigate("/login", { replace: true });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">DRDO RAC</h1>
              <p className="text-sm text-muted-foreground">Interview System</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline truncate max-w-[200px]">
              {user.email}
            </span>
            <Badge variant="secondary" className="capitalize">
              {user.type}
            </Badge>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {user.name}</h2>
          <p className="text-muted-foreground">
            {user.type === "candidate"
              ? "Continue your interview journey"
              : "Manage interviews and evaluate candidates"}
          </p>
        </div>

        {!backendLinked && (
          <p className="mb-6 text-sm text-muted-foreground rounded-lg border border-dashed bg-muted/30 px-4 py-3">
            This account is not linked to the live API (missing server profile ID). Register a new
            account to see real interview stats and assignments.
          </p>
        )}

        {user.type === "candidate" && backendLinked && candidateInterviewsQuery.isError && (
          <p className="mb-4 text-sm text-destructive">
            {candidateInterviewsQuery.error instanceof Error
              ? candidateInterviewsQuery.error.message
              : "Could not load interviews from the server."}
          </p>
        )}

        {user.type === "expert" && backendLinked && expertStatsQuery.isError && (
          <p className="mb-4 text-sm text-destructive">
            {expertStatsQuery.error instanceof Error
              ? expertStatsQuery.error.message
              : "Could not load expert statistics from the server."}
          </p>
        )}

        {user.type === "candidate" ? (
          <CandidateDashboard
            candidateId={candidateId}
            interviewRows={interviewRows}
            loading={backendLinked && candidateInterviewsQuery.isPending}
            backendLinked={backendLinked}
          />
        ) : (
          expertForUi && (
            <ExpertDashboard
              expert={expertForUi}
              assignedInterviews={expertStatsQuery.data?.assignedInterviews ?? 0}
              completedReviews={expertStatsQuery.data?.completedReviews ?? 0}
              statsLoading={backendLinked && expertStatsQuery.isPending}
              backendLinked={backendLinked}
            />
          )
        )}
      </main>
    </div>
  );
};

const CandidateInterviewRow: React.FC<{
  row: InterviewOut;
}> = ({ row }) => {
  const navigate = useNavigate();

  const assignmentsQuery = useQuery({
    queryKey: ["interview-assignments", row.id],
    queryFn: () => fetchInterviewAssignments(row.id),
    enabled: Boolean(row.id),
  });

  const questionsQuery = useQuery({
    queryKey: ["questions-session", row.id],
    queryFn: () => fetchQuestionsBySession(row.id),
    enabled: Boolean(row.id),
  });

  const expertIds = useMemo(() => {
    const list = assignmentsQuery.data ?? [];
    return [...new Set(list.map((a) => a.expert_id))];
  }, [assignmentsQuery.data]);

  const expertQueries = useQueries({
    queries: expertIds.map((id) => ({
      queryKey: ["expert", id],
      queryFn: () => fetchExpertProfile(id),
      enabled: expertIds.length > 0,
    })),
  });

  const expertNameById = useMemo(() => {
    const m = new Map<string, string>();
    expertIds.forEach((id, i) => {
      const e = expertQueries[i]?.data;
      m.set(id, e?.name ?? id.slice(0, 8) + "…");
    });
    return m;
  }, [expertIds, expertQueries]);

  const assignments = assignmentsQuery.data ?? [];
  const qCount = questionsQuery.data?.length ?? 0;
  const canStart = qCount > 0 && row.score == null;
  const completed = row.score != null;

  const openInterview = () => {
    const params = new URLSearchParams({
      jobRole: row.job_role,
    });
    navigate(`/interview/${row.id}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg md:flex-row md:items-start md:justify-between">
      <div className="flex items-start gap-4 min-w-0">
        <Briefcase className="h-6 w-6 text-primary shrink-0 mt-0.5" />
        <div className="min-w-0 space-y-2">
          <p className="font-semibold">{row.job_role}</p>
          <p className="text-sm text-muted-foreground">
            {row.time ? new Date(row.time).toLocaleString() : "—"}
          </p>
          <div className="flex flex-wrap gap-2 items-center text-sm">
            <Badge variant={completed ? "default" : "secondary"}>
              {completed ? "completed" : "pending"}
            </Badge>
            {row.score != null && (
              <Badge
                variant="outline"
                className="bg-success/10 text-success border-success/20"
              >
                {row.score}%
              </Badge>
            )}
            <span className="text-muted-foreground">
              Questions:{" "}
              {questionsQuery.isPending ? "…" : qCount}
            </span>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Assigned experts (by priority)</p>
            {assignmentsQuery.isPending ? (
              <p>Loading assignments…</p>
            ) : assignments.length === 0 ? (
              <p>No assignment rows yet.</p>
            ) : (
              <ul className="list-disc pl-4">
                {[...assignments]
                  .sort((a, b) => a.priority - b.priority)
                  .map((a) => (
                    <li key={a.id}>
                      {expertNameById.get(a.expert_id) ?? a.expert_id} (priority{" "}
                      {a.priority})
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      <div className="shrink-0 flex flex-col gap-2 md:items-end">
        <Button
          variant="hero"
          size="sm"
          disabled={!canStart}
          onClick={openInterview}
        >
          {completed
            ? "Completed"
            : canStart
              ? "Start interview"
              : "Waiting for questions"}
        </Button>
      </div>
    </div>
  );
};

const CandidateDashboard: React.FC<{
  candidateId: string;
  interviewRows: InterviewOut[];
  loading: boolean;
  backendLinked: boolean;
}> = ({ candidateId, interviewRows, loading, backendLinked }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [requestOpen, setRequestOpen] = useState(false);
  const [jobRole, setJobRole] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const scored = interviewRows.filter((i) => i.score != null);
  const avg =
    scored.length > 0
      ? Math.round(
          scored.reduce((acc, i) => acc + (i.score ?? 0), 0) / scored.length
        )
      : 0;

  const handleRequestInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    const role = jobRole.trim();
    if (role.length < 2) {
      toast({
        title: "Job role required",
        description: "Enter a job role (at least 2 characters).",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const payload: {
        candidate_id: string;
        job_role: string;
        time?: string | null;
      } = {
        candidate_id: candidateId,
        job_role: role,
      };
      if (scheduledAt) {
        const d = new Date(scheduledAt);
        if (!Number.isNaN(d.getTime())) {
          payload.time = d.toISOString();
        }
      }
      await createInterview(payload);
      await queryClient.invalidateQueries({
        queryKey: ["candidate-interviews", candidateId],
      });
      setRequestOpen(false);
      setJobRole("");
      setScheduledAt("");
      toast({
        title: "Interview requested",
        description: "Experts have been assigned. They can add questions next.",
      });
    } catch (err) {
      toast({
        title: "Request failed",
        description: err instanceof Error ? err.message : "Could not create interview.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const mappedInterviews = useMemo(
    () =>
      [...interviewRows].sort((a, b) =>
        b.time.localeCompare(a.time)
      ),
    [interviewRows]
  );

  return (
    <div className="grid gap-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Interviews
                </p>
                <p className="text-3xl font-bold tabular-nums">
                  {loading ? "…" : interviewRows.length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold text-success tabular-nums">
                  {loading
                    ? "…"
                    : interviewRows.filter((i) => i.score != null).length}
                </p>
              </div>
              <Award className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Average Score
                </p>
                <p className="text-3xl font-bold text-primary tabular-nums">
                  {loading ? "…" : avg}
                </p>
              </div>
              <Star className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
              <DialogTrigger asChild>
                <Button variant="hero" size="lg" disabled={!backendLinked}>
                  <Plus className="mr-2 h-4 w-4" />
                  Request interview
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleRequestInterview}>
                  <DialogHeader>
                    <DialogTitle>Request interview</DialogTitle>
                    <DialogDescription>
                      Creates a session and assigns the top matching experts. Add a
                      job role; optional scheduled time is sent to the API.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="req-job-role">Job role</Label>
                      <Input
                        id="req-job-role"
                        value={jobRole}
                        onChange={(e) => setJobRole(e.target.value)}
                        placeholder="e.g. Software Engineer"
                        required
                        minLength={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="req-time">Scheduled time (optional)</Label>
                      <Input
                        id="req-time"
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting…
                        </>
                      ) : (
                        "Submit request"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="lg" disabled>
              <BookOpen className="mr-2 h-4 w-4" />
              View Results
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Interview History</CardTitle>
          <CardDescription>
            Assigned experts and question readiness per session
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-6">Loading history…</p>
          ) : mappedInterviews.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6">No interviews yet. Request one above.</p>
          ) : (
            <div className="space-y-4">
              {mappedInterviews.map((row) => (
                <CandidateInterviewRow key={row.id} row={row} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const ExpertDashboard: React.FC<{
  expert: ExpertProfile;
  assignedInterviews: number;
  completedReviews: number;
  statsLoading: boolean;
  backendLinked: boolean;
}> = ({
  expert,
  assignedInterviews,
  completedReviews,
  statsLoading,
  backendLinked,
}) => {
  return (
    <div className="grid gap-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Assigned Interviews
                </p>
                <p className="text-3xl font-bold tabular-nums">
                  {statsLoading ? "…" : assignedInterviews}
                </p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Completed Reviews
                </p>
                <p className="text-3xl font-bold text-success tabular-nums">
                  {statsLoading ? "…" : completedReviews}
                </p>
              </div>
              <Award className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Expertise Level
                </p>
                <p className="text-3xl font-bold text-primary tabular-nums">
                  {expert.seniority}/5
                </p>
              </div>
              <Star className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expert Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {backendLinked ? (
              <>
                <Button variant="hero" size="lg" asChild>
                  <Link to="/expert/assignments">
                    <Users className="mr-2 h-4 w-4" />
                    My assignments
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/expert/assignments">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Add questions (pick session)
                  </Link>
                </Button>
                <Button variant="secondary" size="lg" asChild>
                  <Link to="/expert/assignments">
                    <Clock className="mr-2 h-4 w-4" />
                    Active sessions
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/expert/assignments">
                    <Award className="mr-2 h-4 w-4" />
                    Assessment history
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="hero" size="lg" disabled>
                  <Users className="mr-2 h-4 w-4" />
                  My assignments
                </Button>
                <Button variant="outline" size="lg" disabled>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Add questions (pick session)
                </Button>
                <Button variant="secondary" size="lg" disabled>
                  <Clock className="mr-2 h-4 w-4" />
                  Active sessions
                </Button>
                <Button variant="outline" size="lg" disabled>
                  <Award className="mr-2 h-4 w-4" />
                  Assessment history
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Expertise</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold">{expert.expertise}</span>
            </div>
            <div className="flex items-center gap-3">
              <Star className="h-5 w-5 text-primary" />
              <span>Seniority Level: {expert.seniority}/5</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
