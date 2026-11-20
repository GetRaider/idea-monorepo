import { useEffect, useState } from "react";

import type {
  Action,
  HubState,
  Provider,
  NewChatInput,
  DraftStatus,
} from "../../shared";
import { NewChat } from "./NewChat";
import { Sidebar } from "./Sidebar";

export function App() {
  const [state, setState] = useState<HubState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    let active = true;
    let receivedUpdate = false;
    const unsubscribe = window.airove.subscribe((next) => {
      receivedUpdate = true;
      if (active) setState(next);
    });
    window.airove
      .getState()
      .then((next) => {
        if (active && !receivedUpdate) setState(next);
      })
      .catch(() => {
        if (active) setError("Cannot connect to Airove. Restart the app.");
      });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);
  const run = async (operation: () => Promise<unknown>) => {
    setError(null);
    setBusy(true);
    try {
      await operation();
    } catch {
      setError(
        "Could not complete this action. Check the name, selection, network and available disk space, then try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  const select = (provider: Provider) => {
    void run(() => window.airove.select(provider));
  };
  const navigate = (action: Action) => {
    void run(() => window.airove.navigate(action));
  };
  const continueDraft = async (input: NewChatInput) => {
    setBusy(true);
    setError(null);
    setCopied(false);
    try {
      await window.airove.newChat(input);
    } catch (cause) {
      setError(
        "Could not open the provider. Your draft is available to copy or retry.",
      );
      throw cause;
    } finally {
      setBusy(false);
    }
  };
  const current = state?.providers[state.selected];
  const draftStatus = state?.drafts[state.selected];
  const selectedSpace = state?.library.spaces.find(
    (space) => space.id === state.selectedSpaceId,
  );
  return (
    <div className="flex h-screen overflow-hidden">
      {state ? (
        <Sidebar state={state} busy={busy} run={run} />
      ) : (
        <aside className="w-[340px] shrink-0 p-4">Loading library…</aside>
      )}
      <main className="min-w-0 flex-1">
        <header className="flex h-[104px] flex-col gap-2 border-b border-zinc-700 px-3 py-2">
          <div className="flex items-center gap-1">
            <div role="group" aria-label="AI providers" className="flex gap-1">
              {(["chatgpt", "claude"] as const).map((provider) => (
                <button
                  key={provider}
                  disabled={busy || !state}
                  aria-pressed={state?.selected === provider}
                  className={state?.selected === provider ? "bg-zinc-700" : ""}
                  onClick={() => select(provider)}
                >
                  {provider === "chatgpt" ? "ChatGPT" : "Claude"}
                </button>
              ))}
            </div>
            <button
              disabled={busy || !state}
              className="mr-2 bg-sky-800"
              onClick={() => {
                void run(() => window.airove.showComposer(true));
              }}
            >
              New Chat
            </button>
            <button
              disabled={busy || !current?.canGoBack}
              onClick={() => navigate("back")}
            >
              Back
            </button>
            <button
              disabled={busy || !current?.canGoForward}
              onClick={() => navigate("forward")}
            >
              Forward
            </button>
            <button
              disabled={busy || !current}
              onClick={() => navigate("reload")}
            >
              Reload
            </button>
            <button
              disabled={busy || !current}
              onClick={() => navigate("external")}
            >
              Open in browser ↗
            </button>
          </div>
          <div
            className="flex min-w-0 items-center gap-3 text-xs text-zinc-400"
            role="status"
            aria-live="polite"
          >
            <span className="max-w-40 shrink-0 truncate text-zinc-200">
              {selectedSpace?.name ?? "All Chats"}
            </span>
            <span className="truncate" title={current?.title}>
              {current?.url ?? "Starting…"}
            </span>
            <span className="shrink-0">
              {current?.loading ? "Loading…" : "Ready"}
              {current?.conversation ? " · Conversation" : ""}
            </span>
          </div>
          {(error || state?.metadataError || current?.error || draftStatus) && (
            <div
              className="flex min-w-0 items-center gap-2 text-xs"
              role="status"
            >
              <p
                className="min-w-0 flex-1 truncate text-sky-200"
                role={
                  error || state?.metadataError || current?.error
                    ? "alert"
                    : undefined
                }
              >
                {error ||
                  state?.metadataError ||
                  current?.error ||
                  draftMessage(state!.selected, draftStatus!)}
              </p>
              {draftStatus && draftStatus !== "ready" && (
                <>
                  <button
                    disabled={busy}
                    onClick={() => {
                      void run(() => window.airove.retryDraft());
                    }}
                  >
                    Retry
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => {
                      void run(async () => {
                        await window.airove.copyDraft();
                        setCopied(true);
                      });
                    }}
                  >
                    {copied ? "Copied" : "Copy draft"}
                  </button>
                </>
              )}
              {draftStatus && (
                <button
                  disabled={busy}
                  aria-label="Dismiss draft handoff"
                  onClick={() => {
                    void run(() => window.airove.dismissDraft());
                  }}
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </header>
        {state?.composing && (
          <NewChat
            state={state}
            onContinue={continueDraft}
            onCancel={() => {
              void run(() => window.airove.showComposer(false));
            }}
          />
        )}
      </main>
    </div>
  );
}

function draftMessage(provider: Provider, status: DraftStatus): string {
  const name = provider === "chatgpt" ? "ChatGPT" : "Claude";
  if (status === "ready")
    return `Draft filled. Review and press Send in ${name}.`;
  if (status === "occupied")
    return `${name} already has a draft. Copy this draft to keep both.`;
  if (status === "unavailable")
    return `Could not fill ${name}. Retry or copy your draft.`;
  return `Draft waiting for ${name}. Sign in if needed, then Retry.`;
}
