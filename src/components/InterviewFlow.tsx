import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  fetchQuestionsBySession,
  submitAnswer,
  submitInterviewForScoring,
} from "@/lib/dashboardApi";
import { markInterviewSubmitted } from "@/lib/interviewSubmissionLock";
import {
  PlayCircle,
  CheckCircle,
  ArrowLeft,
  Award,
  Timer,
  Send,
  Loader2,
} from "lucide-react";

export interface InterviewFlowProps {
  sessionId: string;
  candidateId: string;
  jobRole: string;
  scheduledAt?: string | null;
  onBack: () => void;
}

export const InterviewFlow: React.FC<InterviewFlowProps> = ({
  sessionId,
  candidateId,
  jobRole,
  scheduledAt,
  onBack,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<"ready" | "in_progress" | "completed">(
    "ready"
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<string>>(
    new Set()
  );
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [submittingFinal, setSubmittingFinal] = useState(false);

  const questionsQuery = useQuery({
    queryKey: ["questions-session", sessionId],
    queryFn: () => fetchQuestionsBySession(sessionId),
  });

  const questions = questionsQuery.data ?? [];
  const sortedQuestions = useMemo(
    () => [...questions].sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [questions]
  );

  const currentQuestion = sortedQuestions[currentIndex] ?? null;
  const progress =
    sortedQuestions.length > 0
      ? ((currentIndex + 1) / sortedQuestions.length) * 100
      : 0;

  const scheduledMs = scheduledAt ? new Date(scheduledAt).getTime() : NaN;
  const isScheduledInFuture = Number.isFinite(scheduledMs) && scheduledMs > Date.now();

  const startInterview = () => {
    if (isScheduledInFuture) {
      toast({
        title: "Too early",
        description: scheduledAt
          ? `This interview starts at ${new Date(scheduledAt).toLocaleString()}.`
          : "This interview is scheduled for later.",
        variant: "destructive",
      });
      return;
    }
    if (sortedQuestions.length === 0) return;
    setPhase("in_progress");
    setCurrentIndex(0);
    setAnsweredQuestionIds(new Set());
    toast({
      title: "Interview started",
      description: "Answer each question and submit when ready.",
    });
  };

  const handleSubmitAnswer = async () => {
    if (!currentQuestion || !currentAnswer.trim()) {
      toast({
        title: "Answer required",
        description: "Please enter an answer before continuing.",
        variant: "destructive",
      });
      return;
    }

    setSubmittingAnswer(true);
    try {
      await submitAnswer({
        candidate_id: candidateId,
        question_id: currentQuestion.id,
        answer_text: currentAnswer.trim(),
      });
      setAnsweredQuestionIds((prev) =>
        new Set(prev).add(currentQuestion.id)
      );
      setCurrentAnswer("");

      if (currentIndex < sortedQuestions.length - 1) {
        setCurrentIndex((i) => i + 1);
        toast({ title: "Answer saved", description: "Moving to next question." });
      } else {
        setSubmittingFinal(true);
        try {
          // Lock locally so candidates can't reattempt/cancel after submission.
          markInterviewSubmitted(sessionId);
          const out = await submitInterviewForScoring(sessionId);
          setFinalScore(out.score ?? null);
          setPhase("completed");
          await queryClient.invalidateQueries({
            queryKey: ["candidate-interviews", candidateId],
          });
          toast({
            title: "Interview submitted",
            description:
              out.score != null
                ? `Final score: ${out.score}%`
                : "Your interview was processed.",
          });
        } catch (e) {
          // Even if scoring fails, the attempt is considered final per product rules.
          setPhase("completed");
          await queryClient.invalidateQueries({
            queryKey: ["candidate-interviews", candidateId],
          });
          toast({
            title: "Could not finalize interview",
            description: e instanceof Error ? e.message : "Submission failed.",
            variant: "destructive",
          });
        } finally {
          setSubmittingFinal(false);
        }
      }
    } catch (e) {
      toast({
        title: "Could not save answer",
        description: e instanceof Error ? e.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingAnswer(false);
    }
  };

  if (questionsQuery.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (questionsQuery.isError) {
    return (
      <div className="min-h-screen p-6">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <p className="text-destructive text-sm">
          {questionsQuery.error instanceof Error
            ? questionsQuery.error.message
            : "Failed to load questions."}
        </p>
      </div>
    );
  }

  if (sortedQuestions.length === 0) {
    return (
      <div className="min-h-screen p-6">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to dashboard
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>No questions yet</CardTitle>
            <CardDescription>
              An assigned expert must add questions before you can start this
              interview.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (phase === "ready") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5 p-4">
        <div className="container mx-auto max-w-4xl pt-8">
          <Button variant="ghost" onClick={onBack} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to dashboard
          </Button>

          <Card className="bg-gradient-card shadow-xl animate-slide-up">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3">
                <PlayCircle className="h-8 w-8 text-primary" />
                Interview
              </CardTitle>
              <CardDescription className="text-lg">
                {jobRole} &middot; {sortedQuestions.length} question
                {sortedQuestions.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-8">
              <div className="bg-muted/50 p-6 rounded-lg">
                <h3 className="font-semibold mb-4">Instructions</h3>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li>Answer each question clearly.</li>
                  <li>After the last answer, the interview is submitted for scoring.</li>
                  {scheduledAt && (
                    <li>
                      Scheduled start:{" "}
                      <span className="font-medium text-foreground">
                        {new Date(scheduledAt).toLocaleString()}
                      </span>
                    </li>
                  )}
                </ul>
              </div>

              <div className="text-center">
                <Button variant="hero" size="xl" onClick={startInterview} disabled={isScheduledInFuture}>
                  <PlayCircle className="mr-2 h-5 w-5" />
                  {isScheduledInFuture ? "Scheduled" : "Start interview"}
                </Button>
                {isScheduledInFuture && scheduledAt && (
                  <p className="text-sm text-muted-foreground mt-3">
                    You can start this interview at {new Date(scheduledAt).toLocaleString()}.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (phase === "completed") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5 p-4">
        <div className="container mx-auto max-w-4xl pt-8">
          <Card className="bg-gradient-card shadow-xl animate-slide-up">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3">
                <CheckCircle className="h-8 w-8 text-success" />
                Completed
              </CardTitle>
              <CardDescription className="text-lg">{jobRole}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-8 text-center">
              {finalScore != null && (
                <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-primary text-white mb-4">
                  <span className="text-4xl font-bold">{finalScore}</span>
                </div>
              )}
              {finalScore != null ? (
                <p className="text-2xl font-semibold">Final score: {finalScore}%</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  This interview has been submitted. Scoring may take a moment, or the server may
                  have rejected scoring. You cannot attempt this interview again.
                </p>
              )}
              <Button variant="hero" size="lg" onClick={onBack}>
                Return to dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5 p-4">
      <div className="container mx-auto max-w-4xl pt-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline">
              Question {currentIndex + 1} of {sortedQuestions.length}
            </Badge>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Timer className="h-4 w-4" />
              <span className="text-sm">Take your time</span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="bg-gradient-card shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl leading-relaxed">
              {currentQuestion?.question_text}
            </CardTitle>
            <CardDescription>
              Relevance: {currentQuestion?.question_relevance ?? "—"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="answer">Your answer</Label>
              <Textarea
                id="answer"
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Type your answer…"
                className="min-h-32 mt-2"
                disabled={submittingAnswer || submittingFinal}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  if (currentIndex > 0) {
                    setCurrentIndex((i) => i - 1);
                    setCurrentAnswer("");
                  }
                }}
                disabled={currentIndex === 0 || submittingAnswer || submittingFinal}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              <Button
                variant="hero"
                onClick={handleSubmitAnswer}
                disabled={
                  !currentAnswer.trim() || submittingAnswer || submittingFinal
                }
              >
                {submittingFinal || submittingAnswer ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : currentIndex === sortedQuestions.length - 1 ? (
                  <Award className="mr-2 h-4 w-4" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {currentIndex === sortedQuestions.length - 1
                  ? "Submit final answer & finish"
                  : "Submit answer"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Answered: {answeredQuestionIds.size} / {sortedQuestions.length}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
