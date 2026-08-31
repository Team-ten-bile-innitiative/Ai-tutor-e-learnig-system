import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, type FormEvent, type MouseEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BookOpen,
  BookMarked,
  ChevronRight,
  CircleHelp,
  Heart,
  Home,
  Info,
  LayoutDashboard,
  Layers,
  Mail,
  Menu,
  Send,
  User,
  UserPlus,
  X,
  type LucideIcon,
} from "lucide-react";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaXTwitter, FaYoutube } from "react-icons/fa6";
import type { IconType } from "react-icons";
import { api } from "@/lib/api";
import { BrandLogo } from "@/components/shared";
import { LanguageSelect } from "@/components/LanguageSelect";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useI18n, type I18nKey } from "@/context/I18nContext";

const nav: { to: string; labelKey: I18nKey; Icon: LucideIcon; iconClass: string }[] = [
  { to: "/", labelKey: "nav.home", Icon: Home, iconClass: "text-[#2563EB]" },
  { to: "/courses", labelKey: "nav.courses", Icon: BookOpen, iconClass: "text-[#0D9488]" },
  { to: "/study-guide", labelKey: "nav.studyGuide", Icon: BookMarked, iconClass: "text-[#D97706]" },
  { to: "/faq", labelKey: "nav.faq", Icon: CircleHelp, iconClass: "text-[#0891B2]" },
  { to: "/about", labelKey: "nav.about", Icon: Info, iconClass: "text-[#16A34A]" },
  { to: "/contact", labelKey: "nav.contact", Icon: Mail, iconClass: "text-[#EA580C]" },
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

const supportLinks = [
  { to: "/contact", label: "Help Center" },
  { to: "/faq", label: "FAQs" },
  { to: "/contact", label: "Live Chat" },
  { to: "/study-guide", label: "Study Guides" },
];

const socials: { href: string; Icon: IconType; label: string; className: string }[] = [
  { href: "https://facebook.com", Icon: FaFacebookF, label: "Facebook", className: "bg-[#1877F2]" },
  { href: "https://x.com", Icon: FaXTwitter, label: "X", className: "bg-[#0F172A]" },
  { href: "https://linkedin.com", Icon: FaLinkedinIn, label: "LinkedIn", className: "bg-[#0A66C2]" },
  { href: "https://youtube.com", Icon: FaYoutube, label: "YouTube", className: "bg-[#FF0000]" },
  { href: "https://instagram.com", Icon: FaInstagram, label: "Instagram", className: "bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]" },
];

function FooterHeading({ title, accent }: { title: string; accent: string }) {
  return (
    <h3 className="w-fit text-lg font-extrabold text-[#172554]">
      {title}
      <span className={`mt-2 block h-1 w-14 rounded-full ${accent}`} />
    </h3>
  );
}

function FooterLink({ to, label, Icon, chevron }: { to: string; label: string; Icon?: LucideIcon; chevron?: "blue" | "purple" }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 text-[15px] font-semibold text-[#1E293B] transition hover:text-[#1D4ED8]"
    >
      {Icon ? <Icon className="h-4 w-4 shrink-0 text-[#2563EB]" strokeWidth={2.5} /> : null}
      {chevron ? <ChevronRight className="h-4 w-4 shrink-0 text-[#2563EB]" strokeWidth={3} /> : null}
      {label}
    </Link>
  );
}

function SiteFooter() {
  const [email, setEmail] = useState("");

  const footerCourses = useQuery({
    queryKey: ["footer-courses"],
    queryFn: async () =>
      (await api.get("/courses", { params: { status: "published", limit: 3 } })).data.data as {
        _id: string;
        title: string;
      }[],
    staleTime: 5 * 60 * 1000,
  });

  function onSubscribe(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    toast.success("You are subscribed for learning updates.");
    setEmail("");
  }

  return (
    <footer className="border-t border-slate-200 bg-[#F8FAFC] text-[#1E293B]">
      <div className="mx-auto w-full max-w-7xl px-6 py-14">
        <div className="max-w-xl">
          <BrandLogo />
          <p className="mt-5 max-w-md text-[15px] font-medium leading-7 text-[#475569]">
            Empowering learners with AI-powered education, interactive courses, and personalized guidance
            from Interactive Ai learing tutor system.
          </p>
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
              <FooterLink to="/courses" label="All Courses" chevron="blue" />
              {(footerCourses.data || []).slice(0, 3).map((c) => (
                <FooterLink
                  key={c._id}
                  to={`/courses?q=${encodeURIComponent(c.title)}`}
                  label={c.title}
                  chevron="blue"
                />
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
            <FooterHeading title="Stay Updated" accent="bg-[#2563EB]" />
          <p className="mt-3 text-sm font-medium text-[#475569]">Get course and tutor updates in your inbox.</p>
          <form onSubmit={onSubscribe} className="mt-4 flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-[#1E293B] outline-none placeholder:font-semibold placeholder:text-slate-400 hover:border-[#2563EB] focus:border-[#2563EB]"
            />
            <button
              type="submit"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#2563EB] text-white transition hover:bg-[#1D4ED8]"
              aria-label="Subscribe"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <p className="mt-6 text-base font-extrabold text-[#172554]">Follow Us</p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {socials.map(({ href, Icon, label, className }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className={`grid h-11 w-11 place-items-center rounded-full text-white shadow-md transition hover:-translate-y-0.5 hover:brightness-110 ${className}`}
              >
                <Icon className="h-[18px] w-[18px]" />
              </a>
            ))}
          </div>
        </div>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-5 text-sm font-medium text-[#475569] sm:flex-row">
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

  const headerBtn =
    "h-10 w-auto rounded-lg border border-[#2563EB] bg-white px-4 text-sm font-semibold text-[#1D4ED8] transition hover:bg-[#EFF6FF]";

  const authButtons = user ? (
    <Link to={dest} className="shrink-0" onClick={() => setMenuOpen(false)}>
      <Button className={headerBtn}>
        <LayoutDashboard className="h-4 w-4" />
        {t("nav.dashboard")}
      </Button>
    </Link>
  ) : (
    <>
      <Link to="/register" className="shrink-0" onClick={() => setMenuOpen(false)}>
        <Button className={headerBtn}>
          <UserPlus className="h-4 w-4" strokeWidth={2.25} />
          {t("nav.register")}
        </Button>
      </Link>
      <Link to="/login" className="shrink-0" onClick={() => setMenuOpen(false)}>
        <Button className={headerBtn}>
          <User className="h-4 w-4" strokeWidth={2.25} />
          {t("nav.signIn")}
        </Button>
      </Link>
    </>
  );

  return (
    <div
      className={
        lockPage
          ? "h-dvh overflow-hidden bg-[#EFF6FF] pt-[var(--public-header-h)]"
          : "min-h-dvh overflow-x-hidden bg-[#EFF6FF] pt-[var(--public-header-h)]"
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
                    active ? "text-[#1D4ED8]" : "text-black hover:text-[#1D4ED8]"
                  }`}
                  onClick={item.to === "/" ? goHome : undefined}
                >
                  <item.Icon
                    className={`h-5 w-5 shrink-0 transition group-hover/nav:-translate-y-0.5 ${item.iconClass}`}
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
              className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-[#2563EB]"
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
                      active ? "bg-[#EFF6FF] text-[#1D4ED8]" : "text-[#0F172A]"
                    }`}
                    onClick={item.to === "/" ? goHome : undefined}
                  >
                    <item.Icon className={`h-5 w-5 ${item.iconClass}`} strokeWidth={2.4} />
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
