# API Docs (Frontend → Backend)

This document lists **all frontend interactions with the backend** found in this repo, along with each request’s **purpose**, **inputs**, and **expected outputs** (as used by the UI).

## Base URL

- **Base**: `BACKEND_API_BASE`
- **Default**: `https://interview-regulator-backend-140431125163.europe-west1.run.app`
- **Override**: set `VITE_BACKEND_URL` (if it includes `/docs`, the frontend strips it).

Implementation: `src/lib/backendUrl.ts`

## Transport + error shape

- **Transport**: `fetch()` JSON requests.
- **JSON responses expected** for all endpoints.
- **Errors**: for non-2xx responses, the frontend parses the backend JSON into a user-facing message.

Supported backend error shapes:

- FastAPI default / recommended:

```json
{ "detail": "string | array" }
```

If `detail` is an array, the UI expects items like `{ "msg": string }` and joins messages with `; `.

<!--
The backend in this project currently uses custom handlers (app/main.py) that return `error`/`details`.
The frontend parser supports both shapes to avoid generic errors.
-->

- Project backend handlers (current):

```json
{ "error": "string", "status_code": 400 }
```

```json
{ "error": "Validation failed", "details": [{ "msg": "string", "loc": ["..."], "type": "..." }] }
```

Additional handling:
- `apiGetOptional<T>(path)` returns **`null` on HTTP 404**, and throws on other non-2xx statuses.
- `apiPost<T>(path, body)` always sends `Content-Type: application/json`.

Implementation: `src/lib/apiClient.ts`

## Authentication / authorization

- **No Authorization headers** are attached by this frontend.
- The UI uses server-generated IDs (UUIDs) stored locally and passed as path/body fields.
- Many screens are gated behind “backend linked” checks: `isBackendUserId(id)` must be a UUID.

Implementation: `src/lib/dashboardApi.ts`

## Endpoints

### Create candidate

- **Purpose**: Create a candidate profile on the backend during registration.
- **Method + path**: `POST /candidates/`
- **Inputs**
  - **Body**

```json
{
  "name": "string",
  "job_role": "string",
  "education": [
    {
      "degree": "string",
      "field": "string",
      "institution": "string",
      "year": 2026,
      "grade": "string"
    }
  ],
  "experience": [
    {
      "company": "string",
      "role": "string",
      "duration_months": 0,
      "projects": ["string"],
      "skills": ["string"]
    }
  ]
}
```

- **Outputs**
  - **200 OK** (`CandidateOut`)

```json
{
  "id": "string",
  "name": "string",
  "job_role": "string",
  "education": [],
  "experience": [],
  "embedding": "number[] (optional)"
}
```

Notes:
- The UI only uses `id`, `name`, `job_role` currently.

- **Used by**
  - `src/pages/Register.tsx`

### Create expert

- **Purpose**: Create an expert profile on the backend during registration.
- **Method + path**: `POST /experts/`
- **Inputs**
  - **Body**

```json
{ "name": "string", "expertise": "string", "seniority": 1 }
```

- **Outputs**
  - **200 OK** (`ExpertOut`)

```json
{
  "id": "string",
  "name": "string",
  "expertise": "string",
  "seniority": 1,
  "embedding": "number[] (optional)"
}
```

Notes:
- The UI only uses `id`, `name`, `expertise`, `seniority` currently.

- **Used by**
  - `src/pages/Register.tsx`

### Create interview session

- **Purpose**: Candidate requests a new interview session; backend assigns experts.
- **Method + path**: `POST /interview/`
- **Inputs**
  - **Body** (`InterviewCreate`)

```json
{
  "candidate_id": "string",
  "job_role": "string",
  "score": "number | null (optional)",
  "time": "ISO-8601 string | null (optional)"
}
```

Notes:
- `score` and `time` are optional from the frontend.

- **Outputs**
  - **200 OK** (`InterviewOut`)

```json
{
  "id": "string",
  "candidate_id": "string",
  "job_role": "string",
  "score": "number | null",
  "time": "ISO-8601 string"
}
```

- **Used by**
  - `src/pages/candidate/CandidateInterviews.tsx`
  - `src/components/AuthenticationSystem.tsx` (candidate dashboard)

### List interviews for candidate

- **Purpose**: Show candidate interview history (and analytics).
- **Method + path**: `GET /interview/candidate/{candidateId}`
- **Inputs**
  - **Path params**
    - `candidateId`: string (UUID in real backend usage)
- **Outputs**
  - **200 OK**: `InterviewOut[]`

```json
[
  {
    "id": "string",
    "candidate_id": "string",
    "job_role": "string",
    "score": "number | null",
    "time": "ISO-8601 string"
  }
]
```

- **Used by**
  - `src/pages/candidate/CandidateInterviews.tsx`
  - `src/pages/candidate/CandidateAnalytics.tsx`
  - `src/components/AuthenticationSystem.tsx`

### Get interview by id (optional)

- **Purpose**: Load a specific interview session by session/interview id.
- **Method + path**: `GET /interview/{interviewId}`
- **Inputs**
  - **Path params**
    - `interviewId`: string
- **Outputs**
  - **200 OK**: `InterviewOut`
  - **404 Not Found**: frontend treats as `null` (instead of error)

```json
{
  "id": "string",
  "candidate_id": "string",
  "job_role": "string",
  "score": "number | null",
  "time": "ISO-8601 string"
}
```

- **Used by**
  - `src/pages/InterviewSessionPage.tsx`
  - `src/pages/ExpertAssignments.tsx`
  - `src/pages/ExpertSessionQuestions.tsx`
  - `src/lib/dashboardApi.ts` (dashboard stats)

### List assignments for expert

- **Purpose**: Show which sessions are assigned to an expert.
- **Method + path**: `GET /assignments/expert/{expertId}`
- **Inputs**
  - **Path params**
    - `expertId`: string
- **Outputs**
  - **200 OK**: `AssignmentOut[]`

```json
[
  {
    "id": "string",
    "candidate_id": "string",
    "expert_id": "string",
    "session": "string | null",
    "priority": 1
  }
]
```

- **Used by**
  - `src/pages/ExpertAssignments.tsx`
  - `src/lib/dashboardApi.ts` (expert dashboard stats)

### Get expert profile (optional)

- **Purpose**: Fetch expert profile details from backend (used to display “live” values).
- **Method + path**: `GET /experts/{expertId}`
- **Inputs**
  - **Path params**
    - `expertId`: string
- **Outputs**
  - **200 OK**: `ExpertOut`
  - **404 Not Found**: frontend treats as `null`

```json
{ "id": "string", "name": "string", "expertise": "string", "seniority": 1 }
```

- **Used by**
  - `src/pages/expert/ExpertOverview.tsx`
  - `src/components/candidate/CandidateInterviewRow.tsx` (expert names)
  - `src/components/AuthenticationSystem.tsx`

### List assignments for interview session

- **Purpose**: Show experts assigned to a particular session (and their priority).
- **Method + path**: `GET /interview/assignments/{interviewId}`
- **Inputs**
  - **Path params**
    - `interviewId`: string
- **Outputs**
  - **200 OK**: `AssignmentOut[]` (same shape as above)

- **Used by**
  - `src/components/candidate/CandidateInterviewRow.tsx`
  - `src/components/AuthenticationSystem.tsx` (`CandidateInterviewRow` section)

### List questions for session

- **Purpose**: Load questions for a session (expert view and candidate interview flow).
- **Method + path**: `GET /questions/session/{sessionId}`
- **Inputs**
  - **Path params**
    - `sessionId`: string
- **Outputs**
  - **200 OK**: `QuestionOut[]`

```json
[
  {
    "id": "string",
    "expert_id": "string",
    "job_role": "string",
    "question_text": "string",
    "question_relevance": 0,
    "session": "string",
    "created_at": "ISO-8601 string"
  }
]
```

- **Used by**
  - `src/pages/ExpertSessionQuestions.tsx`
  - `src/components/InterviewFlow.tsx`
  - `src/components/candidate/CandidateInterviewRow.tsx`
  - `src/components/AuthenticationSystem.tsx` (`CandidateInterviewRow` section)

### Submit question

- **Purpose**: Expert adds a question to a session (backend scores “relevance”).
- **Method + path**: `POST /questions/submit`
- **Inputs**
  - **Body** (`QuestionSubmit`)

```json
{ "question_text": "string", "expert_id": "string", "session_id": "string" }
```

- **Outputs**
  - **200 OK**: `QuestionOut` (same fields as in list)

- **Used by**
  - `src/pages/ExpertSessionQuestions.tsx`

### Submit answer

- **Purpose**: Candidate submits an answer for a question in a session.
- **Method + path**: `POST /answers/submit`
- **Inputs**
  - **Body** (`AnswerSubmit`)

```json
{
  "candidate_id": "string",
  "question_id": "string",
  "answer_text": "string",
  "answer_relevance": "number | null (optional)"
}
```

Notes:
- `answer_relevance` is optional from the frontend.

- **Outputs**
  - **200 OK**: `AnswerOut`

```json
{
  "id": "string",
  "candidate_id": "string",
  "question_id": "string",
  "answer_text": "string",
  "answer_relevance": "number | null",
  "created_at": "ISO-8601 string"
}
```

- **Used by**
  - `src/components/InterviewFlow.tsx`

### Submit interview for scoring

- **Purpose**: After the final answer, candidate triggers server-side scoring for the interview/session.
- **Method + path**: `POST /interview/submit/{interviewId}`
- **Inputs**
  - **Path params**
    - `interviewId`: string (the UI passes `sessionId`)
  - **Query params**
    - `max_priority`: number (optional; backend default `5`)
  - **Body**

```json
{}
```

- **Outputs**
  - **200 OK**: `InterviewOut` (UI expects `score` to be updated / non-null)

```json
{
  "id": "string",
  "candidate_id": "string",
  "job_role": "string",
  "score": "number | null",
  "time": "ISO-8601 string"
}
```

- **Used by**
  - `src/components/InterviewFlow.tsx`

### List answers for candidate

- **Purpose**: Load all answers for a candidate (currently not rendered in UI, but present in API layer).
- **Method + path**: `GET /answers/candidate/{candidateId}`
- **Inputs**
  - **Path params**
    - `candidateId`: string
- **Outputs**
  - **200 OK**: `AnswerOut[]` (same shape as in Submit answer)

- **Used by**
  - `src/lib/dashboardApi.ts`

