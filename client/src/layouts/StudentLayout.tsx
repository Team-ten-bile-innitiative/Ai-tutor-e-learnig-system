import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Bot,
  LayoutDashboard,
  LineChart,
  ListChecks,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { BrandLogo, ErrorBoundary } from "@/components/shared";
import { initials } from "@/lib/utils";
import { toast } from "sonner";

const links = [
  { to: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/student/courses", label: "My Courses", icon: BookOpen },
  { to: "/student/lessons", label: "Lessons", icon: ListChecks },
  { to: "/student/quizzes", label: "Quizzes", icon: Sparkles },
  { to: "/student/ai-tutor", label: "AI Tutor", icon: Bot },
  { to: "/student/progress", label: "My Progress", icon: LineChart },
  { to: "/student/profile", label: "Profile", icon: UserRound },
  { to: "/student/settings", label: "Settings", icon: Settings },
];

export function StudentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas">
      {open ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-white transition-transform ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-4">
          <BrandLogo compact />
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="hide-scroll min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-3" aria-label="Student">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${isActive ? "bg-primary-soft text-primary font-semibold" : "text-slate-600 hover:bg-slate-50"}`
              }
            >
              <l.icon className="h-5 w-5" strokeWidth={1.75} />
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="shrink-0 p-3">
          <button
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
            onClick={async () => {
              await logout();
              toast.success("Signed out");
              navigate("/login");
            }}
          >
            <LogOut className="h-5 w-5" strokeWidth={1.75} />
            Logout
          </button>
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:left-64">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu />
          </button>
          <p className="hidden text-sm text-muted md:block">Learn at your pace. Ask the AI Tutor anytime.</p>
          <div className="ml-auto flex items-center gap-3">
            <NotificationDropdown />
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[#2563EB] text-xs font-bold text-white">
                {initials(user?.fullName)}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold leading-none">{user?.fullName}</p>
                <p className="text-xs capitalize text-muted">{user?.learningLevel}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 pb-20 pt-20 lg:px-8 lg:pb-8 lg:pt-24">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
        <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-white py-2 lg:hidden" aria-label="Mobile">
          {links.slice(0, 5).map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => `flex flex-col items-center gap-1 text-[10px] ${isActive ? "text-primary" : "text-muted"}`}>
              <l.icon className="h-4 w-4" />
              {l.label.split(" ")[0]}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
