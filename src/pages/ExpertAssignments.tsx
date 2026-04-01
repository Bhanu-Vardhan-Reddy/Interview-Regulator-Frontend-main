import { useMemo } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSession } from "@/lib/authStorage";
import {
  fetchExpertAssignments,
  fetchInterviewById,
  isBackendUserId,
} from "@/lib/dashboardApi";
import { Briefcase, Loader2, PencilLine } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";

const ExpertAssignments = () => {
  const navigate = useNavigate();
  const auth = getSession();
  const expert =
    auth?.profile?.type === "expert" ? auth.profile : null;
  const expertId = expert?.id ?? "";
  const backendLinked = Boolean(expert && isBackendUserId(expertId));

  const assignmentsQuery = useQuery({
    queryKey: ["expert-assignments-list", expertId],
    queryFn: () => fetchExpertAssignments(expertId),
    enabled: backendLinked,
  });

  const sessionIds = useMemo(() => {
    const rows = assignmentsQuery.data ?? [];
    return [
      ...new Set(
        rows.map((a) => a.session).filter((s): s is string => Boolean(s))
      ),
    ];
  }, [assignmentsQuery.data]);

  const interviewQueries = useQueries({
    queries: sessionIds.map((id) => ({
      queryKey: ["interview", id],
      queryFn: () => fetchInterviewById(id),
      enabled: backendLinked && sessionIds.length > 0,
    })),
  });

  const sessionToInterview = useMemo(() => {
    const map = new Map<
      string,
      NonNullable<Awaited<ReturnType<typeof fetchInterviewById>>>
    >();
    sessionIds.forEach((id, i) => {
      const data = interviewQueries[i]?.data;
      if (data) map.set(id, data);
    });
    return map;
  }, [sessionIds, interviewQueries]);

  if (!auth?.profile) {
    return <Navigate to="/login" replace />;
  }

  if (!expert) {
    return <Navigate to="/" replace />;
  }

  if (!backendLinked) {
    return (
      <div className="min-h-screen p-6">
        <p className="text-muted-foreground text-sm mb-4">
          Your account is not linked to the API. Register again with a live
          backend.
        </p>
        <Button variant="outline" onClick={() => navigate("/")}>
          Home
        </Button>
      </div>
    );
  }

  const assignments = assignmentsQuery.data ?? [];
  const loading = assignmentsQuery.isPending;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">My assignments</h1>
        <p className="text-muted-foreground text-sm">
          Sessions assigned to you. Open a session to add questions.
        </p>
      </div>

      {assignmentsQuery.isError && (
        <p className="text-sm text-destructive">
          {assignmentsQuery.error instanceof Error
            ? assignmentsQuery.error.message
            : "Failed to load assignments."}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : sessionIds.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No sessions yet</CardTitle>
            <CardDescription>
              You will see interview sessions here when candidates request
              interviews and the system assigns you.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        sessionIds.map((sid) => {
          const inv = sessionToInterview.get(sid);
          const myAssignment = assignments.find(
            (a) => a.session === sid && a.expert_id === expertId
          );
          return (
            <Card key={sid}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Briefcase className="h-5 w-5 text-primary" />
                    {inv?.job_role ?? "Interview session"}
                  </CardTitle>
                  <CardDescription>
                    {inv?.time
                      ? new Date(inv.time).toLocaleString()
                      : "Scheduled time pending"}
                    {myAssignment != null && (
                      <Badge variant="secondary" className="ml-2">
                        Priority {myAssignment.priority}
                      </Badge>
                    )}
                  </CardDescription>
                </div>
                <Button variant="hero" size="sm" asChild>
                  <Link to={`/expert/sessions/${sid}/questions`}>
                    <PencilLine className="mr-2 h-4 w-4" />
                    Questions
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground font-mono break-all">
                  Session: {sid}
                </p>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
};

export default ExpertAssignments;
