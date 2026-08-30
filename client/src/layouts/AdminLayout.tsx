import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  FileQuestion,
  FileUp,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { BrandLogo } from "@/components/shared";
import { initials } from "@/lib/utils";
import { toast } from "sonner";

const links = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/students", label: "Students", icon: Users },
  { to: "/admin/courses", label: "Courses", icon: BookOpen },
  { to: "/admin/import-pdf", label: "Import PDF", icon: FileUp },
  { to: "/admin/lessons", label: "Lessons", icon: ListChecks },
  { to: "/admin/quizzes", label: "Quizzes", icon: FileQuestion },
  { to: "/admin/questions", label: "Questions", icon: FileQuestion },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-canvas">
      <aside className={`fixed inset-y-0 z-30 w-64 bg-sidebar text-white transition lg:static ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex h-16 items-center justify-between gap-2 px-4">
          <BrandLogo light compact />
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="space-y-1 px-3" aria-label="Admin">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${isActive ? "bg-white/15" : "text-indigo-100 hover:bg-white/10"}`
              }
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </NavLink>
          ))}
          <button
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-indigo-100 hover:bg-white/10"
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
          <div className="hidden flex-1 items-center gap-2 rounded-xl border border-line bg-slate-50 px-3 py-2 text-sm text-muted md:flex">
            <Search className="h-4 w-4" />
            Search students, courses, quizzes
          </div>
          <div className="ml-auto flex items-center gap-3">
            <NotificationDropdown />
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-xs font-bold text-white">
                {initials(user?.fullName)}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold leading-none">{user?.fullName}</p>
                <p className="text-xs text-muted">Administrator</p>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
