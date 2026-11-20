import { useEffect, useState, type FormEvent } from "react";

import type { HubState, NewChatInput, Provider } from "../../shared";
import { useDictation } from "./useDictation";

export function NewChat({ state, onContinue, onCancel }: NewChatProps) {
  const [provider, setProvider] = useState<Provider>(state.selected);
  const [spaceId, setSpaceId] = useState<string | null>(state.selectedSpaceId);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dictation = useDictation((transcript) =>
    setText((current) =>
      `${current}${current.trim() ? "\n" : ""}${transcript}`.slice(0, 32000),
    ),
  );
  useEffect(() => {
    if (spaceId && !state.library.spaces.some((space) => space.id === spaceId))
      setSpaceId(null);
  }, [spaceId, state.library.spaces]);
  const providerName = provider === "chatgpt" ? "ChatGPT" : "Claude";
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim() || dictation.phase !== "idle" || busy) return;
    setError(null);
    setBusy(true);
    try {
      await onContinue({ provider, spaceId, text });
    } catch {
      setError(
        "Could not open the provider. Your draft is still available to retry.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <section
      aria-label="New Chat"
      className="flex h-[calc(100vh-104px)] items-center justify-center overflow-y-auto bg-zinc-950 px-8 py-10"
    >
      <form onSubmit={submit} className="w-full max-w-2xl">
        <p className="mb-3 text-xs uppercase tracking-widest text-sky-400">
          A new conversation
        </p>
        <h1 className="mb-2 text-3xl font-semibold tracking-tight">
          What’s on your mind?
        </h1>
        <p className="mb-7 text-sm text-zinc-400">
          Start here. Review and send your draft in {providerName}.
        </p>
        <div className="mb-4 grid grid-cols-2 gap-4">
          <label className="text-xs text-zinc-400">
            AI
            <select
              aria-label="AI"
              disabled={busy}
              className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-sm text-white"
              value={provider}
              onChange={(event) => setProvider(event.target.value as Provider)}
            >
              <option value="chatgpt">ChatGPT</option>
              <option value="claude">Claude</option>
            </select>
          </label>
          <label className="text-xs text-zinc-400">
            Space
            <select
              aria-label="Space"
              disabled={busy}
              className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-sm text-white"
              value={spaceId ?? ""}
              onChange={(event) => {
                const id = event.target.value || null;
                setSpaceId(id);
                const preferred = state.library.spaces.find(
                  (space) => space.id === id,
                )?.preferredProvider;
                setProvider(preferred ?? state.library.lastProvider);
              }}
            >
              <option value="">No Space · All Chats</option>
              {state.library.spaces.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 focus-within:border-sky-500">
          <label className="sr-only" htmlFor="new-chat-draft">
            Your draft
          </label>
          <textarea
            id="new-chat-draft"
            autoFocus
            required
            maxLength={32000}
            disabled={busy}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Type an idea, a question, a place to start…"
            className="min-h-48 w-full resize-y bg-transparent p-5 text-base leading-relaxed text-zinc-100 outline-none placeholder:text-zinc-600"
          />
          <div className="flex items-center justify-between border-t border-zinc-800 px-3 py-2">
            <div className="flex items-center gap-2">
              {dictation.phase === "idle" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    void dictation.start();
                  }}
                >
                  🎙 Dictate
                </button>
              ) : (
                <>
                  {dictation.phase === "recording" && (
                    <button
                      type="button"
                      className="text-red-300"
                      onClick={dictation.stop}
                    >
                      Stop recording
                    </button>
                  )}
                  {dictation.phase !== "recording" && (
                    <span role="status" className="text-xs text-sky-300">
                      {dictationLabel(dictation.phase)}
                    </span>
                  )}
                  <button type="button" onClick={dictation.cancel}>
                    Cancel dictation
                  </button>
                </>
              )}
            </div>
            <span className="text-xs text-zinc-500">
              {text.length.toLocaleString()} / 32,000
            </span>
          </div>
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          Dictation is processed on your device. A speech model downloads on
          first use.
        </p>
        {(error || dictation.error) && (
          <p role="alert" className="mt-3 text-sm text-red-300">
            {error || dictation.error}
          </p>
        )}
        <div className="mt-6 flex items-center justify-between">
          <button type="button" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !text.trim() || dictation.phase !== "idle"}
            className="rounded-lg bg-sky-700 px-5 py-3 font-medium hover:bg-sky-600"
          >
            {busy ? "Opening…" : `Continue in ${providerName} →`}
          </button>
        </div>
      </form>
    </section>
  );
}

function dictationLabel(phase: string): string {
  if (phase === "permission") return "Waiting for microphone…";
  if (phase === "loading") return "Preparing speech model…";
  return "Transcribing…";
}

interface NewChatProps {
  state: HubState;
  onContinue: (input: NewChatInput) => Promise<void>;
  onCancel: () => void;
}
