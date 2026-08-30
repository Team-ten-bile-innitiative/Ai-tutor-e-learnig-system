import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, type FormEvent, type MouseEvent } from "react";
import { toast } from "sonner";
import {
  AtSign,
  BookOpen,
  BookMarked,
  Bot,
  Camera,
  ChevronRight,
  CircleHelp,
  Globe,
  Headphones,
  Heart,
  Home,
  Info,
  LayoutDashboard,
  Layers,
  Mail,
  Menu,
  Send,
  Share2,
  TrendingUp,
  User,
  UserPlus,
  Video,
  X,
  type LucideIcon,
} from "lucide-react";
import { BrandLogo } from "@/components/shared";
import { LanguageSelect } from "@/components/LanguageSelect";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useI18n, type I18nKey } from "@/context/I18nContext";

const nav: { to: string; labelKey: I18nKey; Icon: LucideIcon }[] = [
  { to: "/", labelKey: "nav.home", Icon: Home },
  { to: "/courses", labelKey: "nav.courses", Icon: BookOpen },
  { to: "/study-guide", labelKey: "nav.studyGuide", Icon: BookMarked },
  { to: "/faq", labelKey: "nav.faq", Icon: CircleHelp },
  { to: "/about", labelKey: "nav.about", Icon: Info },
  { to: "/contact", labelKey: "nav.contact", Icon: Mail },
];

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 88;
  window.scrollTo({ top, behavior: "smooth" });
}

const quickLinks: { to: string; label: string; Icon: LucideIcon }[] = [
  { to: "/", label: "Home", Icon: Home },
  { to: "/courses", label: "Courses", Icon: BookOpen },
  { to: "/about", label: "About Us", Icon: Info },
  { to: "/#features", label: "Features", Icon: Layers },
  { to: "/login", label: "Login", Icon: User },
  { to: "/register", label: "Get Started", Icon: UserPlus },
];

const courseLinks = [
  { to: "/courses?q=Mathematics", label: "Mathematics" },
  { to: "/courses?q=Physics", label: "Physics" },
  { to: "/courses?q=Computer", label: "Computer Science" },
  { to: "/courses?q=AI", label: "AI Tutor" },
  { to: "/courses", label: "All Courses" },
];

const supportLinks = [
  { to: "/contact", label: "Help Center" },
  { to: "/faq", label: "FAQs" },
  { to: "/contact", label: "Live Chat" },
  { to: "/study-guide", label: "Study Guides" },
  { to: "/about", label: "Privacy Policy" },
  { to: "/about", label: "Terms of Service" },
];

const footerHighlights: { Icon: LucideIcon; label: string; iconClass: string }[] = [
  { Icon: Bot, label: "AI-Powered Tutor", iconClass: "bg-gradient-to-b from-[#EC4899] to-[#6D28D9] shadow-[0_8px_18px_rgba(109,40,217,0.35)]" },
  { Icon: BookOpen, label: "Interactive Learning", iconClass: "bg-gradient-to-b from-[#2563EB] to-[#1E3A8A] shadow-[0_8px_18px_rgba(37,99,235,0.35)]" },
  { Icon: TrendingUp, label: "Smart Progress", iconClass: "bg-gradient-to-b from-[#16A34A] to-[#14532D] shadow-[0_8px_18px_rgba(22,163,74,0.35)]" },
  { Icon: Headphones, label: "Reliable Support", iconClass: "bg-gradient-to-b from-[#7C3AED] to-[#4C1D95] shadow-[0_8px_18px_rgba(124,58,237,0.35)]" },
];

const socials = [
  { href: "https://facebook.com", Icon: Globe, label: "Facebook", className: "bg-[#1877F2]" },
  { href: "https://twitter.com", Icon: Share2, label: "Twitter", className: "bg-[#1DA1F2]" },
  { href: "https://linkedin.com", Icon: AtSign, label: "LinkedIn", className: "bg-[#0A66C2]" },
  { href: "https://youtube.com", Icon: Video, label: "YouTube", className: "bg-[#FF0000]" },
  { href: "https://instagram.com", Icon: Camera, label: "Instagram", className: "bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]" },
];

function FooterHeading({ title, accent }: { title: string; accent: string }) {
  return (
    <h3 className="w-fit text-lg font-extrabold text-[#1E1B4B]">
      {title}
      <span className={`mt-2 block h-1 w-14 rounded-full ${accent}`} />
    </h3>
  );
}

function FooterLink({ to, label, Icon, chevron }: { to: string; label: string; Icon?: LucideIcon; chevron?: "blue" | "purple" }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 text-[15px] font-semibold text-[#1E293B] transition hover:text-[#6D28D9]"
    >
      {Icon ? <Icon className="h-4 w-4 shrink-0 text-[#7C3AED]" strokeWidth={2.5} /> : null}
      {chevron ? <ChevronRight className="h-4 w-4 shrink-0 text-[#7C3AED]" strokeWidth={3} /> : null}
      {label}
    </Link>
  );
}

function SiteFooter() {
  const [email, setEmail] = useState("");

  function onSubscribe(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    toast.success("You are subscribed for learning updates.");
    setEmail("");
  }

  return (
    <footer className="bg-gradient-to-b from-[#DDD6FE] via-white to-[#EDE9FE] text-[#1E293B] shadow-[0_-18px_50px_rgba(124,58,237,0.16)]">
      <div className="mx-auto w-full max-w-7xl px-6 py-14">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
          <div className="max-w-xl">
            <BrandLogo />
            <p className="mt-5 max-w-md text-[15px] font-medium leading-7 text-[#475569]">
              Empowering learners with AI-powered education, interactive courses, and personalized guidance
              from Interactive Ai learing tutor system.
            </p>
          </div>
          <div className="grid w-full max-w-lg grid-cols-2 gap-x-5 gap-y-4">
            {footerHighlights.map(({ Icon, label, iconClass }) => (
              <span
                key={label}
                className="inline-flex min-h-[56px] items-center gap-3 rounded-2xl bg-white px-3 py-2.5 text-[15px] font-extrabold text-[#1E1B4B] shadow-[0_8px_20px_rgba(124,58,237,0.12)] ring-2 ring-[#7C3AED]/20"
              >
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${iconClass}`}>
                  <Icon className="h-5 w-5 text-white" strokeWidth={2.4} />
                </span>
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div>
            <FooterHeading title="Quick Links" accent="bg-[#2563EB]" />
            <div className="mt-5 grid gap-3">
              {quickLinks.map((l) => (
                <FooterLink key={l.label} {...l} />
              ))}
            </div>
          </div>
          <div>
            <FooterHeading title="Courses" accent="bg-[#2563EB]" />
            <div className="mt-5 grid gap-3">
              {courseLinks.map((l) => (
                <FooterLink key={l.label} {...l} chevron="blue" />
              ))}
            </div>
          </div>
          <div>
            <FooterHeading title="Support" accent="bg-[#2563EB]" />
            <div className="mt-5 grid gap-3">
              {supportLinks.map((l) => (
                <FooterLink key={l.label} {...l} chevron="blue" />
              ))}
            </div>
          </div>
          <div>
            <FooterHeading title="Stay Updated" accent="bg-gradient-to-r from-[#7C3AED] to-[#DB2777]" />
          <p className="mt-3 text-sm font-medium text-[#475569]">Get course and tutor updates in your inbox.</p>
          <form onSubmit={onSubscribe} className="mt-4 flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="h-11 w-full rounded-[5px] border-2 border-[#7C3AED]/35 bg-white px-3 text-sm font-bold text-[#1E293B] outline-none placeholder:font-semibold placeholder:text-slate-400 hover:border-[#7C3AED] focus:border-[#7C3AED]"
            />
            <button
              type="submit"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white shadow-[0_8px_16px_rgba(124,58,237,0.35)] hover:brightness-110"
              aria-label="Subscribe"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <p className="mt-6 text-base font-extrabold text-[#1E1B4B]">Follow Us</p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {socials.map(({ href, Icon, label, className }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className={`grid h-11 w-11 place-items-center rounded-full text-white shadow-md ${className}`}
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        </div>
      </div>

      <div className="bg-[#DDD6FE]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-5 text-sm font-medium text-[#334155] sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Interactive Ai learing tutor system. All rights reserved.</p>
          <p className="inline-flex items-center gap-1.5">
            Made with <Heart className="h-4 w-4 fill-[#EC4899] text-[#EC4899]" /> passion for learners worldwide
          </p>
        </div>
      </div>
    </footer>
  );
}
function isNavActive(to: string, pathname: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function PublicLayout() {
  const { user } = useAuth();
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const dest = user?.role === "admin" ? "/admin/dashboard" : "/student/dashboard";
  const authPages = ["/register", "/login", "/forgot-password", "/reset-password"];
  const lockPage = authPages.includes(location.pathname);
  const hideFooter =
    location.pathname === "/contact" ||
    location.pathname.startsWith("/courses") ||
    location.pathname.startsWith("/study-guide") ||
    authPages.includes(location.pathname);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const tmr = window.setTimeout(() => scrollToId(id), 50);
      return () => window.clearTimeout(tmr);
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!lockPage) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, [lockPage]);

  function goHome(e: MouseEvent) {
    if (location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (location.hash) navigate("/", { replace: true });
    }
  }

  const authButtons = user ? (
    <Link to={dest} className="shrink-0" onClick={() => setMenuOpen(false)}>
      <Button className="group h-10 rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] px-4 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(139,92,246,0.35)] transition hover:-translate-y-0.5 hover:brightness-110">
        <LayoutDashboard className="h-4 w-4 transition group-hover:scale-110" />
        {t("nav.dashboard")}
      </Button>
    </Link>
  ) : (
    <>
      <Link to="/register" className="shrink-0" onClick={() => setMenuOpen(false)}>
        <Button className="group h-10 w-auto rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#2563EB] px-4 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(99,102,241,0.38)] transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0">
          <UserPlus className="h-4 w-4 transition duration-200 group-hover:scale-110" strokeWidth={2.25} />
          {t("nav.register")}
        </Button>
      </Link>
      <Link to="/login" className="shrink-0" onClick={() => setMenuOpen(false)}>
        <Button className="group h-10 w-auto rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#2563EB] px-4 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(99,102,241,0.38)] transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0">
          <User className="h-4 w-4 transition duration-200 group-hover:scale-110" strokeWidth={2.25} />
          {t("nav.signIn")}
        </Button>
      </Link>
    </>
  );

  return (
    <div
      className={
        lockPage
          ? "h-dvh overflow-hidden bg-[#F3EEFF] pt-[var(--public-header-h)]"
          : "min-h-dvh overflow-x-hidden bg-[#F3EEFF] pt-[var(--public-header-h)]"
      }
    >
      <header className="public-header">
        <div className="mx-auto flex h-20 max-w-7xl items-center gap-4 px-4">
          <BrandLogo />
          <span className="hidden h-9 w-px shrink-0 bg-slate-200 lg:block" aria-hidden />
          <div className="hidden min-w-0 flex-1 items-center gap-4 lg:flex">
            {nav.map((item) => {
              const active = isNavActive(item.to, location.pathname);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`group/nav inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap text-sm font-bold uppercase tracking-[0.08em] no-underline transition ${
                    active ? "text-[#3E5BFF]" : "text-black hover:text-[#3E5BFF]"
                  }`}
                  onClick={item.to === "/" ? goHome : undefined}
                >
                  <item.Icon
                    className={`h-5 w-5 shrink-0 transition group-hover/nav:-translate-y-0.5 ${
                      active ? "text-[#3E5BFF]" : "text-[#7C3AED] group-hover/nav:text-[#3E5BFF]"
                    }`}
                    strokeWidth={2.4}
                  />
                  {t(item.labelKey)}
                </Link>
              );
            })}
            <LanguageSelect />
            {authButtons}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:hidden">
            <LanguageSelect />
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-[#7C3AED]"
              aria-label={menuOpen ? t("nav.close") : t("nav.menu")}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {menuOpen ? (
          <div className="border-t border-slate-100 bg-white px-4 py-4 lg:hidden">
            <nav className="flex flex-col gap-1">
              {nav.map((item) => {
                const active = isNavActive(item.to, location.pathname);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`inline-flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold uppercase tracking-[0.06em] ${
                      active ? "bg-[#F5F3FF] text-[#3E5BFF]" : "text-[#0F172A]"
                    }`}
                    onClick={item.to === "/" ? goHome : undefined}
                  >
                    <item.Icon className="h-5 w-5 text-[#7C3AED]" strokeWidth={2.4} />
                    {t(item.labelKey)}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-4 flex flex-wrap gap-2">{authButtons}</div>
          </div>
        ) : null}
      </header>
      <div className={lockPage ? "flex h-full min-h-0 flex-col overflow-hidden" : undefined}>
        <Outlet />
        {hideFooter ? null : <SiteFooter />}
      </div>
    </div>
  );
}
