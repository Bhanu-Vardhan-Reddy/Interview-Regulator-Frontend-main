import { apiDelete, apiGet, apiGetOptional, apiPost } from "@/lib/apiClient";

/** Backend `InterviewOut` */
export interface InterviewOut {
  id: string;
  candidate_id: string;
  job_role: string;
  score: number | null;
  time: string;
}

/** Backend `InterviewCreate` */
export interface InterviewCreate {
  candidate_id: string;
  job_role: string;
  score?: number | null;
  time?: string | null;
}

/** Backend `AssignmentOut` */
export interface AssignmentOut {
  id: string;
  candidate_id: string;
  expert_id: string;
  session: string | null;
  priority: number;
}

/** Backend `ExpertOut` */
export interface ExpertOut {
  id: string;
  name: string;
  expertise: string;
  seniority: number;
}

/** Backend `CandidateOut` (subset used after registration). */
export interface CandidateOut {
  id: string;
  name: string;
  job_role: string;
}

/** Backend `QuestionOut` */
export interface QuestionOut {
  id: string;
  expert_id: string;
  job_role: string;
  question_text: string;
  question_relevance: number;
  session: string;
  created_at: string;
}

/** Backend `QuestionSubmit` */
export interface QuestionSubmit {
  question_text: string;
  expert_id: string;
  session_id: string;
}

/** Backend `AnswerSubmit` */
export interface AnswerSubmit {
  candidate_id: string;
  question_id: string;
  answer_text: string;
  answer_relevance?: number | null;
}

/** Backend `AnswerOut` */
export interface AnswerOut {
  id: string;
  candidate_id: string;
  question_id: string;
  answer_text: string;
  answer_relevance: number | null;
  created_at: string;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isBackendUserId(id: string): boolean {
  return UUID_RE.test(id);
}

export async function fetchCandidateInterviews(
  candidateId: string
): Promise<InterviewOut[]> {
  return apiGet<InterviewOut[]>(`/interview/candidate/${candidateId}`);
}

export async function fetchExpertAssignments(
  expertId: string
): Promise<AssignmentOut[]> {
  return apiGet<AssignmentOut[]>(`/assignments/expert/${expertId}`);
}

export async function fetchInterviewById(
  interviewId: string
): Promise<InterviewOut | null> {
  return apiGetOptional<InterviewOut>(`/interview/${interviewId}`);
}

export async function fetchExpertProfile(
  expertId: string
): Promise<ExpertOut | null> {
  return apiGetOptional<ExpertOut>(`/experts/${expertId}`);
}

/** Create interview session; backend assigns top experts. */
export async function createInterview(
  body: InterviewCreate
): Promise<InterviewOut> {
  return apiPost<InterviewOut>(`/interview/`, body);
}

/** Assignments for an interview session, ordered by priority. */
export async function fetchInterviewAssignments(
  interviewId: string
): Promise<AssignmentOut[]> {
  return apiGet<AssignmentOut[]>(
    `/interview/assignments/${interviewId}`
  );
}

export async function fetchQuestionsBySession(
  sessionId: string
): Promise<QuestionOut[]> {
  return apiGet<QuestionOut[]>(`/questions/session/${sessionId}`);
}

export async function submitQuestion(
  body: QuestionSubmit
): Promise<QuestionOut> {
  return apiPost<QuestionOut>(`/questions/submit`, body);
}

export async function submitAnswer(body: AnswerSubmit): Promise<AnswerOut> {
  return apiPost<AnswerOut>(`/answers/submit`, body);
}

export async function submitInterviewForScoring(
  interviewId: string
): Promise<InterviewOut> {
  return apiPost<InterviewOut>(`/interview/submit/${interviewId}`, {});
}

/** Cancel/delete an interview session (hard delete on backend). */
export async function deleteInterview(interviewId: string): Promise<void> {
  await apiDelete(`/interview/${interviewId}`);
}

export async function fetchCandidateAnswers(
  candidateId: string
): Promise<AnswerOut[]> {
  return apiGet<AnswerOut[]>(`/answers/candidate/${candidateId}`);
}

export interface ExpertDashboardStats {
  assignedInterviews: number;
  completedReviews: number;
}

/**
 * Assigned = distinct interview sessions linked to the expert.
 * Completed = those sessions whose interview record has a non-null score.
 */
export async function fetchExpertDashboardStats(
  expertId: string
): Promise<ExpertDashboardStats> {
  const assignments = await fetchExpertAssignments(expertId);
  const sessionIds = [
    ...new Set(
      assignments.map((a) => a.session).filter((s): s is string => Boolean(s))
    ),
  ];
  if (sessionIds.length === 0) {
    return { assignedInterviews: 0, completedReviews: 0 };
  }
  const interviews = await Promise.all(
    sessionIds.map((id) => fetchInterviewById(id))
  );
  const completedReviews = interviews.filter(
    (row) => row != null && row.score != null
  ).length;
  return {
    assignedInterviews: sessionIds.length,
    completedReviews,
  };
}
