import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  ChartColumn,
  ChevronDown,
  ClipboardCheck,
  Clock,
  FolderKanban,
  GraduationCap,
  HelpCircle,
  LayoutGrid,
  LogOut,
  Menu,
  NotebookPen,
  Settings,
  Settings2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { AdminSearch } from "@/components/AdminSearch";
import { BrandLogo, ErrorBoundary } from "@/components/shared";
import { toast } from "sonner";

const links = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/admin/students", label: "Students", icon: UsersRound },
  { to: "/admin/pending", label: "Pending", icon: Clock },
  { to: "/admin/courses", label: "Courses", icon: GraduationCap },
  { to: "/admin/categories", label: "Categories", icon: FolderKanban },
  { to: "/admin/lessons", label: "Lessons", icon: NotebookPen },
  { to: "/admin/quizzes", label: "Quizzes", icon: ClipboardCheck },
  { to: "/admin/questions", label: "Questions", icon: HelpCircle },
  { to: "/admin/analytics", label: "Analytics", icon: ChartColumn },
  { to: "/admin/settings", label: "Settings", icon: Settings2 },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const pendingCount = useQuery({
    queryKey: ["pending-count"],
    queryFn: async () => (await api.get("/admin/students", { params: { status: "pending", limit: 1 } })).data.pagination?.total ?? 0,
    refetchInterval: 8000,
  });
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const profile = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!profile.current?.contains(e.target as Node)) setMenu(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function signOut() {
    await logout();
    toast.success("Signed out");
    navigate("/login");
  }

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
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-white transition-transform ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-white/15 px-4">
          <BrandLogo light compact />
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="hide-scroll min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-3" aria-label="Admin">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${isActive ? "bg-white/15 font-semibold" : "text-blue-100 hover:bg-white/10"}`
              }
            >
              <l.icon className="h-5 w-5" strokeWidth={1.75} />
              <span className="flex-1">{l.label}</span>
              {l.to === "/admin/pending" && (pendingCount.data || 0) > 0 ? (
                <span className="grid min-w-5 place-items-center rounded-full bg-amber-400 px-1.5 text-[11px] font-bold text-slate-900">
                  {pendingCount.data}
                </span>
              ) : null}
            </NavLink>
          ))}
        </nav>
        <div className="shrink-0 p-3">
          <button
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-blue-100 hover:bg-white/10"
            onClick={signOut}
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
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <AdminSearch />
            <NotificationDropdown />
            <div ref={profile} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setMenu((v) => !v)}
                className="flex max-w-[16rem] items-center gap-2.5 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-2.5 text-left"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#2563EB] text-white">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="h-full w-full rounded-lg object-cover" />
                  ) : (
                    <UserRound className="h-4 w-4" strokeWidth={2.2} />
                  )}
                </span>
                <span className="hidden min-w-0 sm:block">
                  <span className="block truncate text-sm font-semibold leading-tight text-ink">{user?.fullName}</span>
                  <span className="block truncate text-xs text-muted">{user?.email || "Administrator"}</span>
                </span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${menu ? "rotate-180" : ""}`} />
              </button>
              {menu ? (
                <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-slate-50"
                    onClick={() => {
                      setMenu(false);
                      navigate("/admin/settings");
                    }}
                  >
                    <UserRound className="h-4 w-4 text-[#2563EB]" />
                    Profile
                  </button>
                  <div className="mx-2 h-px bg-slate-200" />
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-slate-50"
                    onClick={() => {
                      setMenu(false);
                      navigate("/admin/settings");
                    }}
                  >
                    <Settings className="h-4 w-4 text-[#2563EB]" />
                    Settings
                  </button>
                  <div className="mx-2 h-px bg-slate-200" />
                  <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-danger hover:bg-red-50" onClick={signOut}>
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>
        <main className="hide-scroll min-h-screen px-4 pb-4 pt-16 lg:px-6">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
