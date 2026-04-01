const PREFIX = "interview_regulator_submitted_interview:";

export function markInterviewSubmitted(interviewId: string): void {
  try {
    localStorage.setItem(`${PREFIX}${interviewId}`, new Date().toISOString());
  } catch {
    // ignore storage errors
  }
}

export function isInterviewSubmitted(interviewId: string): boolean {
  try {
    return Boolean(localStorage.getItem(`${PREFIX}${interviewId}`));
  } catch {
    return false;
  }
}

export function clearInterviewSubmitted(interviewId: string): void {
  try {
    localStorage.removeItem(`${PREFIX}${interviewId}`);
  } catch {
    // ignore storage errors
  }
}

