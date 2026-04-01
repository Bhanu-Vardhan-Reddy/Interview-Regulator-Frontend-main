import { InterviewFlow } from "@/components/InterviewFlow";
import { getSession } from "@/lib/authStorage";
import { fetchInterviewById } from "@/lib/dashboardApi";
import { isInterviewSubmitted } from "@/lib/interviewSubmissionLock";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";

const InterviewSessionPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const session = getSession();

  const jobRoleFromQuery = searchParams.get("jobRole") ?? "";

  const interviewQuery = useQuery({
    queryKey: ["interview", sessionId],
    queryFn: () => fetchInterviewById(sessionId!),
    enabled: Boolean(sessionId),
  });

  if (!session?.profile) {
    return <Navigate to="/login" replace />;
  }

  if (session.profile.type !== "candidate") {
    return <Navigate to="/" replace />;
  }

  if (!sessionId) {
    return <Navigate to="/" replace />;
  }

  if (interviewQuery.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const interview = interviewQuery.data;
  const jobRole =
    jobRoleFromQuery || interview?.job_role || "Interview";

  if (interviewQuery.isError || !interview) {
    return (
      <div className="min-h-screen p-6">
        <p className="text-destructive text-sm mb-4">
          {interviewQuery.error instanceof Error
            ? interviewQuery.error.message
            : "Interview not found."}
        </p>
        <button
          type="button"
          className="text-primary underline"
          onClick={() => navigate("/")}
        >
          Back home
        </button>
      </div>
    );
  }

  if (interview.candidate_id !== session.profile.id) {
    return (
      <div className="min-h-screen p-6">
        <p className="text-destructive text-sm">This interview is not yours.</p>
        <button
          type="button"
          className="text-primary underline mt-2"
          onClick={() => navigate("/")}
        >
          Back home
        </button>
      </div>
    );
  }

  if (interview.score != null) {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center justify-center gap-4">
        <p className="text-center text-muted-foreground">
          This interview is already completed. Final score:{" "}
          <strong className="text-foreground">{interview.score}%</strong>
        </p>
        <button
          type="button"
          className="text-primary underline"
          onClick={() => navigate("/", { replace: true })}
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  if (isInterviewSubmitted(interview.id)) {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center justify-center gap-4">
        <p className="text-center text-muted-foreground">
          This interview has already been submitted and cannot be attempted again.
        </p>
        <button
          type="button"
          className="text-primary underline"
          onClick={() => navigate("/candidate/interviews", { replace: true })}
        >
          Back to interviews
        </button>
      </div>
    );
  }

  return (
    <InterviewFlow
      sessionId={sessionId}
      candidateId={session.profile.id}
      jobRole={jobRole}
      scheduledAt={interview.time}
      onBack={() => navigate("/candidate/interviews", { replace: true })}
    />
  );
};

export default InterviewSessionPage;
