import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { getSession } from "@/lib/authStorage";
import {
  createInterview,
  fetchCandidateInterviews,
  isBackendUserId,
  type InterviewOut,
} from "@/lib/dashboardApi";
import CandidateInterviewRow from "@/components/candidate/CandidateInterviewRow";
import { Loader2, Plus } from "lucide-react";

export default function CandidateInterviews() {
  const session = getSession();
  const user = session?.profile?.type === "candidate" ? session.profile : null;
  const candidateId = user?.id ?? "";
  const backendLinked = Boolean(user && isBackendUserId(user.id));

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const candidateInterviewsQuery = useQuery({
    queryKey: ["candidate-interviews", candidateId],
    queryFn: () => fetchCandidateInterviews(candidateId),
    enabled: Boolean(user && backendLinked && candidateId),
  });

  const [requestOpen, setRequestOpen] = useState(false);
  const [jobRole, setJobRole] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const mappedInterviews = useMemo((): InterviewOut[] => {
    const rows = candidateInterviewsQuery.data ?? [];
    return [...rows].sort((a, b) => b.time.localeCompare(a.time));
  }, [candidateInterviewsQuery.data]);

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
      const payload: { candidate_id: string; job_role: string; time?: string | null } = {
        candidate_id: candidateId,
        job_role: role,
      };
      if (scheduledAt) {
        const d = new Date(scheduledAt);
        if (!Number.isNaN(d.getTime())) payload.time = d.toISOString();
      }
      await createInterview(payload);
      await queryClient.invalidateQueries({ queryKey: ["candidate-interviews", candidateId] });
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

  if (!user) {
    return (
      <div className="text-sm text-muted-foreground">
        This page is available for candidate accounts.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Interviews</h1>
        <p className="text-muted-foreground">Request and start interview sessions.</p>
      </div>

      {!backendLinked && (
        <p className="text-sm text-muted-foreground rounded-lg border border-dashed bg-muted/30 px-4 py-3">
          This account is not linked to the live API (missing server profile ID). Register a new
          account to request interviews and see history.
        </p>
      )}

      {backendLinked && candidateInterviewsQuery.isError && (
        <p className="text-sm text-destructive">
          {candidateInterviewsQuery.error instanceof Error
            ? candidateInterviewsQuery.error.message
            : "Could not load interviews from the server."}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
        </CardHeader>
        <CardContent>
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
                    Creates a session and assigns the top matching experts.
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Interview history</CardTitle>
          <CardDescription>Assigned experts and question readiness per session</CardDescription>
        </CardHeader>
        <CardContent>
          {candidateInterviewsQuery.isPending ? (
            <p className="text-sm text-muted-foreground py-6">Loading history…</p>
          ) : mappedInterviews.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6">
              No interviews yet. Request one above.
            </p>
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
}

