import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  BrainCircuit,
  ChevronRight,
  GraduationCap,
  Headphones,
  Headset,
  LayoutDashboard,
  Lock,
  MailCheck,
  MessageSquare,
  MessagesSquare,
  PhoneCall,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { fieldClass, FieldIcon, fieldWithIconPad, textareaClass } from "@/components/ui/field";

export function ContactPage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const chatTo = user?.role === "student" ? "/student/ai-tutor" : user ? "/admin/dashboard" : "/login";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      await api.post("/contact", {
        fullName,
        email,
        subject: "Contact form inquiry",
        message,
      });
      toast.success("Message sent. We will get back to you soon.");
      setFullName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send message.");
    } finally {
      setSending(false);
    }
  }

  const contacts = [
    { Icon: MailCheck, t: "Email Us", d: "support@edututor.ai", href: "mailto:support@edututor.ai", wrap: "contact-icon contact-icon-purple bg-[#EDE9FE] text-[#7C3AED]" },
    { Icon: PhoneCall, t: "Call Us", d: "+1 (555) 120-4488", href: "tel:+15551204488", wrap: "contact-icon contact-icon-green bg-[#DCFCE7] text-[#16A34A]" },
    { Icon: MessagesSquare, t: "Live Chat", d: "Available 24/7 with AI Tutor", href: chatTo, wrap: "contact-icon contact-icon-blue bg-[#DBEAFE] text-[#2563EB]" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#F5F3FF] via-white to-[#EEF2FF] px-5 py-8 sm:px-8">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-[#DDD6FE]/50 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-[#C4B5FD]/25 blur-3xl" />
        <div className="relative grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#EDE9FE] px-3.5 py-1.5 text-sm font-bold text-[#6D28D9]">
              <Headphones className="h-4 w-4" strokeWidth={2.4} />
              We're Here to Help
            </span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-[#0F172A] sm:text-5xl">
              Contact <span className="bg-gradient-to-r from-[#7C3AED] to-[#2563EB] bg-clip-text text-transparent">Us</span>
            </h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-500">
              Questions about Interactive Ai learing tutor system? Reach the team anytime for courses, quizzes, or your AI tutor.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { Icon: LayoutDashboard, t: "Admin Control",   d: "Full platform & content management",  wrap: "bg-[#FFEDD5] text-[#EA580C]" },
                { Icon: GraduationCap,   t: "Student Learning", d: "Courses, quizzes & progress tracking", wrap: "bg-[#DCFCE7] text-[#16A34A]" },
                { Icon: BrainCircuit,    t: "AI Tutor",         d: "24/7 intelligent personalized help",  wrap: "bg-[#EDE9FE] text-[#7C3AED]" },
              ].map(({ Icon, t, d, wrap }) => (
                <div key={t} className="group/card flex flex-col items-center justify-center gap-2.5 rounded-2xl bg-white px-4 py-4 text-center shadow-[0_8px_22px_rgba(15,23,42,0.06)] min-h-[100px]">
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-all duration-300 group-hover/card:scale-110 group-hover/card:rotate-6 group-hover/card:shadow-lg ${wrap}`}>
                    <Icon className="h-5 w-5" strokeWidth={2.2} />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[#0F172A] whitespace-nowrap">{t}</p>
                    <p className="mt-0.5 text-xs text-slate-500 leading-snug">{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative flex justify-center lg:justify-end">
            <img
              src="/contact-hero.png"
              alt="Student chatting with an AI tutor while sending a message"
              className="relative z-10 h-auto w-full max-w-[32rem] object-contain object-center mix-blend-multiply"
              style={{ background: "transparent" }}
            />
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-3xl bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] sm:p-8">
        <div className="flex w-full flex-col gap-8 lg:flex-row lg:items-stretch lg:gap-10">
          <div className="flex w-full min-w-0 flex-1 flex-col">
            <h2 className="text-2xl font-bold text-[#111827]">Get in Touch</h2>
            <p className="mt-1 text-sm text-slate-500">We are always here to help you.</p>
            <div className="mt-5 flex w-full flex-col gap-3">
              {contacts.map(({ Icon, t, d, href, wrap }) => {
                const className =
                  "group/touch flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-[#FAF8FF] px-3 py-3 transition hover:border-[#DDD6FE] hover:bg-[#F5F3FF]";
                  const body = (
                    <>
                      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${wrap}`}>
                        <Icon className="h-5 w-5" strokeWidth={2.2} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold text-[#111827]">{t}</span>
                        <span className="block truncate text-sm text-slate-500">{d}</span>
                      </span>
                      <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:text-[#7C3AED]" />
                    </>
                  );
                  return href.startsWith("mailto:") || href.startsWith("tel:") ? (
                    <a key={t} href={href} className={className}>
                      {body}
                    </a>
                  ) : (
                    <Link key={t} to={href} className={className}>
                      {body}
                    </Link>
                  );
                })}
              </div>
              <div className="group/touch mt-5 flex w-full flex-col gap-3 rounded-2xl bg-[#F3EEFF] p-3 sm:flex-row sm:items-center">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#2563EB] text-white shadow-md">
                  <BrainCircuit className="h-5 w-5" strokeWidth={2.2} />
                </span>
                <p className="min-w-0 flex-1 text-sm font-semibold text-[#4C1D95]">Need immediate help? Chat with our AI Tutor now</p>
                <Link
                  to={chatTo}
                  className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-[#7C3AED] px-3.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(124,58,237,0.28)] hover:bg-[#6D28D9]"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Open Live Chat
                </Link>
              </div>
            </div>

          <div className="flex w-full min-w-0 flex-1 flex-col">
            <h2 className="text-2xl font-bold text-[#111827]">Send us a Message</h2>
            <p className="mt-1 text-sm text-slate-500">Fill out the form below and we'll get back to you.</p>
            <form onSubmit={onSubmit} className="mt-5 flex w-full flex-1 flex-col gap-3">
              <div className="grid w-full gap-3 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                    Full Name
                    <span className="relative">
                      <FieldIcon icon={UserRound} tone="purple" />
                      <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className={`${fieldClass} ${fieldWithIconPad} bg-[#F8FAFC] focus:bg-white`} placeholder="Your name" />
                    </span>
                  </label>
                  <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                    Email Address
                    <span className="relative">
                      <FieldIcon icon={MailCheck} tone="blue" />
                      <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${fieldClass} ${fieldWithIconPad} bg-[#F8FAFC] focus:bg-white`} placeholder="you@email.com" />
                    </span>
                  </label>
              </div>
              <label className="grid w-full gap-1.5 text-sm font-semibold text-slate-700">
                Message
                  <span className="relative">
                    <FieldIcon icon={MessageSquare} tone="teal" align="top" />
                    <textarea
                      required
                      minLength={10}
                      maxLength={500}
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="How can we help you learn better?"
                      className={`${textareaClass} ${fieldWithIconPad} bg-[#F8FAFC] py-2.5 pr-3 focus:bg-white`}
                    />
                    <span className="pointer-events-none absolute right-3 bottom-2 text-xs text-slate-400">{message.length} / 500</span>
                  </span>
              </label>
              <button
                type="submit"
                disabled={sending}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] text-base font-bold text-white shadow-[0_10px_24px_rgba(124,58,237,0.28)] hover:bg-[#6D28D9] disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {sending ? "Sending..." : "Send Message"}
              </button>
              <p className="flex w-full items-center justify-center gap-1.5 text-xs font-medium text-slate-400">
                <Lock className="h-3.5 w-3.5" />
                Your information is safe and will never be shared
              </p>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
