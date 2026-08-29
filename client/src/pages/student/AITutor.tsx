import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Mic, Plus, Send, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared";
import { MarkdownBody } from "@/components/MarkdownBody";
import { toast } from "sonner";

type Conversation = { _id: string; title: string; updatedAt: string };
type ChatMessage = { _id: string; senderType: "student" | "ai"; message: string };

function groupLabel(date: string) {
  const d = new Date(date);
  const today = new Date();
  const yest = new Date(Date.now() - 86400000);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return "Older";
}

export function StudentAITutorPage() {
  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border border-line bg-white">
      <AIChatPanel />
    </div>
  );
}

export function AIChatPanel({ courseId, lessonId, quizId }: { courseId?: string; lessonId?: string; quizId?: string }) {
  const qc = useQueryClient();
  const [active, setActive] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [renameId, setRenameId] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  const convos = useQuery({
    queryKey: ["ai-convos"],
    queryFn: async () => (await api.get("/ai/conversations")).data.data as Conversation[],
  });
  const thread = useQuery({
    queryKey: ["ai-thread", active],
    enabled: Boolean(active),
    queryFn: async () => (await api.get(`/ai/conversations/${active}`)).data.data as { messages: ChatMessage[] },
  });

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.data]);

  const create = useMutation({
    mutationFn: () => api.post("/ai/conversations", { course: courseId, lesson: lessonId, quiz: quizId }),
    onSuccess: (res) => {
      setActive(res.data.data._id);
      qc.invalidateQueries({ queryKey: ["ai-convos"] });
    },
  });

  const send = useMutation({
    mutationFn: ({ conversationId, message }: { conversationId: string; message: string }) =>
      api.post(`/ai/conversations/${conversationId}/messages`, { message }),
    onSuccess: (_res, vars) => {
      setText("");
      setActive(vars.conversationId);
      qc.invalidateQueries({ queryKey: ["ai-thread", vars.conversationId] });
      qc.invalidateQueries({ queryKey: ["ai-convos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function ensureConversation() {
    if (active) return active;
    const res = await api.post("/ai/conversations", { course: courseId, lesson: lessonId, quiz: quizId });
    const id = res.data.data._id as string;
    setActive(id);
    await qc.invalidateQueries({ queryKey: ["ai-convos"] });
    return id;
  }

  async function ask(message: string) {
    const conversationId = await ensureConversation();
    send.mutate({ conversationId, message });
  }

  const grouped = (convos.data || []).reduce<Record<string, Conversation[]>>((acc, c) => {
    const g = groupLabel(c.updatedAt);
    acc[g] = acc[g] || [];
    acc[g].push(c);
    return acc;
  }, {});

  const prompts = ["Explain simply", "Give an example", "Quiz me", "Help me understand", "Explain my mistake"];

  return (
    <div className="flex h-full min-h-[28rem] w-full">
      <aside className="hidden w-64 shrink-0 border-r border-line md:block">
        <div className="flex items-center justify-between p-3">
          <p className="text-sm font-semibold">Conversations</p>
          <button aria-label="New conversation" onClick={() => create.mutate()}>
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="h-[calc(100%-3rem)] overflow-auto px-2">
          {!convos.data?.length ? (
            <p className="p-3 text-xs text-muted">No AI conversations yet.</p>
          ) : (
            Object.entries(grouped).map(([label, items]) => (
              <div key={label} className="mb-3">
                <p className="px-2 text-[11px] uppercase text-muted">{label}</p>
                {items.map((c) => (
                  <div key={c._id} className={`group mb-1 flex items-center rounded-lg ${active === c._id ? "bg-ai-soft" : "hover:bg-slate-50"}`}>
                    <button className="flex-1 truncate px-2 py-2 text-left text-sm" onClick={() => setActive(c._id)}>
                      {renameId === c._id ? (
                        <input
                          className="w-full rounded-[5px] border border-line px-1 font-bold outline-none hover:border-[#7C3AED] focus:border-[#7C3AED]"
                          defaultValue={c.title}
                          autoFocus
                          onBlur={async (e) => {
                            await api.patch(`/ai/conversations/${c._id}`, { title: e.target.value });
                            setRenameId(null);
                            qc.invalidateQueries({ queryKey: ["ai-convos"] });
                          }}
                        />
                      ) : (
                        c.title
                      )}
                    </button>
                    <button className="hidden px-1 group-hover:block" onClick={() => setRenameId(c._id)} aria-label="Rename">
                      ✎
                    </button>
                    <button
                      className="hidden px-2 group-hover:block"
                      aria-label="Delete conversation"
                      onClick={async () => {
                        await api.delete(`/ai/conversations/${c._id}`);
                        if (active === c._id) setActive(null);
                        qc.invalidateQueries({ queryKey: ["ai-convos"] });
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </aside>
      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-line px-5 py-4">
          <img src="/logo.png" alt="" className="h-10 w-10 rounded-xl object-cover" />
          <div>
            <h2 className="font-semibold">AI Tutor</h2>
            <p className="text-sm text-muted">Your personal learning assistant</p>
          </div>
        </header>
        <div className="flex-1 space-y-4 overflow-auto p-5">
          {!active ? (
            <EmptyState
              title="Start a conversation"
              description="Ask about the current lesson, request an example, or get a practice question."
              action={
                <Button variant="ai" onClick={() => create.mutate()}>
                  New conversation
                </Button>
              }
            />
          ) : (
            (thread.data?.messages || []).map((m) => (
              <div key={m._id} className={`flex ${m.senderType === "student" ? "justify-end" : "justify-start"} gap-2`}>
                {m.senderType === "ai" ? (
                  <img src="/logo.png" alt="" className="mt-1 h-8 w-8 rounded-lg object-cover" />
                ) : null}
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${m.senderType === "student" ? "bg-primary text-white" : "bg-slate-100"}`}>
                  {m.senderType === "ai" ? <MarkdownBody>{m.message}</MarkdownBody> : m.message}
                </div>
              </div>
            ))
          )}
          <div ref={bottom} />
        </div>
        <div className="border-t border-line p-4">
          <div className="mb-2 flex flex-wrap gap-2">
            {prompts.map((p) => (
              <button
                key={p}
                className="rounded-full border border-line px-3 py-1 text-xs hover:border-ai"
                onClick={() => void ask(p)}
              >
                {p}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!text.trim()) return;
              void ask(text);
            }}
          >
            <input
              className="h-11 flex-1 rounded-[5px] border border-line px-3 text-sm font-bold outline-none hover:border-[#7C3AED] focus:border-[#7C3AED]"
              placeholder="Ask anything about this lesson..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              aria-label="Message the AI Tutor"
            />
            <Button type="button" variant="secondary" size="icon" aria-label="Voice input" onClick={() => toast.message("Voice input is available when the browser speech API is enabled.")}>
              <Mic className="h-4 w-4" />
            </Button>
            <Button type="submit" variant="ai" disabled={send.isPending}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
