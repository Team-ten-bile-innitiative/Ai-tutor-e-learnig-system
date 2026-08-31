import { useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Mail, UserRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FieldIcon, fieldWithIconPad, Input, Label } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export { AdminAnalyticsPage } from "./AnalyticsOverview";

function PasswordEye({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return (
    <button type="button" className="absolute right-2.5 top-1/2 z-10 -translate-y-1/2 p-0.5" onClick={onToggle} aria-label={visible ? "Hide password" : "Show password"}>
      {visible ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A9.8 9.8 0 0 1 12 5c7 0 10 7 10 7a16.5 16.5 0 0 1-3.2 4.4M6.1 6.1A16.7 16.7 0 0 0 2 12s3 7 10 7a9.8 9.8 0 0 0 4.1-.9" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="3" stroke="#2563EB" strokeWidth="2.2" />
        </svg>
      )}
    </button>
  );
}

export function AdminSettingsPage() {
  const qc = useQueryClient();
  const { refresh } = useAuth();
  const me = useQuery({ queryKey: ["me"], queryFn: async () => (await api.get("/auth/me")).data.data });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  return (
    <div>
      <PageHeader title="Settings" description="Update your administrator name and password." />
      {me.data ? (
        <Card className="w-full p-5 sm:p-6">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
            <section className="min-w-0">
              <h3 className="mb-4 text-sm font-bold text-[#0F172A]">Profile</h3>
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  setSavingProfile(true);
                  try {
                    const { data } = await api.patch("/auth/profile", {
                      fullName: String(fd.get("fullName")).trim(),
                      email: String(fd.get("email")).trim().toLowerCase(),
                    });
                    if (data?.token) localStorage.setItem("token", data.token);
                    await refresh();
                    await qc.invalidateQueries({ queryKey: ["me"] });
                    toast.success("Profile saved");
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Could not save profile");
                  } finally {
                    setSavingProfile(false);
                  }
                }}
              >
                <div>
                  <Label>Full name</Label>
                  <span className="relative mt-1 block">
                    <FieldIcon icon={UserRound} tone="blue" />
                    <Input name="fullName" defaultValue={me.data.fullName} required className={fieldWithIconPad} />
                  </span>
                </div>
                <div>
                  <Label>Work email</Label>
                  <span className="relative mt-1 block">
                    <FieldIcon icon={Mail} tone="teal" />
                    <Input name="email" type="email" defaultValue={me.data.email} required className={fieldWithIconPad} />
                  </span>
                </div>
                <Button type="submit" disabled={savingProfile}>
                  {savingProfile ? "Saving…" : "Save profile"}
                </Button>
              </form>
            </section>

            <section className="min-w-0 border-t border-line pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
              <h3 className="mb-4 text-sm font-bold text-[#0F172A]">Password</h3>
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const fd = new FormData(form);
                  setSavingPassword(true);
                  try {
                    await api.post("/auth/change-password", {
                      currentPassword: fd.get("currentPassword"),
                      newPassword: fd.get("newPassword"),
                    });
                    form.reset();
                    toast.success("Password updated");
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Could not update password");
                  } finally {
                    setSavingPassword(false);
                  }
                }}
              >
                <div>
                  <Label>Current password</Label>
                  <span className="relative mt-1 block">
                    <FieldIcon icon={KeyRound} tone="amber" />
                    <Input name="currentPassword" type={showCurrent ? "text" : "password"} placeholder="Current password" required className={cn(fieldWithIconPad, "pr-11")} />
                    <PasswordEye visible={showCurrent} onToggle={() => setShowCurrent((v) => !v)} />
                  </span>
                </div>
                <div>
                  <Label>New password</Label>
                  <span className="relative mt-1 block">
                    <FieldIcon icon={KeyRound} tone="green" />
                    <Input name="newPassword" type={showNew ? "text" : "password"} placeholder="At least 8 characters" minLength={8} required className={cn(fieldWithIconPad, "pr-11")} />
                    <PasswordEye visible={showNew} onToggle={() => setShowNew((v) => !v)} />
                  </span>
                </div>
                <Button type="submit" disabled={savingPassword}>
                  {savingPassword ? "Updating…" : "Update password"}
                </Button>
              </form>
            </section>
          </div>
        </Card>
      ) : (
        <p className="text-sm text-muted">Loading profile…</p>
      )}
    </div>
  );
}
