import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  PlayCircle, 
  Clock, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Award,
  Lightbulb,
  Send,
  Timer
} from 'lucide-react';

interface Question {
  id: string;
  text: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

interface Answer {
  questionId: string;
  answer: string;
  score?: number;
  feedback?: string;
}

interface InterviewSession {
  id: string;
  jobRole: string;
  questions: Question[];
  answers: Answer[];
  currentQuestionIndex: number;
  status: 'not_started' | 'in_progress' | 'completed';
  startTime?: Date;
  endTime?: Date;
  finalScore?: number;
}

const mockQuestions: Question[] = [
  {
    id: '1',
    text: 'Explain the principles of digital signal processing and its applications in defense systems.',
    category: 'Technical',
    difficulty: 'Medium'
  },
  {
    id: '2', 
    text: 'How would you approach designing a secure communication protocol for military networks?',
    category: 'Security',
    difficulty: 'Hard'
  },
  {
    id: '3',
    text: 'Describe your experience with embedded systems and real-time operating systems.',
    category: 'Experience',
    difficulty: 'Medium'
  },
  {
    id: '4',
    text: 'What are the key considerations when developing software for mission-critical applications?',
    category: 'Problem Solving',
    difficulty: 'Hard'
  },
  {
    id: '5',
    text: 'Explain how you would ensure code quality and reliability in a defense software project.',
    category: 'Quality Assurance',
    difficulty: 'Medium'
  }
];

export const InterviewFlow: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [session, setSession] = useState<InterviewSession>({
    id: Math.random().toString(36).substr(2, 9),
    jobRole: 'Software Engineer',
    questions: mockQuestions,
    answers: [],
    currentQuestionIndex: 0,
    status: 'not_started'
  });

  const [currentAnswer, setCurrentAnswer] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(1800); // 30 minutes
  const { toast } = useToast();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (session.status === 'in_progress' && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmitInterview();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [session.status, timeRemaining]);

  const startInterview = () => {
    setSession(prev => ({
      ...prev,
      status: 'in_progress',
      startTime: new Date()
    }));
    toast({
      title: "Interview Started!",
      description: "Good luck! Take your time to provide detailed answers.",
    });
  };

  const submitAnswer = () => {
    if (!currentAnswer.trim()) {
      toast({
        title: "Answer Required",
        description: "Please provide an answer before proceeding.",
        variant: "destructive",
      });
      return;
    }

    // Simulate AI scoring
    const score = Math.floor(Math.random() * 40) + 60; // Random score between 60-100
    const feedback = generateFeedback(score);

    const newAnswer: Answer = {
      questionId: session.questions[session.currentQuestionIndex].id,
      answer: currentAnswer,
      score,
      feedback
    };

    setSession(prev => ({
      ...prev,
      answers: [...prev.answers, newAnswer]
    }));

    setCurrentAnswer('');
    
    toast({
      title: "Answer Submitted!",
      description: `Score: ${score}/100 - ${feedback}`,
    });

    // Move to next question or finish
    if (session.currentQuestionIndex < session.questions.length - 1) {
      setTimeout(() => {
        setSession(prev => ({
          ...prev,
          currentQuestionIndex: prev.currentQuestionIndex + 1
        }));
      }, 1500);
    } else {
      setTimeout(() => {
        handleSubmitInterview();
      }, 1500);
    }
  };

  const generateFeedback = (score: number): string => {
    if (score >= 90) return "Excellent! Comprehensive and technically sound answer.";
    if (score >= 80) return "Good answer with strong technical understanding.";
    if (score >= 70) return "Satisfactory response, could benefit from more detail.";
    if (score >= 60) return "Basic understanding shown, needs improvement.";
    return "Insufficient answer, requires significant improvement.";
  };

  const handleSubmitInterview = () => {
    const totalScore = session.answers.reduce((sum, answer) => sum + (answer.score || 0), 0);
    const finalScore = Math.round(totalScore / session.answers.length);

    setSession(prev => ({
      ...prev,
      status: 'completed',
      endTime: new Date(),
      finalScore
    }));

    toast({
      title: "Interview Completed!",
      description: `Your final score: ${finalScore}/100`,
    });
  };

  const goToPreviousQuestion = () => {
    if (session.currentQuestionIndex > 0) {
      setSession(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1
      }));
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const currentQuestion = session.questions[session.currentQuestionIndex];
  const progress = ((session.currentQuestionIndex + 1) / session.questions.length) * 100;

  if (session.status === 'not_started') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5 p-4">
        <div className="container mx-auto max-w-4xl pt-8">
          <Button variant="ghost" onClick={onBack} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          <Card className="bg-gradient-card shadow-xl animate-slide-up">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3">
                <PlayCircle className="h-8 w-8 text-primary" />
                Interview Assessment
              </CardTitle>
              <CardDescription className="text-lg">
                Technical Interview for {session.jobRole}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="font-semibold">Duration</p>
                    <p className="text-muted-foreground">30 Minutes</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6 text-center">
                    <Lightbulb className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="font-semibold">Questions</p>
                    <p className="text-muted-foreground">{session.questions.length} Technical</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6 text-center">
                    <Award className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="font-semibold">Scoring</p>
                    <p className="text-muted-foreground">AI-Evaluated</p>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-muted/50 p-6 rounded-lg">
                <h3 className="font-semibold mb-4">Instructions:</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Answer all questions to the best of your ability</li>
                  <li>• Provide detailed, technical explanations where appropriate</li>
                  <li>• You can navigate between questions using the navigation buttons</li>
                  <li>• Your answers are auto-saved as you progress</li>
                  <li>• AI will provide instant feedback and scoring</li>
                </ul>
              </div>

              <div className="text-center">
                <Button variant="hero" size="xl" onClick={startInterview}>
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Start Interview
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (session.status === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5 p-4">
        <div className="container mx-auto max-w-4xl pt-8">
          <Card className="bg-gradient-card shadow-xl animate-slide-up">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3">
                <CheckCircle className="h-8 w-8 text-success" />
                Interview Completed!
              </CardTitle>
              <CardDescription className="text-lg">
                Your assessment results for {session.jobRole}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-primary text-white mb-4">
                  <span className="text-4xl font-bold">{session.finalScore}</span>
                </div>
                <p className="text-2xl font-semibold">Final Score: {session.finalScore}/100</p>
                {session.finalScore! >= 80 && (
                  <Badge variant="default" className="mt-2">Excellent Performance</Badge>
                )}
                {session.finalScore! >= 60 && session.finalScore! < 80 && (
                  <Badge variant="secondary" className="mt-2">Good Performance</Badge>
                )}
                {session.finalScore! < 60 && (
                  <Badge variant="outline" className="mt-2">Needs Improvement</Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-4">Performance Breakdown</h3>
                    <div className="space-y-3">
                      {session.answers.map((answer, index) => (
                        <div key={answer.questionId} className="flex items-center justify-between">
                          <span>Question {index + 1}</span>
                          <Badge variant={answer.score! >= 80 ? 'default' : answer.score! >= 60 ? 'secondary' : 'outline'}>
                            {answer.score}/100
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-4">Assessment Summary</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Duration:</strong> {Math.round((1800 - timeRemaining) / 60)} minutes</p>
                      <p><strong>Questions Answered:</strong> {session.answers.length}/{session.questions.length}</p>
                      <p><strong>Average Score:</strong> {session.finalScore}/100</p>
                      <p><strong>Interview Date:</strong> {new Date().toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center space-y-4">
                <Button variant="hero" size="lg" onClick={onBack}>
                  Return to Dashboard
                </Button>
                <p className="text-muted-foreground">
                  Your results have been saved and will be reviewed by our expert panel.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5 p-4">
      <div className="container mx-auto max-w-4xl pt-8">
        {/* Header with progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline">Question {session.currentQuestionIndex + 1} of {session.questions.length}</Badge>
              <Badge variant={currentQuestion.difficulty === 'Hard' ? 'destructive' : currentQuestion.difficulty === 'Medium' ? 'secondary' : 'default'}>
                {currentQuestion.difficulty}
              </Badge>
              <Badge variant="secondary">{currentQuestion.category}</Badge>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Timer className="h-4 w-4" />
              <span className="font-mono">{formatTime(timeRemaining)}</span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="bg-gradient-card shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">
              {currentQuestion.text}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="answer">Your Answer</Label>
              <Textarea
                id="answer"
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Provide a detailed technical answer..."
                className="min-h-32 mt-2"
              />
            </div>

            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                onClick={goToPreviousQuestion}
                disabled={session.currentQuestionIndex === 0}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              <Button 
                variant="hero" 
                onClick={submitAnswer}
                disabled={!currentAnswer.trim()}
              >
                {session.currentQuestionIndex === session.questions.length - 1 ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Submit Interview
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Answer
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Progress Summary */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">Progress Summary</h3>
            <div className="grid grid-cols-5 gap-2">
              {session.questions.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full ${
                    index < session.answers.length
                      ? 'bg-success'
                      : index === session.currentQuestionIndex
                      ? 'bg-primary'
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {session.answers.length} of {session.questions.length} questions completed
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};