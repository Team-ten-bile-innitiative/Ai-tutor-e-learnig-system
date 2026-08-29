import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bot, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { ErrorState, ProgressBar, Skeleton } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MarkdownBody } from "@/components/MarkdownBody";
import { idOf } from "@/lib/utils";
import type { Lesson } from "@/types";
import { AIChatPanel } from "@/pages/student/AITutor";

export function StudentLessonPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [openAi, setOpenAi] = useState(false);
  const { data, error, refetch } = useQuery({
    queryKey: ["lesson", id],
    queryFn: async () => (await api.get(`/lessons/${id}`)).data.data as { lesson: Lesson; navigation: Lesson[] },
  });
  const complete = useMutation({
    mutationFn: () => api.post(`/learning/lessons/${id}/complete`, { timeSpent: 600 }),
    onSuccess: () => {
      toast.success("Lesson marked complete");
      qc.invalidateQueries({ queryKey: ["student-dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;
  if (!data) return <Skeleton className="h-96" />;

  const lesson = data.lesson;
  const nav = data.navigation;
  const idx = nav.findIndex((l) => idOf(l) === id);
  const prev = idx > 0 ? nav[idx - 1] : null;
  const next = idx >= 0 && idx < nav.length - 1 ? nav[idx + 1] : null;
  const courseId = typeof lesson.course === "object" ? lesson.course._id : String(lesson.course);
  const courseTitle = typeof lesson.course === "object" ? lesson.course.title : "Course";
  const progress = nav.length ? Math.round(((idx + 1) / nav.length) * 100) : 0;

  return (
    <div className="lg:flex lg:gap-6">
      <aside className="mb-4 hidden w-56 shrink-0 lg:block">
        <p className="mb-2 text-xs font-semibold uppercase text-muted">Course navigation</p>
        <div className="space-y-1">
          {nav.map((l, i) => (
            <Link
              key={idOf(l)}
              to={`/student/lessons/${idOf(l)}`}
              className={`block rounded-xl px-3 py-2 text-sm ${idOf(l) === id ? "bg-primary-soft font-semibold text-primary" : "hover:bg-white"}`}
            >
              {i + 1}. {l.title}
            </Link>
          ))}
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted">
          {courseTitle} / {lesson.title}
        </p>
        <div className="mt-2 flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold">{lesson.title}</h1>
          <Button variant="ai" onClick={() => setOpenAi(true)}>
            <Bot className="h-4 w-4" /> Ask AI Tutor
          </Button>
        </div>
        <div className="mt-3">
          <ProgressBar value={progress} />
          <p className="mt-1 text-xs text-muted">{progress}% through this course</p>
        </div>
        <Card className="mt-6 p-6">
          <p className="text-sm font-semibold text-primary">Learning objectives</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-muted">
            {(lesson.learningObjectives || []).map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
          <div className="mt-6">
            <MarkdownBody>{lesson.content || lesson.description}</MarkdownBody>
          </div>
          {lesson.videoUrl ? (
            <video className="mt-6 w-full rounded-xl" controls src={lesson.videoUrl} />
          ) : null}
        </Card>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="secondary" disabled={!prev} onClick={() => prev && navigate(`/student/lessons/${idOf(prev)}`)}>
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <Button onClick={() => complete.mutate()}>Mark as Complete</Button>
          <Button variant="secondary" disabled={!next} onClick={() => next && navigate(`/student/lessons/${idOf(next)}`)}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {openAi ? (
        <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md border-l border-line bg-white shadow-2xl lg:static lg:z-0 lg:max-w-sm lg:rounded-2xl lg:border lg:shadow-none">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="font-semibold">AI Tutor</p>
            <button onClick={() => setOpenAi(false)}>Close</button>
          </div>
          <AIChatPanel courseId={courseId} lessonId={id} />
        </div>
      ) : null}
    </div>
  );
}

export function StudentQuizPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [seconds, setSeconds] = useState(0);
  const quizQ = useQuery({
    queryKey: ["quiz", id],
    queryFn: async () => (await api.get(`/quizzes/${id}`)).data.data,
  });

  useEffect(() => {
    if (!id) return;
    api.post(`/learning/quizzes/${id}/start`).then((res) => setAttemptId(res.data.data._id || res.data.data.id));
  }, [id]);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, []);

  const questions = quizQ.data?.questions || [];
  const q = questions[index];
  const remaining = quizQ.data?.timeLimit ? quizQ.data.timeLimit * 60 - seconds : null;

  const save = async () => {
    if (!attemptId) return;
    await api.patch(`/learning/attempts/${attemptId}/save`, {
      timeSpent: seconds,
      answers: Object.entries(answers).map(([question, answer]) => ({ question, answer })),
    });
  };

  const submit = async () => {
    if (!attemptId) return;
    if (questions.some((item: { id?: string; _id?: string }) => !answers[item.id || item._id || ""])) {
      toast.error("Please answer every question before submitting.");
      return;
    }
    const { data } = await api.post(`/learning/attempts/${attemptId}/submit`, {
      timeSpent: seconds,
      answers: Object.entries(answers).map(([question, answer]) => ({ question, answer })),
    });
    toast.success("Quiz submitted");
    navigate(`/student/results/${data.data.attempt._id || data.data.attempt.id}`);
  };

  if (quizQ.error) return <ErrorState message={quizQ.error.message} onRetry={() => quizQ.refetch()} />;
  if (!q) return <Skeleton className="h-96" />;
  const qid = q.id || q._id;
  const mm = remaining !== null ? Math.max(0, Math.floor(remaining / 60)) : Math.floor(seconds / 60);
  const ss = remaining !== null ? Math.max(0, remaining % 60) : seconds % 60;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{quizQ.data.title}</h1>
          <p className="text-sm text-muted">
            Question {index + 1} of {questions.length}
          </p>
        </div>
        <div className="rounded-xl bg-white px-3 py-2 text-sm font-semibold">
          {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
        </div>
      </div>
      <ProgressBar value={((index + 1) / questions.length) * 100} />
      <Card className="mt-6 p-6">
        <p className="text-lg font-semibold">{q.questionText}</p>
        <div className="mt-4 space-y-2">
          {q.questionType === "short_answer" ? (
            <input
              className="h-11 w-full rounded-[5px] border border-line px-3 font-bold outline-none hover:border-[#7C3AED] focus:border-[#7C3AED]"
              value={answers[qid] || ""}
              onChange={(e) => setAnswers((a) => ({ ...a, [qid]: e.target.value }))}
            />
          ) : (
            (q.options || []).map((opt: { text: string }) => (
              <label key={opt.text} className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3 has-[:checked]:border-primary">
                <input
                  type="radio"
                  name={qid}
                  checked={answers[qid] === opt.text}
                  onChange={() => setAnswers((a) => ({ ...a, [qid]: opt.text }))}
                />
                {opt.text}
              </label>
            ))
          )}
        </div>
      </Card>
      <div className="mt-6 flex justify-between">
        <Button variant="secondary" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
          Previous
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => save().then(() => toast.success("Saved"))}>
            Save
          </Button>
          {index < questions.length - 1 ? (
            <Button onClick={() => setIndex((i) => i + 1)}>Next</Button>
          ) : (
            <Button onClick={() => void submit()}>Submit Quiz</Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function StudentResultPage() {
  const { id } = useParams();
  const { data, error, refetch } = useQuery({
    queryKey: ["result", id],
    queryFn: async () => (await api.get(`/learning/attempts/${id}`)).data.data,
  });
  const [review, setReview] = useState(false);
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;
  if (!data) return <Skeleton className="h-80" />;
  const a = data.attempt;
  const correct = a.answers.filter((x: { isCorrect: boolean }) => x.isCorrect).length;
  const incorrect = a.answers.length - correct;
  return (
    <div className="mx-auto max-w-3xl">
      <Card className="p-8 text-center">
        <h1 className="text-3xl font-bold">{a.passed ? "Great job!" : "Let's understand this"}</h1>
        <p className="mt-2 text-muted">{a.passed ? "You passed this quiz." : "Review the misses and try again when you are ready."}</p>
        <div className="mx-auto mt-6 h-32 w-32">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" stroke="#e2e8f0" strokeWidth="10" fill="none" />
            <circle
              cx="50"
              cy="50"
              r="42"
              stroke="#4f46e5"
              strokeWidth="10"
              fill="none"
              strokeDasharray={264}
              strokeDashoffset={264 - (a.percentage / 100) * 264}
              transform="rotate(-90 50 50)"
            />
            <text x="50" y="55" textAnchor="middle" fontSize="18" fontWeight="700">
              {a.percentage}%
            </text>
          </svg>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-muted">Correct</p>
            <p className="text-xl font-bold text-success">{correct}</p>
          </div>
          <div>
            <p className="text-muted">Incorrect</p>
            <p className="text-xl font-bold text-danger">{incorrect}</p>
          </div>
          <div>
            <p className="text-muted">Time</p>
            <p className="text-xl font-bold">{Math.round(a.timeSpent / 60)}m</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button onClick={() => setReview(true)}>Review Answers</Button>
          <Link to="/student/ai-tutor">
            <Button variant="ai">Ask AI Tutor</Button>
          </Link>
          <Link to={`/student/quizzes/${a.quiz?._id || a.quiz}`}>
            <Button variant="secondary">Try Again</Button>
          </Link>
          <Link to="/student/courses">
            <Button variant="secondary">Continue Learning</Button>
          </Link>
        </div>
      </Card>
      {data.feedback ? (
        <Card className="mt-6 p-6 text-left">
          <h3 className="font-semibold">AI feedback</h3>
          <div className="mt-3">
            <MarkdownBody>{data.feedback.summary || ""}</MarkdownBody>
          </div>
        </Card>
      ) : null}
      {review ? (
        <div className="mt-6 space-y-4">
          {data.review.map((r: { id: string; questionText: string; yourAnswer: string; correctAnswer: string; isCorrect: boolean; explanation: string }) => (
            <Card key={r.id} className="p-5">
              <p className="font-medium">{r.questionText}</p>
              {r.isCorrect ? (
                <p className="mt-2 text-sm text-success">You got this one. Nice reasoning.</p>
              ) : (
                <div className="mt-3 space-y-1 text-sm">
                  <p>Let's understand this.</p>
                  <p>
                    <span className="text-muted">Your answer:</span> {r.yourAnswer || "—"}
                  </p>
                  <p>
                    <span className="text-muted">Correct answer:</span> {r.correctAnswer}
                  </p>
                  <p className="text-muted">{r.explanation || "Review the related lesson and try a similar example."}</p>
                  <p className="text-xs text-slate-500">Learning tip: rewrite the rule in your own words, then retry a practice item.</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
