import { useMemo, useState } from "react";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  deleteInterview,
  fetchExpertProfile,
  fetchInterviewAssignments,
  fetchQuestionsBySession,
  type InterviewOut,
} from "@/lib/dashboardApi";
import { isInterviewSubmitted } from "@/lib/interviewSubmissionLock";

export default function CandidateInterviewRow({ row }: { row: InterviewOut }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

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
  const scheduledMs = row.time ? new Date(row.time).getTime() : NaN;
  const isScheduledInFuture = Number.isFinite(scheduledMs) && scheduledMs > Date.now();
  const submitted = isInterviewSubmitted(row.id);
  const canStart = qCount > 0 && row.score == null && !isScheduledInFuture && !submitted;
  const completed = row.score != null;
  const canCancel = !completed && !submitted;

  const openInterview = () => {
    const params = new URLSearchParams({ jobRole: row.job_role });
    navigate(`/interview/${row.id}?${params.toString()}`);
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await deleteInterview(row.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["candidate-interviews"] }),
        queryClient.invalidateQueries({ queryKey: ["candidate-interviews", row.candidate_id] }),
      ]);
      queryClient.removeQueries({ queryKey: ["interview-assignments", row.id] });
      queryClient.removeQueries({ queryKey: ["questions-session", row.id] });
      toast({ title: "Interview cancelled" });
      setConfirmOpen(false);
    } catch (e) {
      toast({
        title: "Cancel failed",
        description: e instanceof Error ? e.message : "Could not cancel interview.",
        variant: "destructive",
      });
    } finally {
      setCancelling(false);
    }
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
              {completed ? "completed" : submitted ? "submitted" : "pending"}
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
              Questions: {questionsQuery.isPending ? "…" : qCount}
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
                      {expertNameById.get(a.expert_id) ?? a.expert_id} (priority {a.priority})
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
            : submitted
              ? "Submitted"
            : isScheduledInFuture
              ? "Scheduled"
              : canStart
                ? "Start interview"
                : "Waiting for questions"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!canCancel || cancelling}
          onClick={() => setConfirmOpen(true)}
        >
          {submitted ? "Locked" : "Cancel"}
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={(v) => !cancelling && setConfirmOpen(v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this interview?</DialogTitle>
            <DialogDescription>
              This will delete the interview session and related data on the server.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={cancelling}>
              Keep
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? "Cancelling…" : "Cancel interview"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

