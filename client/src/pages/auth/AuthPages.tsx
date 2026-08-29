import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { FieldError, FieldIcon, fieldWithIconPad, Input, Label, type FieldIconTone } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { BrandLink } from "@/components/shared";
import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, KeyRound, MailCheck, ShieldCheck, UserPlus, UserRound } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

function redirectFor(role: string) {
  return role === "admin" ? "/admin/dashboard" : "/student/dashboard";
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [remember, setRemember] = useState(true);
  const form = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue learning">
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            const user = await login(values.email, values.password);
            if (!remember) localStorage.removeItem("token");
            toast.success("Signed in");
            navigate(redirectFor(user.role));
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Login failed");
          }
        })}
      >
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...form.register("email")} />
          <FieldError>{form.formState.errors.email?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" {...form.register("password")} />
          <FieldError>{form.formState.errors.password?.message}</FieldError>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          Remember me
        </label>
        <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
          Login
        </Button>
        <p className="text-center text-sm">
          <Link className="text-primary" to="/forgot-password">
            Forgot password?
          </Link>
        </p>
        <p className="text-center text-sm text-muted">
          New here? <Link className="text-primary" to="/register">Create an account</Link>
        </p>
      </form>
    </AuthShell>
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
      <FieldIcon icon={Icon} tone={tone} />
      <Input className={cn("h-10", fieldWithIconPad, className)} {...props} />
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

export function RegisterPage() {
  const { register: signup } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "", terms: true },
  });

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-white">
      <aside className="relative hidden h-full min-h-0 w-[42%] shrink-0 flex-col items-center justify-center overflow-hidden bg-[#F3EEFF] px-8 py-6 lg:flex">
        <div className="flex w-full max-w-md flex-col items-center text-center">
          <h2 className="text-2xl font-bold tracking-tight text-[#0F172A] xl:text-3xl">Create your account</h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#64748B] xl:text-base">
            Join thousands of learners and start learning smarter with AI.
          </p>
          <img
            src="/register-hero.jpg"
            alt="Graduation cap and books"
            className="mx-auto mt-6 w-full max-w-[280px] object-contain xl:mt-8 xl:max-w-[320px]"
          />
        </div>
      </aside>

      <section className="relative flex h-full min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden px-4 sm:px-6">
        <div className="w-full max-w-[420px] py-2">
          <h1 className="text-center text-2xl font-bold text-[#0F172A] xl:text-3xl">Create your account</h1>
          <p className="mt-1 text-center text-sm text-[#64748B]">Join thousands of learners and start learning smarter with AI.</p>
          <form
            className="mt-4 space-y-2"
            onSubmit={form.handleSubmit(async (values) => {
              try {
                const user = await signup({
                  fullName: values.fullName,
                  email: values.email,
                  password: values.password,
                  confirmPassword: values.confirmPassword,
                });
                toast.success("Account created");
                navigate(redirectFor(user.role));
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Registration failed");
              }
            })}
          >
            <div>
              <Label className="mb-1 font-bold text-[#0F172A]">Full name</Label>
              <IconInput icon={UserRound} tone="purple" placeholder="Enter your full name" autoComplete="name" {...form.register("fullName")} />
              <FieldError>{form.formState.errors.fullName?.message}</FieldError>
            </div>
            <div>
              <Label className="mb-1 font-bold text-[#0F172A]">Email address</Label>
              <IconInput icon={MailCheck} tone="blue" type="email" placeholder="Enter your email" autoComplete="email" {...form.register("email")} />
              <FieldError>{form.formState.errors.email?.message}</FieldError>
            </div>
            <div>
              <Label className="mb-1 font-bold text-[#0F172A]">Password</Label>
              <div className="relative">
                <FieldIcon icon={KeyRound} tone="teal" />
                <Input
                  className={cn("h-10 pr-10", fieldWithIconPad)}
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="new-password"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#7C3AED]"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <FieldError>{form.formState.errors.password?.message}</FieldError>
            </div>
            <div>
              <Label className="mb-1 font-bold text-[#0F172A]">Confirm password</Label>
              <div className="relative">
                <FieldIcon icon={ShieldCheck} tone="amber" />
                <Input
                  className={cn("h-10 pr-10", fieldWithIconPad)}
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  {...form.register("confirmPassword")}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#7C3AED]"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <FieldError>{form.formState.errors.confirmPassword?.message}</FieldError>
            </div>
            <label className="flex items-center gap-2 text-sm text-[#334155]">
              <input type="checkbox" {...form.register("terms")} className="h-4 w-4 accent-[#7C3AED]" />
              I agree to the terms and conditions
            </label>
            <FieldError>{form.formState.errors.terms?.message}</FieldError>
            <Button
              variant="gradient"
              className="group h-11 w-full rounded-[5px]"
              type="submit"
              disabled={form.formState.isSubmitting}
            >
              Sign up
              <UserPlus className="h-4 w-4 transition group-hover:scale-110" strokeWidth={2.25} />
            </Button>
            <p className="pt-2 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link className="font-bold text-[#7C3AED]" to="/login">
                Log in
              </Link>
            </p>
          </form>
        </div>
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
        <Button className="w-full" type="submit">
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
        <Button className="w-full" type="submit">
          Update password
        </Button>
      </form>
    </AuthShell>
  );
}

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-[calc(100dvh-5rem)] place-items-center bg-gradient-to-br from-indigo-50 to-violet-50 px-4 py-10">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <div className="mb-4 flex justify-center">
            <BrandLink />
          </div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
        </div>
        {children}
      </Card>
    </div>
  );
}
