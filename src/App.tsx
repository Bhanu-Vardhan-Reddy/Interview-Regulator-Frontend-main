import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getSession } from "@/lib/authStorage";
import AppLayout from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import InterviewSessionPage from "./pages/InterviewSessionPage";
import ExpertAssignments from "./pages/ExpertAssignments";
import ExpertSessionQuestions from "./pages/ExpertSessionQuestions";
import CandidateAnalytics from "./pages/candidate/CandidateAnalytics";
import CandidateInterviews from "./pages/candidate/CandidateInterviews";
import ExpertOverview from "./pages/expert/ExpertOverview";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: ReactNode }) {
  if (!getSession()?.profile) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function GuestOnly({ children }: { children: ReactNode }) {
  if (getSession()?.profile) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/candidate/analytics" element={<CandidateAnalytics />} />
            <Route path="/candidate/interviews" element={<CandidateInterviews />} />
            <Route path="/expert/overview" element={<ExpertOverview />} />
            <Route path="/expert/assignments" element={<ExpertAssignments />} />
            <Route
              path="/expert/sessions/:sessionId/questions"
              element={<ExpertSessionQuestions />}
            />
          </Route>
          <Route
            path="/login"
            element={
              <GuestOnly>
                <Login />
              </GuestOnly>
            }
          />
          <Route
            path="/register"
            element={
              <GuestOnly>
                <Register />
              </GuestOnly>
            }
          />
          <Route
            path="/interview/:sessionId"
            element={
              <ProtectedRoute>
                <InterviewSessionPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
