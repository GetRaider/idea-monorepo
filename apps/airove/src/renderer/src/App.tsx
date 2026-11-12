import { useEffect, useState } from "react";

import type { Action, HubState, Provider } from "../../shared";
import { Sidebar } from "./Sidebar";

export function App() {
  const [state, setState] = useState<HubState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
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
  const current = state?.providers[state.selected];
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
                void run(() => window.airove.newChat());
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
          {(error || state?.metadataError || current?.error) && (
            <p role="alert" className="truncate text-xs text-red-300">
              {error || state?.metadataError || current?.error}
            </p>
          )}
        </header>
      </main>
    </div>
  );
}
