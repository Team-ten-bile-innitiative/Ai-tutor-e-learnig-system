export type Role = "admin" | "student";
export type LearningLevel = "beginner" | "intermediate" | "advanced";
export type PublishStatus = "draft" | "published" | "archived";

export interface User {
  id: string;
  _id?: string;
  fullName: string;
  email: string;
  avatarUrl: string;
  role: Role;
  status: "active" | "inactive";
  learningLevel: LearningLevel;
  preferredLanguage: string;
  emailVerified: boolean;
  lastActive: string;
  notificationEmail: boolean;
  notificationInApp: boolean;
  theme: "light" | "dark" | "system";
  createdAt: string;
  courses?: number;
  averageScore?: number | null;
  progress?: number;
}

export interface CourseInstructor {
  fullName: string;
  avatarUrl?: string;
}

export interface Course {
  id: string;
  _id?: string;
  title: string;
  description: string;
  category: string;
  level: LearningLevel;
  thumbnailUrl: string;
  duration: string;
  instructorName?: string;
  status: PublishStatus;
  learningObjectives: string[];
  lessons?: number | Lesson[];
  quizzes?: number | Quiz[];
  enrolled?: boolean;
  completed?: boolean;
  enrollmentCount?: number;
  progressPercentage?: number;
  instructor?: CourseInstructor;
  createdAt: string;
}

export interface Lesson {
  id?: string;
  _id?: string;
  course: string | { _id: string; title: string };
  title: string;
  description: string;
  content: string;
  videoUrl: string;
  imageUrl: string;
  learningObjectives: string[];
  duration: string;
  orderIndex: number;
  status: "draft" | "published";
}

export interface Quiz {
  id?: string;
  _id?: string;
  course: string | { _id: string; title: string };
  lesson?: string | { _id: string; title: string };
  title: string;
  description: string;
  passingScore: number;
  timeLimit: number;
  attemptLimit: number;
  status: "draft" | "published";
  questionCount?: number;
  questions?: Question[];
}

export interface Question {
  id?: string;
  _id?: string;
  quiz: string | { _id: string; title: string };
  questionText: string;
  questionType: "multiple_choice" | "true_false" | "short_answer";
  options: { text: string; order: number }[];
  correctAnswer?: string;
  explanation?: string;
  difficulty: "easy" | "medium" | "hard";
  points: number;
  orderIndex: number;
}

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link?: string;
  createdAt: string;
}
