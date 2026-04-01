import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSession, type ExpertProfile } from "@/lib/authStorage";
import { fetchExpertDashboardStats, fetchExpertProfile, isBackendUserId } from "@/lib/dashboardApi";
import { Award, BookOpen, Clock, Star, Users } from "lucide-react";

export default function ExpertOverview() {
  const user = getSession()?.profile ?? null;
  const expert = user?.type === "expert" ? (user as ExpertProfile) : null;
  const expertId = expert?.id ?? "";
  const backendLinked = Boolean(expert && isBackendUserId(expertId));

  const statsQuery = useQuery({
    queryKey: ["expert-dashboard-stats", expertId],
    queryFn: () => fetchExpertDashboardStats(expertId),
    enabled: Boolean(expert && backendLinked && expertId),
  });

  const remoteProfileQuery = useQuery({
    queryKey: ["expert-profile-remote", expertId],
    queryFn: () => fetchExpertProfile(expertId),
    enabled: Boolean(expert && backendLinked && expertId),
  });

  if (!expert) {
    return (
      <div className="text-sm text-muted-foreground">
        This page is available for expert accounts.
      </div>
    );
  }

  if (!backendLinked) {
    return (
      <p className="text-sm text-muted-foreground rounded-lg border border-dashed bg-muted/30 px-4 py-3">
        This account is not linked to the live API (missing server profile ID). Register a new
        account to see real assignments and stats.
      </p>
    );
  }

  const assignedInterviews = statsQuery.data?.assignedInterviews ?? 0;
  const completedReviews = statsQuery.data?.completedReviews ?? 0;
  const profile = remoteProfileQuery.data;
  const expertise = profile?.expertise ?? expert.expertise;
  const seniority = profile?.seniority ?? expert.seniority;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-muted-foreground">Your expert stats and shortcuts.</p>
      </div>

      {(statsQuery.isError || remoteProfileQuery.isError) && (
        <p className="text-sm text-destructive">
          {(statsQuery.error instanceof Error && statsQuery.error.message) ||
            (remoteProfileQuery.error instanceof Error && remoteProfileQuery.error.message) ||
            "Could not load expert data from the server."}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Assigned Interviews</p>
                <p className="text-3xl font-bold tabular-nums">
                  {statsQuery.isPending ? "…" : assignedInterviews}
                </p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed Reviews</p>
                <p className="text-3xl font-bold text-success tabular-nums">
                  {statsQuery.isPending ? "…" : completedReviews}
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
                <p className="text-sm font-medium text-muted-foreground">Expertise Level</p>
                <p className="text-3xl font-bold text-primary tabular-nums">{seniority}/5</p>
              </div>
              <Star className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expert tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button variant="hero" size="lg" asChild>
              <Link to="/expert/assignments">
                <Users className="mr-2 h-4 w-4" />
                My assignments
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/expert/assignments">
                <BookOpen className="mr-2 h-4 w-4" />
                Add questions (pick session)
              </Link>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <Link to="/expert/assignments">
                <Clock className="mr-2 h-4 w-4" />
                Active sessions
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/expert/assignments">
                <Award className="mr-2 h-4 w-4" />
                Assessment history
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your expertise</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <span className="font-medium">Domain:</span> {expertise}
          </p>
          <p>
            <span className="font-medium">Seniority:</span> {seniority}/5
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

