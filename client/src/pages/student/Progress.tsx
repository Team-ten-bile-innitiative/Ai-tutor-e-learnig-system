import { useQuery } from "@tanstack/react-query";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Flame, Trophy } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { ErrorState, PageHeader, ProgressBar, ProgressRing, StatCard } from "@/components/shared";
import { Badge, Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import { formatMinutes } from "@/lib/utils";

export function StudentProgressPage() {
  const { data, error, refetch } = useQuery({
    queryKey: ["my-progress"],
    queryFn: async () => (await api.get("/learning/me/progress")).data.data,
  });
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;
  if (!data) return null;
  return (
    <div>
      <PageHeader title="My Progress" description="Only you can see this learning data." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-6 text-center">
          <p className="text-sm text-muted">Overall completion</p>
          <ProgressRing value={data.overall} />
        </Card>
        <StatCard label="Average score" value={`${data.averageScore}%`} icon={<Trophy className="h-5 w-5" />} />
        <StatCard
          label="Learning streak"
          value={`🔥 ${data.streak?.currentStreak || 0}`}
          hint={`Longest ${data.streak?.longestStreak || 0} · ${formatMinutes(data.studyTime)} studied`}
          icon={<Flame className="h-5 w-5" />}
        />
      </div>
      <Card className="mt-6">
        <CardHeader>
          <h3 className="font-semibold">Progress over time</h3>
        </CardHeader>
        <CardBody className="h-72">
          {data.overTime.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.overTime}>
                <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString()} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line dataKey="percentage" stroke="#4f46e5" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted">No learning activity yet.</p>
          )}
        </CardBody>
      </Card>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="font-semibold">Course completion</h3>
          </CardHeader>
          <CardBody className="space-y-3">
            {data.courseProgress.map((p: { _id: string; progressPercentage: number; course?: { title: string } }) => (
              <div key={p._id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{p.course?.title}</span>
                  <span>{p.progressPercentage}%</span>
                </div>
                <ProgressBar value={p.progressPercentage} />
              </div>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="font-semibold">Achievements</h3>
          </CardHeader>
          <CardBody className="flex flex-wrap gap-2">
            {data.achievements.length ? (
              data.achievements.map((a: { _id: string; title: string }) => (
                <Badge key={a._id} tone="violet">
                  {a.title}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted">Complete a lesson or quiz to earn your first badge.</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export function StudentProfilePage() {
  const { data } = useQuery({ queryKey: ["me"], queryFn: async () => (await api.get("/auth/me")).data.data });
  if (!data) return null;
  return (
    <div className="max-w-xl">
      <PageHeader title="Profile" description="Manage how the tutor personalizes explanations." />
      <Card className="p-6">
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            await api.patch("/auth/profile", {
              fullName: fd.get("fullName"),
              learningLevel: fd.get("learningLevel"),
              preferredLanguage: fd.get("preferredLanguage"),
            });
            toast.success("Profile saved");
          }}
        >
          <div>
            <Label>Full name</Label>
            <Input name="fullName" defaultValue={data.fullName} />
          </div>
          <div>
            <Label>Email</Label>
            <Input defaultValue={data.email} disabled />
          </div>
          <div>
            <Label>Learning level</Label>
            <Select name="learningLevel" defaultValue={data.learningLevel}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </Select>
          </div>
          <div>
            <Label>Preferred language</Label>
            <Select name="preferredLanguage" defaultValue={data.preferredLanguage}>
              <option value="en">English</option>
              <option value="ar">Arabic</option>
              <option value="fr">French</option>
            </Select>
          </div>
          <Button type="submit">Save profile</Button>
        </form>
      </Card>
    </div>
  );
}

export function StudentSettingsPage() {
  const { data } = useQuery({ queryKey: ["me"], queryFn: async () => (await api.get("/auth/me")).data.data });
  if (!data) return null;
  return (
    <div className="max-w-xl space-y-6">
      <PageHeader title="Settings" description="Password, notifications, and appearance." />
      <Card className="p-6">
        <h3 className="font-semibold">Notifications</h3>
        <form
          className="mt-4 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            await api.patch("/auth/profile", {
              notificationEmail: fd.get("notificationEmail") === "on",
              notificationInApp: fd.get("notificationInApp") === "on",
              theme: fd.get("theme"),
            });
            toast.success("Preferences saved");
          }}
        >
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="notificationEmail" defaultChecked={data.notificationEmail} /> Email notifications
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="notificationInApp" defaultChecked={data.notificationInApp} /> In-app notifications
          </label>
          <div>
            <Label>Theme</Label>
            <Select name="theme" defaultValue={data.theme}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </Select>
          </div>
          <Button type="submit">Save preferences</Button>
        </form>
      </Card>
      <Card className="p-6">
        <h3 className="font-semibold">Password</h3>
        <form
          className="mt-4 space-y-3"
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
          <Input name="currentPassword" type="password" placeholder="Current password" required />
          <Input name="newPassword" type="password" minLength={8} placeholder="New password" required />
          <Button type="submit" variant="secondary">
            Update password
          </Button>
        </form>
      </Card>
    </div>
  );
}
