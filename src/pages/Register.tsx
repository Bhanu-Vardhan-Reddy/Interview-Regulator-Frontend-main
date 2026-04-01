import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { registerAccount, type CandidateProfile, type ExpertProfile } from "@/lib/authStorage";
import { apiPost } from "@/lib/apiClient";
import type { CandidateOut, ExpertOut } from "@/lib/dashboardApi";
import { UserCheck, Shield, GraduationCap, Plus } from "lucide-react";

const Register = () => {
  const [userType, setUserType] = useState<"candidate" | "expert">("candidate");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [candidateForm, setCandidateForm] = useState({
    name: "",
    job_role: "",
    education: [
      {
        degree: "",
        field: "",
        institution: "",
        year: new Date().getFullYear(),
        grade: "",
      },
    ],
    experience: [
      {
        company: "",
        role: "",
        duration_months: 0,
        projects: [""] as string[],
        skills: [""] as string[],
      },
    ],
  });

  const [expertForm, setExpertForm] = useState({
    name: "",
    expertise: "",
    seniority: 1,
  });

  const addEducation = () => {
    setCandidateForm({
      ...candidateForm,
      education: [
        ...candidateForm.education,
        {
          degree: "",
          field: "",
          institution: "",
          year: new Date().getFullYear(),
          grade: "",
        },
      ],
    });
  };

  const addExperience = () => {
    setCandidateForm({
      ...candidateForm,
      experience: [
        ...candidateForm.experience,
        {
          company: "",
          role: "",
          duration_months: 0,
          projects: [""],
          skills: [""],
        },
      ],
    });
  };

  const handleCandidateRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please confirm your password.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const created = await apiPost<CandidateOut>("/candidates/", {
        name: candidateForm.name,
        job_role: candidateForm.job_role,
        education: candidateForm.education,
        experience: candidateForm.experience.map((exp) => ({
          company: exp.company,
          role: exp.role,
          duration_months: exp.duration_months,
          projects: exp.projects.filter((p) => p.trim()),
          skills: exp.skills.filter((s) => s.trim()),
        })),
      });
      const profile: CandidateProfile = {
        id: created.id,
        email: "",
        name: created.name,
        job_role: created.job_role,
        education: candidateForm.education,
        experience: candidateForm.experience,
        type: "candidate",
      };
      const result = await registerAccount(email, password, profile);
      if (result.ok) {
        toast({
          title: "Registration successful",
          description: "Welcome to DRDO RAC Interview System",
        });
        navigate("/", { replace: true });
      } else {
        toast({
          title: "Registration failed",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Registration failed",
        description: err instanceof Error ? err.message : "Could not reach the server.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExpertRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please confirm your password.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const created = await apiPost<ExpertOut>("/experts/", {
        name: expertForm.name,
        expertise: expertForm.expertise,
        seniority: expertForm.seniority,
      });
      const profile: ExpertProfile = {
        id: created.id,
        email: "",
        name: created.name,
        expertise: created.expertise,
        seniority: created.seniority,
        type: "expert",
      };
      const result = await registerAccount(email, password, profile);
      if (result.ok) {
        toast({
          title: "Registration successful",
          description: "Welcome to DRDO RAC Interview System",
        });
        navigate("/", { replace: true });
      } else {
        toast({
          title: "Registration failed",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Registration failed",
        description: err instanceof Error ? err.message : "Could not reach the server.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4 py-10">
      <Card className="w-full max-w-2xl shadow-xl bg-gradient-card border-0 animate-slide-up">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <Shield className="h-16 w-16 text-primary animate-glow" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Create an account
          </CardTitle>
          <CardDescription className="text-lg">
            Advanced AI-Driven Assessment Platform
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="reg-email">Email</Label>
              <Input
                id="reg-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password">Password</Label>
              <Input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-confirm">Confirm password</Label>
              <Input
                id="reg-confirm"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          <Tabs
            value={userType}
            onValueChange={(v) => setUserType(v as "candidate" | "expert")}
          >
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="candidate" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Candidate
              </TabsTrigger>
              <TabsTrigger value="expert" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Expert
              </TabsTrigger>
            </TabsList>

            <TabsContent value="candidate" className="space-y-6">
              <form onSubmit={handleCandidateRegister} className="space-y-6">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={candidateForm.name}
                        onChange={(e) =>
                          setCandidateForm({ ...candidateForm, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="job_role">Target Job Role</Label>
                      <Input
                        id="job_role"
                        value={candidateForm.job_role}
                        onChange={(e) =>
                          setCandidateForm({
                            ...candidateForm,
                            job_role: e.target.value,
                          })
                        }
                        placeholder="e.g., Software Engineer"
                        required
                      />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-base font-semibold flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Education
                      </Label>
                      <Button type="button" variant="outline" size="sm" onClick={addEducation}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>

                    {candidateForm.education.map((edu, index) => (
                      <Card key={index} className="mb-4">
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              placeholder="Degree"
                              value={edu.degree}
                              onChange={(e) => {
                                const updated = [...candidateForm.education];
                                updated[index].degree = e.target.value;
                                setCandidateForm({ ...candidateForm, education: updated });
                              }}
                            />
                            <Input
                              placeholder="Field of Study"
                              value={edu.field}
                              onChange={(e) => {
                                const updated = [...candidateForm.education];
                                updated[index].field = e.target.value;
                                setCandidateForm({ ...candidateForm, education: updated });
                              }}
                            />
                            <Input
                              placeholder="Institution"
                              value={edu.institution}
                              onChange={(e) => {
                                const updated = [...candidateForm.education];
                                updated[index].institution = e.target.value;
                                setCandidateForm({ ...candidateForm, education: updated });
                              }}
                            />
                            <Input
                              placeholder="Grade/CGPA"
                              value={edu.grade}
                              onChange={(e) => {
                                const updated = [...candidateForm.education];
                                updated[index].grade = e.target.value;
                                setCandidateForm({ ...candidateForm, education: updated });
                              }}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="xl"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Registering…" : "Register as Candidate"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="expert" className="space-y-6">
              <form onSubmit={handleExpertRegister} className="space-y-6">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="expert_name">Full Name</Label>
                    <Input
                      id="expert_name"
                      value={expertForm.name}
                      onChange={(e) =>
                        setExpertForm({ ...expertForm, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="expertise">Area of Expertise</Label>
                    <Input
                      id="expertise"
                      value={expertForm.expertise}
                      onChange={(e) =>
                        setExpertForm({ ...expertForm, expertise: e.target.value })
                      }
                      placeholder="e.g., Signal Processing, Cybersecurity"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="seniority">Seniority Level (1-5)</Label>
                    <Input
                      id="seniority"
                      type="number"
                      min={1}
                      max={5}
                      value={expertForm.seniority}
                      onChange={(e) =>
                        setExpertForm({
                          ...expertForm,
                          seniority: parseInt(e.target.value, 10) || 1,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="xl"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Registering…" : "Register as Expert"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary font-medium underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
