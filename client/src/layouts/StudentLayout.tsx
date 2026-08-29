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
import { BrandLogo } from "@/components/shared";
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
    <div className="flex min-h-screen overflow-x-hidden bg-canvas">
      <aside className={`fixed inset-y-0 z-30 w-64 border-r border-line bg-white transition lg:static ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex h-16 items-center justify-between gap-2 px-4">
          <BrandLogo compact />
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="space-y-1 px-3" aria-label="Student">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${isActive ? "bg-primary-soft text-primary font-semibold" : "text-slate-600 hover:bg-slate-50"}`
              }
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </NavLink>
          ))}
          <button
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
            onClick={async () => {
              await logout();
              toast.success("Signed out");
              navigate("/login");
            }}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-line bg-white px-4">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu />
          </button>
          <p className="hidden text-sm text-muted md:block">Learn at your pace. Ask the AI Tutor anytime.</p>
          <div className="ml-auto flex items-center gap-3">
            <NotificationDropdown />
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-ai text-xs font-bold text-white">
                {initials(user?.fullName)}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold leading-none">{user?.fullName}</p>
                <p className="text-xs capitalize text-muted">{user?.learningLevel}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 pb-20 lg:p-8 lg:pb-8">
          <Outlet />
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
