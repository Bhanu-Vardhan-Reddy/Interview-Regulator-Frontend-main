import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getSession } from "@/lib/authStorage";
import {
  fetchInterviewById,
  fetchQuestionsBySession,
  isBackendUserId,
  submitQuestion,
} from "@/lib/dashboardApi";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send } from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

const ExpertSessionQuestions = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const auth = getSession();
  const expert =
    auth?.profile?.type === "expert" ? auth.profile : null;
  const expertId = expert?.id ?? "";
  const backendLinked = Boolean(expert && isBackendUserId(expertId));

  const [questionText, setQuestionText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const interviewQuery = useQuery({
    queryKey: ["interview", sessionId],
    queryFn: () => fetchInterviewById(sessionId!),
    enabled: Boolean(sessionId && backendLinked),
  });

  const questionsQuery = useQuery({
    queryKey: ["questions-session", sessionId],
    queryFn: () => fetchQuestionsBySession(sessionId!),
    enabled: Boolean(sessionId && backendLinked),
  });

  if (!auth?.profile) {
    return <Navigate to="/login" replace />;
  }

  if (!expert) {
    return <Navigate to="/" replace />;
  }

  if (!sessionId) {
    return <Navigate to="/expert/assignments" replace />;
  }

  if (!backendLinked) {
    return (
      <div className="min-h-screen p-6">
        <p className="text-muted-foreground text-sm">Not linked to API.</p>
        <Button className="mt-4" variant="outline" onClick={() => navigate("/")}>
          Home
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = questionText.trim();
    if (text.length < 10) {
      toast({
        title: "Question too short",
        description: "Enter at least 10 characters.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      await submitQuestion({
        question_text: text,
        expert_id: expertId,
        session_id: sessionId,
      });
      setQuestionText("");
      await queryClient.invalidateQueries({
        queryKey: ["questions-session", sessionId],
      });
      toast({ title: "Question added" });
    } catch (err) {
      toast({
        title: "Failed to submit",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const interview = interviewQuery.data;
  const questions = questionsQuery.data ?? [];

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Session questions</h1>
        {interview && (
          <p className="text-sm text-muted-foreground">{interview.job_role}</p>
        )}
      </div>

      {interviewQuery.isPending && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {interviewQuery.isError && (
        <p className="text-destructive text-sm">
          {interviewQuery.error instanceof Error
            ? interviewQuery.error.message
            : "Could not load interview."}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Add a question</CardTitle>
          <CardDescription>
            Questions are scored for relevance to the job role. Candidates can
            start the interview once questions exist.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="qtext">Question text</Label>
              <Textarea
                id="qtext"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Enter your interview question (min. 10 characters)…"
                className="mt-2 min-h-28"
                maxLength={1000}
                disabled={submitting}
              />
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Submit question
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing questions ({questions.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {questionsQuery.isPending ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : questions.length === 0 ? (
            <p className="text-sm text-muted-foreground">None yet.</p>
          ) : (
            <ul className="space-y-3">
              {questions.map((q) => (
                <li key={q.id} className="border rounded-lg p-4 text-sm space-y-2">
                  <p className="font-medium">{q.question_text}</p>
                  <p className="text-xs text-muted-foreground">
                    Relevance: {q.question_relevance} ·{" "}
                    {new Date(q.created_at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpertSessionQuestions;
