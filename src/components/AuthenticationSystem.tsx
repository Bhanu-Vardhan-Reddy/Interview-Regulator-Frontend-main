import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { InterviewFlow } from '@/components/InterviewFlow';
import { 
  UserCheck, 
  Shield, 
  Briefcase, 
  GraduationCap, 
  Clock, 
  Star,
  LogOut,
  Plus,
  Calendar,
  Award,
  Users,
  BookOpen
} from 'lucide-react';

interface Education {
  degree: string;
  field: string;
  institution: string;
  year: number;
  grade: string;
}

interface Experience {
  company: string;
  role: string;
  duration_months: number;
  projects: string[];
  skills: string[];
}

interface Candidate {
  id: string;
  name: string;
  job_role: string;
  education: Education[];
  experience: Experience[];
  type: 'candidate';
}

interface Expert {
  id: string;
  name: string;
  expertise: string;
  seniority: number;
  type: 'expert';
}

interface Interview {
  id: string;
  job_role: string;
  status: 'pending' | 'completed';
  date: string;
  score?: number;
}

type User = Candidate | Expert;

export const AuthenticationSystem: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<'candidate' | 'expert'>('candidate');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInterview, setShowInterview] = useState(false);
  const { toast } = useToast();

  // Candidate form state
  const [candidateForm, setCandidateForm] = useState({
    name: '',
    job_role: '',
    education: [{
      degree: '',
      field: '',
      institution: '',
      year: new Date().getFullYear(),
      grade: ''
    }],
    experience: [{
      company: '',
      role: '',
      duration_months: 0,
      projects: [''],
      skills: ['']
    }]
  });

  // Expert form state
  const [expertForm, setExpertForm] = useState({
    name: '',
    expertise: '',
    seniority: 1
  });

  // Mock interviews data
  const [interviews] = useState<Interview[]>([
    { id: '1', job_role: 'Software Engineer', status: 'completed', date: '2024-01-15', score: 85 },
    { id: '2', job_role: 'Data Scientist', status: 'pending', date: '2024-01-20' },
  ]);

  useEffect(() => {
    const savedUser = localStorage.getItem('drdo_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('drdo_user');
      }
    }
  }, []);

  const handleCandidateRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newCandidate: Candidate = {
        id: Math.random().toString(36).substr(2, 9),
        ...candidateForm,
        type: 'candidate'
      };

      localStorage.setItem('drdo_user', JSON.stringify(newCandidate));
      setUser(newCandidate);
      setIsLoggedIn(true);

      toast({
        title: "Registration Successful!",
        description: "Welcome to DRDO RAC Interview System",
      });
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExpertRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newExpert: Expert = {
        id: Math.random().toString(36).substr(2, 9),
        ...expertForm,
        type: 'expert'
      };

      localStorage.setItem('drdo_user', JSON.stringify(newExpert));
      setUser(newExpert);
      setIsLoggedIn(true);

      toast({
        title: "Registration Successful!",
        description: "Welcome to DRDO RAC Interview System",
      });
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('drdo_user');
    setUser(null);
    setIsLoggedIn(false);
    setUserType('candidate');
    setShowInterview(false);
    toast({
      title: "Logged out successfully",
      description: "Thank you for using DRDO RAC Interview System",
    });
  };

  const addEducation = () => {
    setCandidateForm({
      ...candidateForm,
      education: [...candidateForm.education, {
        degree: '',
        field: '',
        institution: '',
        year: new Date().getFullYear(),
        grade: ''
      }]
    });
  };

  const addExperience = () => {
    setCandidateForm({
      ...candidateForm,
      experience: [...candidateForm.experience, {
        company: '',
        role: '',
        duration_months: 0,
        projects: [''],
        skills: ['']
      }]
    });
  };

  if (isLoggedIn && user) {
    if (showInterview && user.type === 'candidate') {
      return <InterviewFlow onBack={() => setShowInterview(false)} />;
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold">DRDO RAC</h1>
                <p className="text-sm text-muted-foreground">Interview System</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="capitalize">
                {user.type}
              </Badge>
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard */}
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8 animate-fade-in">
            <h2 className="text-3xl font-bold mb-2">
              Welcome back, {user.name}
            </h2>
            <p className="text-muted-foreground">
              {user.type === 'candidate' 
                ? 'Continue your interview journey' 
                : 'Manage interviews and evaluate candidates'
              }
            </p>
          </div>

          {user.type === 'candidate' ? (
            <CandidateDashboard 
              candidate={user as Candidate} 
              interviews={interviews} 
              onStartInterview={() => setShowInterview(true)}
            />
          ) : (
            <ExpertDashboard expert={user as Expert} />
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl bg-gradient-card border-0 animate-slide-up">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-4">
            <Shield className="h-16 w-16 text-primary animate-glow" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            DRDO RAC Interview System
          </CardTitle>
          <CardDescription className="text-lg">
            Advanced AI-Driven Assessment Platform
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={userType} onValueChange={(value) => setUserType(value as 'candidate' | 'expert')}>
            <TabsList className="grid w-full grid-cols-2 mb-8">
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
                        onChange={(e) => setCandidateForm({...candidateForm, name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="job_role">Target Job Role</Label>
                      <Input
                        id="job_role"
                        value={candidateForm.job_role}
                        onChange={(e) => setCandidateForm({...candidateForm, job_role: e.target.value})}
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
                                setCandidateForm({...candidateForm, education: updated});
                              }}
                            />
                            <Input
                              placeholder="Field of Study"
                              value={edu.field}
                              onChange={(e) => {
                                const updated = [...candidateForm.education];
                                updated[index].field = e.target.value;
                                setCandidateForm({...candidateForm, education: updated});
                              }}
                            />
                            <Input
                              placeholder="Institution"
                              value={edu.institution}
                              onChange={(e) => {
                                const updated = [...candidateForm.education];
                                updated[index].institution = e.target.value;
                                setCandidateForm({...candidateForm, education: updated});
                              }}
                            />
                            <Input
                              placeholder="Grade/CGPA"
                              value={edu.grade}
                              onChange={(e) => {
                                const updated = [...candidateForm.education];
                                updated[index].grade = e.target.value;
                                setCandidateForm({...candidateForm, education: updated});
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
                  {isSubmitting ? "Registering..." : "Register as Candidate"}
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
                      onChange={(e) => setExpertForm({...expertForm, name: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="expertise">Area of Expertise</Label>
                    <Input
                      id="expertise"
                      value={expertForm.expertise}
                      onChange={(e) => setExpertForm({...expertForm, expertise: e.target.value})}
                      placeholder="e.g., Signal Processing, Cybersecurity"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="seniority">Seniority Level (1-5)</Label>
                    <Input
                      id="seniority"
                      type="number"
                      min="1"
                      max="5"
                      value={expertForm.seniority}
                      onChange={(e) => setExpertForm({...expertForm, seniority: parseInt(e.target.value)})}
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
                  {isSubmitting ? "Registering..." : "Register as Expert"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

const CandidateDashboard: React.FC<{ 
  candidate: Candidate; 
  interviews: Interview[];
  onStartInterview: () => void;
}> = ({ candidate, interviews, onStartInterview }) => {
  return (
    <div className="grid gap-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Interviews</p>
                <p className="text-3xl font-bold">{interviews.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold text-success">
                  {interviews.filter(i => i.status === 'completed').length}
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
                <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                <p className="text-3xl font-bold text-primary">
                  {Math.round(interviews.filter(i => i.score).reduce((acc, i) => acc + (i.score || 0), 0) / interviews.filter(i => i.score).length) || 0}
                </p>
              </div>
              <Star className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button variant="hero" size="lg" onClick={onStartInterview}>
              <Plus className="mr-2 h-4 w-4" />
              Start New Interview
            </Button>
            <Button variant="outline" size="lg">
              <BookOpen className="mr-2 h-4 w-4" />
              View Results
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Interview History */}
      <Card>
        <CardHeader>
          <CardTitle>Interview History</CardTitle>
          <CardDescription>Your recent assessment sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {interviews.map((interview) => (
              <div key={interview.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Briefcase className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-semibold">{interview.job_role}</p>
                    <p className="text-sm text-muted-foreground">{interview.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={interview.status === 'completed' ? 'default' : 'secondary'}>
                    {interview.status}
                  </Badge>
                  {interview.score && (
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      {interview.score}%
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ExpertDashboard: React.FC<{ expert: Expert }> = ({ expert }) => {
  return (
    <div className="grid gap-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Assigned Interviews</p>
                <p className="text-3xl font-bold">12</p>
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
                <p className="text-3xl font-bold text-success">8</p>
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
                <p className="text-3xl font-bold text-primary">{expert.seniority}/5</p>
              </div>
              <Star className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Expert Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="hero" size="lg">
              <Users className="mr-2 h-4 w-4" />
              Review Candidates
            </Button>
            <Button variant="outline" size="lg">
              <BookOpen className="mr-2 h-4 w-4" />
              Manage Questions
            </Button>
            <Button variant="secondary" size="lg">
              <Clock className="mr-2 h-4 w-4" />
              Active Interviews
            </Button>
            <Button variant="outline" size="lg">
              <Award className="mr-2 h-4 w-4" />
              Assessment History
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Expert Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Your Expertise</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold">{expert.expertise}</span>
            </div>
            <div className="flex items-center gap-3">
              <Star className="h-5 w-5 text-primary" />
              <span>Seniority Level: {expert.seniority}/5</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};