import { useQuery } from "@tanstack/react-query";
import { BarChart3, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { ErrorState, PageHeader, StatCard } from "@/components/shared";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { formatDate } from "@/lib/utils";

export function AdminAnalyticsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { data, error, refetch } = useQuery({
    queryKey: ["analytics-full", from, to],
    queryFn: async () => (await api.get("/analytics/full", { params: { from, to } })).data.data,
  });
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;
  return (
    <div>
      <PageHeader title="Analytics" description="Platform-wide educational metrics. AI conversation content is not exposed here." />
      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <div>
          <Label>From</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <Label>To</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>
      {data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Students" value={data.totals.students} icon={<Users className="h-5 w-5" />} />
            <StatCard label="Active" value={data.totals.active} icon={<Users className="h-5 w-5" />} />
            <StatCard label="Enrollments" value={data.totals.enrollments} icon={<BarChart3 className="h-5 w-5" />} />
            <StatCard label="Avg score" value={`${data.averageScore}%`} icon={<BarChart3 className="h-5 w-5" />} />
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Most popular courses</h3>
              </CardHeader>
              <CardBody className="space-y-2 text-sm">
                {data.popularCourses.map((c: { title: string; enrollments: number }) => (
                  <div key={c.title} className="flex justify-between">
                    <span>{c.title}</span>
                    <span>{c.enrollments}</span>
                  </div>
                ))}
              </CardBody>
            </Card>
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Most difficult questions</h3>
              </CardHeader>
              <CardBody className="space-y-2 text-sm">
                {data.difficultQuestions.map((q: { question: string; misses: number }) => (
                  <div key={q.question}>
                    <p>{q.question}</p>
                    <p className="text-xs text-muted">{q.misses} misses</p>
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function AdminSettingsPage() {
  const { data } = useQuery({ queryKey: ["audit"], queryFn: async () => (await api.get("/settings/audit")).data.data });
  const me = useQuery({ queryKey: ["me"], queryFn: async () => (await api.get("/auth/me")).data.data });
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <PageHeader title="Settings" description="Administrator profile and system audit log." />
        {me.data ? (
          <Card className="p-5">
            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                await api.patch("/auth/profile", { fullName: String(fd.get("fullName")) });
                toast.success("Profile saved");
              }}
            >
              <div>
                <Label>Full name</Label>
                <Input name="fullName" defaultValue={me.data.fullName} />
              </div>
              <div>
                <Label>Email</Label>
                <Input defaultValue={me.data.email} disabled />
              </div>
              <Button type="submit">Save profile</Button>
            </form>
            <form
              className="mt-6 space-y-3 border-t border-line pt-4"
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                try {
                  await api.post("/auth/change-password", {
                    currentPassword: fd.get("currentPassword"),
                    newPassword: fd.get("newPassword"),
                  });
                  toast.success("Password updated");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Failed");
                }
              }}
            >
              <Label>Change password</Label>
              <Input name="currentPassword" type="password" placeholder="Current" required />
              <Input name="newPassword" type="password" placeholder="New password" minLength={8} required />
              <Button type="submit" variant="secondary">
                Update password
              </Button>
            </form>
          </Card>
        ) : null}
      </div>
      <Card>
        <CardHeader>
          <h3 className="font-semibold">Audit log</h3>
        </CardHeader>
        <CardBody className="max-h-[32rem] space-y-3 overflow-auto text-sm">
          {data?.map((l: { _id: string; action: string; entityType: string; createdAt: string; user?: { fullName: string } }) => (
            <div key={l._id} className="flex justify-between gap-3">
              <span>
                {l.user?.fullName} · {l.action} · {l.entityType}
              </span>
              <span className="text-muted">{formatDate(l.createdAt)}</span>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
