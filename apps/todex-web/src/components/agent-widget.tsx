"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button, cn } from "@repo/ui";

import { todexClient } from "@lib/todex-client";

export function AgentWidget() {
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const createConversation = useCreateConversation(setConversationId);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[4000] flex flex-col items-end gap-3">
      {open ? (
        <section
          role="dialog"
          aria-label="Agent"
          className="pointer-events-auto flex h-[min(36rem,calc(100vh-6.5rem))] w-[22.5rem] flex-col overflow-hidden rounded-2xl border border-border bg-panel shadow-2xl"
        >
          {conversationId ? (
            <AgentThread
              key={conversationId}
              conversationId={conversationId}
              creating={createConversation.isPending}
              onBack={() => setConversationId(null)}
              onNew={() => createConversation.mutate()}
            />
          ) : (
            <AgentConversationList
              creating={createConversation.isPending}
              onOpen={setConversationId}
              onNew={() => createConversation.mutate()}
            />
          )}
        </section>
      ) : null}
      <button
        type="button"
        aria-label={open ? "Close agent" : "Open agent"}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/10 transition-transform hover:scale-105"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- same static mark as the header */}
        <img src="/logo.svg" alt="" width={40} height={40} className="h-10 w-10" />
      </button>
    </div>
  );
}

function AgentConversationList({
  creating,
  onOpen,
  onNew,
}: {
  creating: boolean;
  onOpen: (conversationId: string) => void;
  onNew: () => void;
}) {
  const queryClient = useQueryClient();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const conversations = useQuery({
    queryKey: ["agent", "conversations"],
    queryFn: () => todexClient.agent.conversations.list(),
  });
  const remove = useMutation({
    mutationFn: (conversationId: string) => todexClient.agent.conversations.remove(conversationId),
    onSuccess: async () => {
      setConfirmId(null);
      await queryClient.invalidateQueries({ queryKey: ["agent", "conversations"] });
    },
    onError: (error) => toast.error(readError(error)),
  });

  return (
    <>
      <WidgetHeader title="Chats" />
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {conversations.isLoading ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">Loading chats…</p>
        ) : null}
        {conversations.isError ? (
          <p className="px-2 py-6 text-center text-sm text-destructive">{readError(conversations.error)}</p>
        ) : null}
        {conversations.data?.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            No chats yet. Start one and ask about your tasks.
          </p>
        ) : null}
        <ul className="flex flex-col gap-1">
          {conversations.data?.map((conversation) => (
            <li key={conversation.id}>
              <div className="flex items-center gap-1 rounded-lg hover:bg-white/5">
                <button
                  type="button"
                  onClick={() => onOpen(conversation.id)}
                  className="min-w-0 flex-1 px-2 py-2 text-left"
                >
                  <span className="block truncate text-sm">
                    {conversationTitle(conversation.preview)}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {formatWhen(conversation.updatedAt)}
                  </span>
                </button>
                {confirmId === conversation.id ? (
                  <button
                    type="button"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(conversation.id)}
                    className="mr-1 shrink-0 rounded-md px-2 py-1 text-xs text-destructive hover:bg-white/5"
                  >
                    Delete
                  </button>
                ) : (
                  <button
                    type="button"
                    aria-label="Delete chat"
                    onClick={() => setConfirmId(conversation.id)}
                    className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t border-border p-3">
        <Button className="w-full" disabled={creating} onClick={onNew}>
          New chat
        </Button>
      </div>
    </>
  );
}

function AgentThread({
  conversationId,
  creating,
  onBack,
  onNew,
}: {
  conversationId: string;
  creating: boolean;
  onBack: () => void;
  onNew: () => void;
}) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const conversation = useQuery({
    queryKey: ["agent", "conversation", conversationId],
    queryFn: () => todexClient.agent.conversations.get(conversationId),
  });
  const job = useQuery({
    queryKey: ["agent", "job", jobId],
    queryFn: () => todexClient.agent.jobs.get(jobId ?? ""),
    enabled: Boolean(jobId),
    refetchOnWindowFocus: false,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "pending" || status === "running") return 1200;
      return false;
    },
  });
  const jobStatus = job.data?.status;
  const activeJobId = job.data?.id;
  const working = jobStatus === "pending" || jobStatus === "running";
  const postMessage = useMutation({
    mutationFn: (message: string) =>
      todexClient.agent.conversations.postMessage(conversationId, message),
    onSuccess: async (accepted) => {
      setDraft("");
      setJobId(accepted.jobId);
      await queryClient.invalidateQueries({
        queryKey: ["agent", "conversation", conversationId],
      });
    },
    onError: (error) => toast.error(readError(error)),
  });

  useEffect(() => {
    if (!activeJobId || (jobStatus !== "completed" && jobStatus !== "failed")) return;
    void queryClient.invalidateQueries({
      queryKey: ["agent", "conversation", conversationId],
    });
    void queryClient.invalidateQueries({ queryKey: ["agent", "conversations"] });
    if (jobStatus === "completed") {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    }
  }, [activeJobId, conversationId, jobStatus, queryClient]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollTop = scroller.scrollHeight;
  }, [conversation.data?.messages, working]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || postMessage.isPending || working) return;
    postMessage.mutate(message);
  }

  const title = conversationTitle(
    conversation.data?.messages.find((message) => message.role === "user")?.content,
  );

  return (
    <>
      <WidgetHeader
        title={title}
        onBack={onBack}
        action={
          <button
            type="button"
            disabled={creating}
            onClick={onNew}
            className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-white/5 hover:text-foreground disabled:opacity-50"
          >
            New
          </button>
        }
      />
      <div ref={scrollerRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {conversation.isLoading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
        ) : null}
        {conversation.data?.messages.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Ask the agent to list, create, or update tasks.
          </p>
        ) : null}
        {conversation.data?.messages.map((message) => (
          <AgentMessage key={message.id} message={message} />
        ))}
        {working ? (
          <p className="text-sm text-muted-foreground">Working…</p>
        ) : null}
        {job.data?.status === "failed" ? (
          <p className="text-sm text-destructive">
            {job.data.errorMessage ?? job.data.run?.errorMessage ?? "The run failed."}
          </p>
        ) : null}
      </div>
      <form onSubmit={onSubmit} className="border-t border-border p-3">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.shiftKey) return;
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }}
          rows={2}
          placeholder="Message"
          disabled={postMessage.isPending || working}
          className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
        />
        <div className="mt-2 flex justify-end">
          <Button type="submit" size="sm" disabled={postMessage.isPending || working || !draft.trim()}>
            Send
          </Button>
        </div>
      </form>
    </>
  );
}

function WidgetHeader({
  title,
  onBack,
  action,
}: {
  title: string;
  onBack?: () => void;
  action?: ReactNode;
}) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-1 border-b border-border px-2">
      {onBack ? (
        <button
          type="button"
          aria-label="Back to chats"
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-white/5 hover:text-foreground"
        >
          <BackIcon />
        </button>
      ) : (
        <span className="w-2" />
      )}
      <h2 className="min-w-0 flex-1 truncate text-sm font-medium">{title}</h2>
      {action}
    </header>
  );
}

function AgentMessage({ message }: { message: AgentMessageView }) {
  if (message.role === "tool") return null;
  const names = toolNames(message.toolCalls);
  if (message.role !== "user" && !message.content.trim() && names.length === 0) return null;

  return (
    <div className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
          message.role === "user" ? "bg-white text-neutral-950" : "bg-surface text-foreground",
        )}
      >
        {message.content.trim() ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : null}
        {names.length > 0 ? (
          <p className={cn("text-xs text-muted-foreground", message.content.trim() && "mt-1")}>
            {names.join(", ")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function useCreateConversation(onCreated: (conversationId: string) => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => todexClient.agent.conversations.create(),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ["agent", "conversations"] });
      onCreated(created.id);
    },
    onError: (error) => toast.error(readError(error)),
  });
}

function conversationTitle(preview: string | null | undefined) {
  const text = preview?.replace(/\s+/g, " ").trim();
  if (!text) return "New chat";
  return text.length > 72 ? `${text.slice(0, 72)}…` : text;
}

function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toolNames(toolCalls: unknown) {
  if (!Array.isArray(toolCalls)) return [];
  return toolCalls.flatMap((call) => {
    if (!call || typeof call !== "object" || !("name" in call)) return [];
    return typeof call.name === "string" ? [call.name] : [];
  });
}

function readError(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M15 6 9 12l6 6" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M5 7h14M9 7V5h6v2M8 7l1 12h6l1-12" />
    </svg>
  );
}

interface AgentMessageView {
  id: string;
  role: string;
  content: string;
  toolCalls: unknown;
}
