import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { getSession } from "@/lib/authStorage";
import { fetchCandidateInterviews, isBackendUserId } from "@/lib/dashboardApi";
import { isInterviewSubmitted } from "@/lib/interviewSubmissionLock";
import { Award, Calendar, Star } from "lucide-react";

export default function CandidateAnalytics() {
  const user = getSession()?.profile ?? null;
  const candidateId = user?.type === "candidate" ? user.id : "";
  const backendLinked = Boolean(user && isBackendUserId(user.id));

  const interviewsQuery = useQuery({
    queryKey: ["candidate-interviews", candidateId],
    queryFn: () => fetchCandidateInterviews(candidateId),
    enabled: Boolean(user?.type === "candidate" && backendLinked && candidateId),
  });

  const interviewRows = interviewsQuery.data ?? [];
  const scored = interviewRows.filter((i) => i.score != null);
  const submittedUnscored = useMemo(() => {
    return interviewRows.filter((i) => i.score == null && isInterviewSubmitted(i.id));
  }, [interviewRows]);
  const avg = useMemo(() => {
    return scored.length > 0
      ? Math.round(scored.reduce((acc, i) => acc + (i.score ?? 0), 0) / scored.length)
      : 0;
  }, [scored]);

  if (!user || user.type !== "candidate") {
    return (
      <div className="text-sm text-muted-foreground">
        This page is available for candidate accounts.
      </div>
    );
  }

  if (!backendLinked) {
    return (
      <p className="text-sm text-muted-foreground rounded-lg border border-dashed bg-muted/30 px-4 py-3">
        This account is not linked to the live API (missing server profile ID).
        Register a new account to see real interview analytics.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Your interview stats.</p>
      </div>

      {interviewsQuery.isError && (
        <p className="text-sm text-destructive">
          {interviewsQuery.error instanceof Error
            ? interviewsQuery.error.message
            : "Could not load interviews from the server."}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Interviews</p>
                <p className="text-3xl font-bold tabular-nums">
                  {interviewsQuery.isPending ? "…" : interviewRows.length}
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
                  {interviewsQuery.isPending ? "…" : scored.length + submittedUnscored.length}
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
                <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                <p className="text-3xl font-bold text-primary tabular-nums">
                  {interviewsQuery.isPending ? "…" : avg}
                </p>
              </div>
              <Star className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

