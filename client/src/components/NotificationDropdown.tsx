import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import type { NotificationItem } from "@/types";
import { formatDate } from "@/lib/utils";

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await api.get("/notifications")).data.data as { items: NotificationItem[]; unread: number },
    refetchInterval: 12000,
  });
  const mark = useMutation({
    mutationFn: () => api.post("/notifications/read"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div className="relative">
      <button
        className="relative grid h-10 w-10 place-items-center rounded-xl border border-line bg-white"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="h-4 w-4" />
        {data?.unread ? (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1 text-[10px] text-white">
            {data.unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            <button className="text-xs text-primary" onClick={() => mark.mutate()}>
              Mark all read
            </button>
          </div>
          <div className="max-h-80 overflow-auto">
            {!data?.items.length ? (
              <p className="p-4 text-sm text-muted">No notifications yet.</p>
            ) : (
              data.items.map((n) => (
                <Link
                  key={n._id}
                  to={n.link || "#"}
                  className={`block border-b border-line px-4 py-3 text-sm hover:bg-slate-50 ${n.read ? "opacity-70" : ""}`}
                  onClick={() => setOpen(false)}
                >
                  <p className="font-medium">{n.title}</p>
                  <p className="text-muted">{n.message}</p>
                  <p className="mt-1 text-xs text-slate-400">{formatDate(n.createdAt)}</p>
                </Link>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
