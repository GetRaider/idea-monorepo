import { useEffect, useState } from "react";

import type { Action, HubState, Provider } from "../../shared";

export function App() {
  const [state, setState] = useState<HubState | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    const unsubscribe = window.airove.subscribe((next) => {
      if (active) setState(next);
    });
    window.airove
      .getState()
      .then((next) => {
        if (active) setState(next);
      })
      .catch(() => setError("Cannot connect to Airove. Restart the app."));
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);
  const run = (operation: Promise<unknown>) =>
    operation.catch(() => setError("The action failed. Try again."));
  const select = (provider: Provider) => {
    setError(null);
    void run(window.airove.select(provider));
  };
  const navigate = (action: Action) => {
    setError(null);
    void run(window.airove.navigate(action));
  };
  const current = state?.providers[state.selected];
  return (
    <header className="flex h-[104px] flex-col gap-2 border-b border-zinc-700 px-4 py-2">
      <div className="flex items-center gap-2">
        <span className="mr-4 font-semibold">
          airove <span className="text-xs font-normal text-zinc-400">POC</span>
        </span>
        <div role="group" aria-label="AI providers">
          {(["chatgpt", "claude"] as const).map((provider) => (
            <button
              key={provider}
              aria-pressed={state?.selected === provider}
              className={state?.selected === provider ? "bg-zinc-700" : ""}
              onClick={() => select(provider)}
            >
              {provider === "chatgpt" ? "ChatGPT" : "Claude"}
            </button>
          ))}
        </div>
        <button disabled={!current?.canGoBack} onClick={() => navigate("back")}>
          Back
        </button>
        <button
          disabled={!current?.canGoForward}
          onClick={() => navigate("forward")}
        >
          Forward
        </button>
        <button disabled={!current} onClick={() => navigate("reload")}>
          Reload
        </button>
        <button disabled={!current} onClick={() => navigate("external")}>
          Open in browser ↗
        </button>
      </div>
      <div
        className="flex min-w-0 items-center gap-3 text-xs text-zinc-400"
        role="status"
        aria-live="polite"
      >
        <span className="truncate" title={current?.title}>
          {current?.url ?? "Starting…"}
        </span>
        <span className="shrink-0">
          {current?.loading ? "Loading…" : "Ready"}
          {current?.conversation ? " · Conversation" : ""}
        </span>
        {(error || current?.error) && (
          <span className="truncate text-red-300">
            {error || current?.error}
          </span>
        )}
      </div>
    </header>
  );
}
