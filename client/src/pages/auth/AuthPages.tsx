import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { Button } from "@/components/ui/button";
import { FieldError, FieldIcon, authFieldPad, Input, Label, type FieldIconTone } from "@/components/ui/field";
import { useEffect, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Check, KeyRound, Loader2, MailCheck, ShieldCheck, User, UserPlus, UserRound } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

function redirectFor(role: string) {
  return role === "admin" ? "/admin/dashboard" : "/student/dashboard";
}

export function LoginPage() {
  const { login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  return (
    <AuthShell title={t("auth.signIn")} subtitle={t("auth.signInSub")}>
      <form
        className="w-full space-y-2.5"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            const user = await login(values.email, values.password);
            toast.success("Signed in");
            navigate(redirectFor(user.role));
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Login failed");
          }
        })}
      >
        <div className="text-left">
          <Label htmlFor="email" className="mb-1">
            {t("auth.email")}
          </Label>
          <IconInput
            id="email"
            icon={MailCheck}
            tone="teal"
            type="email"
            placeholder="Enter your email"
            autoComplete="email"
            {...form.register("email")}
          />
          <FieldError>{form.formState.errors.email?.message}</FieldError>
        </div>
        <div className="text-left">
          <Label htmlFor="password" className="mb-1">
            {t("auth.password")}
          </Label>
          <div className="relative">
            <FieldIcon icon={KeyRound} tone="amber" variant="plain" />
            <Input
              id="password"
              className={cn("h-10 pr-11", authFieldPad)}
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="current-password"
              {...form.register("password")}
            />
            <PasswordEye visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />
          </div>
          <FieldError>{form.formState.errors.password?.message}</FieldError>
          <p className="mt-1.5 text-right">
            <Link className="text-sm font-bold text-[#2563EB] hover:text-[#1D4ED8]" to="/forgot-password">
              {t("auth.forgot")}
            </Link>
          </p>
        </div>
        <Button
          variant="gradient"
          className="auth-card-btn h-10 w-full text-sm font-bold"
          type="submit"
          disabled={form.formState.isSubmitting}
        >
          <User className="h-4 w-4" strokeWidth={2.4} />
          {t("auth.signIn")}
        </Button>
        <p className="pt-1 text-center text-sm font-semibold text-slate-500">
          {t("auth.noAccount")}{" "}
          <Link className="font-bold text-[#2563EB] hover:text-[#1D4ED8]" to="/register">
            {t("auth.register")}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

function PasswordEye({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className="absolute right-2.5 top-1/2 z-10 -translate-y-1/2 p-0.5"
      onClick={onToggle}
      aria-label={visible ? "Hide password" : "Show password"}
    >
      {visible ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A9.8 9.8 0 0 1 12 5c7 0 10 7 10 7a16.5 16.5 0 0 1-3.2 4.4M6.1 6.1A16.7 16.7 0 0 0 2 12s3 7 10 7a9.8 9.8 0 0 0 4.1-.9"
            stroke="#2563EB"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"
            stroke="#2563EB"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="3" stroke="#2563EB" strokeWidth="2.2" />
        </svg>
      )}
    </button>
  );
}

function IconInput({
  icon: Icon,
  tone = "purple",
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { icon: typeof MailCheck; tone?: FieldIconTone }) {
  return (
    <div className="relative">
      <FieldIcon icon={Icon} tone={tone} variant="plain" />
      <Input className={cn("h-10", authFieldPad, className)} {...props} />
    </div>
  );
}

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name is required"),
    email: z.string().email(),
    password: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string(),
    terms: z.boolean().refine((v) => v === true, { message: "Please accept the terms" }),
  })
  .refine((d) => d.password === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

const creatingSteps = ["Saving your details", "Setting up your dashboard", "Preparing your workspace"];

function CreatingAccountView({ ready, step }: { ready: boolean; step: number }) {
  const progress = ready ? 100 : Math.min(92, 18 + step * 28);
  return (
    <div className="w-full max-w-[420px] py-2 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#EFF6FF] ring-8 ring-[#DBEAFE]">
        {ready ? (
          <Check className="h-8 w-8 text-[#16A34A]" strokeWidth={2.5} />
        ) : (
          <Loader2 className="h-8 w-8 animate-spin text-[#2563EB]" strokeWidth={2.25} />
        )}
      </div>
      <h1 className="mt-5 text-2xl font-bold text-[#0F172A] xl:text-3xl">{ready ? "Account created" : "Creating your account"}</h1>
      <p className="mt-2 text-sm leading-relaxed text-[#64748B]">
        {ready ? "Opening your learning dashboard…" : "Please wait while we set everything up for you."}
      </p>
      <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-[#2563EB] transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
      <ul className="mt-6 space-y-3 text-left">
        {creatingSteps.map((label, i) => {
          const done = ready || i < step;
          const active = !ready && i === step;
          return (
            <li key={label} className="flex items-center gap-3">
              <span
                className={cn(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold",
                  done ? "bg-[#DCFCE7] text-[#16A34A]" : active ? "bg-[#DBEAFE] text-[#2563EB]" : "bg-slate-100 text-slate-400"
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" strokeWidth={2.6} /> : <span>{i + 1}</span>}
              </span>
              <span className={cn("text-sm font-semibold", done || active ? "text-[#0F172A]" : "text-slate-400")}>{label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function RegisterPage() {
  const { register: signup } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [phase, setPhase] = useState<"form" | "creating" | "ready">("form");
  const [step, setStep] = useState(0);
  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "", terms: true },
  });

  useEffect(() => {
    if (phase !== "creating") return;
    setStep(0);
    const t1 = window.setTimeout(() => setStep(1), 700);
    const t2 = window.setTimeout(() => setStep(2), 1500);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [phase]);

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-white">
      <aside className="relative hidden h-full min-h-0 w-[42%] shrink-0 flex-col items-center justify-center overflow-hidden bg-[#EFF6FF] px-8 py-6 lg:flex">
        <div className="flex w-full max-w-md flex-col items-center text-center">
          <h2 className="text-2xl font-bold tracking-tight text-[#0F172A] xl:text-3xl">
            {phase === "form" ? t("auth.create") : phase === "ready" ? "You're all set" : "Almost there"}
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#64748B] xl:text-base">
            {phase === "form"
              ? t("auth.createSub")
              : "Your personal learning space is being prepared with AI tutoring ready to help."}
          </p>
          <img
            src="/register-hero.jpg"
            alt="Graduation cap and books"
            className="mx-auto mt-6 w-full max-w-[280px] object-contain xl:mt-8 xl:max-w-[320px]"
          />
        </div>
      </aside>

      <section className="relative flex h-full min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden px-4 sm:px-6">
        {phase !== "form" ? (
          <CreatingAccountView ready={phase === "ready"} step={step} />
        ) : (
        <div className="w-full max-w-[420px] py-2">
          <h1 className="text-center text-2xl font-bold text-[#0F172A] xl:text-3xl">{t("auth.create")}</h1>
          <p className="mt-1 text-center text-sm text-[#64748B]">{t("auth.createSub")}</p>
          <form
            className="auth-fields mt-4 space-y-2"
            onSubmit={form.handleSubmit(async (values) => {
              sessionStorage.setItem("et-signup-flow", "1");
              setPhase("creating");
              const started = Date.now();
              try {
                const user = await signup({
                  fullName: values.fullName,
                  email: values.email,
                  password: values.password,
                  confirmPassword: values.confirmPassword,
                });
                const wait = 2400 - (Date.now() - started);
                if (wait > 0) await sleep(wait);
                setPhase("ready");
                await sleep(900);
                sessionStorage.removeItem("et-signup-flow");
                navigate(redirectFor(user?.role || "student"), { replace: true });
              } catch (e) {
                sessionStorage.removeItem("et-signup-flow");
                setPhase("form");
                toast.error(e instanceof Error ? e.message : "Registration failed");
              }
            })}
          >
            <div>
              <Label className="mb-1 font-bold text-[#0F172A]">{t("auth.fullName")}</Label>
              <IconInput icon={UserRound} tone="blue" placeholder="Enter your full name" autoComplete="name" {...form.register("fullName")} />
              <FieldError>{form.formState.errors.fullName?.message}</FieldError>
            </div>
            <div>
              <Label className="mb-1 font-bold text-[#0F172A]">{t("auth.email")}</Label>
              <IconInput icon={MailCheck} tone="teal" type="email" placeholder="Enter your email" autoComplete="email" {...form.register("email")} />
              <FieldError>{form.formState.errors.email?.message}</FieldError>
            </div>
            <div>
              <Label className="mb-1 font-bold text-[#0F172A]">{t("auth.password")}</Label>
              <div className="relative">
                <FieldIcon icon={KeyRound} tone="amber" variant="plain" />
                <Input
                  className={cn("h-10 pr-11", authFieldPad)}
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="new-password"
                  {...form.register("password")}
                />
                <PasswordEye visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />
              </div>
              <FieldError>{form.formState.errors.password?.message}</FieldError>
            </div>
            <div>
              <Label className="mb-1 font-bold text-[#0F172A]">{t("auth.confirm")}</Label>
              <div className="relative">
                <FieldIcon icon={ShieldCheck} tone="green" variant="plain" />
                <Input
                  className={cn("h-10 pr-11", authFieldPad)}
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  {...form.register("confirmPassword")}
                />
                <PasswordEye visible={showConfirm} onToggle={() => setShowConfirm((v) => !v)} />
              </div>
              <FieldError>{form.formState.errors.confirmPassword?.message}</FieldError>
            </div>
            <label className="flex items-center gap-2 text-sm text-[#334155]">
              <input type="checkbox" {...form.register("terms")} className="h-4 w-4 accent-[#2563EB]" />
              {t("auth.terms")}
            </label>
            <FieldError>{form.formState.errors.terms?.message}</FieldError>
            <Button
              variant="gradient"
              className="group h-11 w-full rounded-[5px]"
              type="submit"
              disabled={form.formState.isSubmitting}
            >
              {t("auth.signUp")}
              <UserPlus className="h-4 w-4 transition group-hover:scale-110" strokeWidth={2.25} />
            </Button>
            <p className="pt-2 text-center text-sm text-slate-500">
              {t("auth.haveAccount")}{" "}
              <Link className="font-bold text-[#2563EB]" to="/login">
                {t("auth.logIn")}
              </Link>
            </p>
          </form>
        </div>
        )}
      </section>
    </div>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  return (
    <AuthShell title="Forgot password" subtitle="We will send a reset link if the email exists">
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            const { data } = await api.post("/auth/forgot-password", { email });
            setResetUrl(data.data?.resetUrl || "");
            toast.success(data.message);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed");
          }
        }}
      >
        <div>
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <Button className="auth-card-btn w-full" type="submit">
          Send Reset Link
        </Button>
        {resetUrl ? (
          <p className="break-all text-xs text-muted">
            Dev reset link: <Link className="text-primary" to={resetUrl.replace("http://localhost:5173", "")}>{resetUrl}</Link>
          </p>
        ) : null}
      </form>
    </AuthShell>
  );
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const [password, setPassword] = useState("");
  return (
    <AuthShell title="Reset password" subtitle="Choose a new password">
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api.post("/auth/reset-password", { token, password });
            toast.success("Password updated");
            navigate("/login");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed");
          }
        }}
      >
        <div>
          <Label>New password</Label>
          <Input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <Button className="auth-card-btn w-full" type="submit">
          Update password
        </Button>
      </form>
    </AuthShell>
  );
}

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="grid h-full min-h-0 w-full place-items-center overflow-hidden bg-[#EFF6FF] px-4">
      <div className="auth-card w-full max-w-[400px] border border-[#BFDBFE] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <div className="shrink-0 bg-[#2563EB] px-5 pb-3.5 pt-4 text-center">
          <img
            src="/logo.png"
            alt="Interactive Ai learing tutor system"
            className="mx-auto h-12 w-12 rounded-full bg-white object-cover shadow-md ring-4 ring-white/30"
          />
          <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">Interactive Ai</p>
          <h1 className="text-xl font-extrabold tracking-tight text-white">{title}</h1>
          <p className="text-xs font-semibold text-white/90">{t("auth.brandLine")}</p>
        </div>
        <div className="auth-fields flex flex-1 flex-col justify-center overflow-hidden px-5 pb-4 pt-3">
          <p className="mb-3 text-center text-sm font-semibold text-[#64748B]">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
