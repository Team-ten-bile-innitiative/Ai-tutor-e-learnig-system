import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { I18nProvider } from "@/context/I18nContext";
import { PublicLayout } from "@/layouts/PublicLayout";
import { AdminLayout } from "@/layouts/AdminLayout";
import { StudentLayout } from "@/layouts/StudentLayout";
import { RequireAuth, RedirectIfAuthed } from "@/components/RequireAuth";
import { LandingPage, AboutPage } from "@/pages/public/Landing";
import { ContactPage } from "@/pages/public/Contact";
import { PublicCoursesPage } from "@/pages/public/Courses";
import { StudyGuidePage } from "@/pages/public/StudyGuide";
import { FaqPage } from "@/pages/public/Faq";
import { ForgotPasswordPage, LoginPage, RegisterPage, ResetPasswordPage } from "@/pages/auth/AuthPages";
import { AdminDashboardPage } from "@/pages/admin/Dashboard";
import { AdminStudentsPage } from "@/pages/admin/Students";
import { AdminPendingPage } from "@/pages/admin/Pending";
import { AdminStudentDetailPage } from "@/pages/admin/StudentDetail";
import { AdminCoursesPage } from "@/pages/admin/Courses";
import { AdminCategoriesPage } from "@/pages/admin/Categories";
import { AdminLessonsPage, AdminQuizzesPage } from "@/pages/admin/Content";
import { AdminQuestionsPage } from "@/pages/admin/Questions";
import { AdminAnalyticsPage, AdminSettingsPage } from "@/pages/admin/Analytics";
import { StudentDashboardPage } from "@/pages/student/Dashboard";
import { StudentCourseDetailPage, StudentCoursesPage, StudentLessonsListPage, StudentQuizzesListPage } from "@/pages/student/Courses";
import { StudentLessonPage, StudentQuizPage, StudentResultPage } from "@/pages/student/Learn";
import { StudentAITutorPage } from "@/pages/student/AITutor";
import { StudentProfilePage, StudentProgressPage, StudentSettingsPage } from "@/pages/student/Progress";

export default function App() {
  return (
    <AuthProvider>
      <I18nProvider>
      <BrowserRouter>
        <Toaster richColors position="top-right" />
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/courses" element={<PublicCoursesPage />} />
            <Route path="/study-guide" element={<StudyGuidePage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route
              path="/register"
              element={
                <RedirectIfAuthed>
                  <RegisterPage />
                </RedirectIfAuthed>
              }
            />
            <Route
              path="/login"
              element={
                <RedirectIfAuthed>
                  <LoginPage />
                </RedirectIfAuthed>
              }
            />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>

          <Route
            path="/admin"
            element={
              <RequireAuth role="admin">
                <AdminLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="students" element={<AdminStudentsPage />} />
            <Route path="pending" element={<AdminPendingPage />} />
            <Route path="students/:id" element={<AdminStudentDetailPage />} />
            <Route path="courses" element={<AdminCoursesPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="lessons" element={<AdminLessonsPage />} />
            <Route path="quizzes" element={<AdminQuizzesPage />} />
            <Route path="questions" element={<AdminQuestionsPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>

          <Route
            path="/student"
            element={
              <RequireAuth role="student">
                <StudentLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboardPage />} />
            <Route path="courses" element={<StudentCoursesPage />} />
            <Route path="courses/:id" element={<StudentCourseDetailPage />} />
            <Route path="lessons" element={<StudentLessonsListPage />} />
            <Route path="lessons/:id" element={<StudentLessonPage />} />
            <Route path="quizzes" element={<StudentQuizzesListPage />} />
            <Route path="quizzes/:id" element={<StudentQuizPage />} />
            <Route path="results/:id" element={<StudentResultPage />} />
            <Route path="ai-tutor" element={<StudentAITutorPage />} />
            <Route path="progress" element={<StudentProgressPage />} />
            <Route path="profile" element={<StudentProfilePage />} />
            <Route path="settings" element={<StudentSettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </I18nProvider>
    </AuthProvider>
  );
}
