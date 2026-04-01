import { Link, Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/authStorage";
import { BarChart3, ClipboardList, Users } from "lucide-react";

export default function Dashboard() {
  const user = getSession()?.profile ?? null;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Welcome back, {user.name}</h1>
        <p className="text-muted-foreground">
          Pick a service from the left to get started.
        </p>
      </div>

      {user.type === "candidate" ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Analytics
              </CardTitle>
              <CardDescription>Your interview stats at a glance</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="hero" asChild>
                <Link to="/candidate/analytics">Open analytics</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                Interviews
              </CardTitle>
              <CardDescription>Request, start, and review sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="hero" asChild>
                <Link to="/candidate/interviews">Open interviews</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Overview
              </CardTitle>
              <CardDescription>Your expert stats and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="hero" asChild>
                <Link to="/expert/overview">Open overview</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Assignments
              </CardTitle>
              <CardDescription>See sessions assigned to you</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="hero" asChild>
                <Link to="/expert/assignments">Open assignments</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

