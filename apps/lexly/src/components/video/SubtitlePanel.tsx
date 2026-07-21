"use client";

import type { TranscriptCue } from "@/server/services/youtube/youtube-transcript.service";

export function SubtitlePanel({
  cues,
  activeCue,
  onCueSelect,
  onWordSelect,
}: {
  cues: TranscriptCue[];
  activeCue: TranscriptCue | null;
  onCueSelect: (cue: TranscriptCue) => void;
  onWordSelect: (args: {
    wordDisplay: string;
    wordLemma: string;
    contextSentence: string;
    cue: TranscriptCue;
  }) => void;
}) {
  return (
    <div className="h-full rounded-2xl border border-[var(--border)] bg-white/60 p-3">
      <div className="flex items-center justify-between pb-2">
        <h3 className="text-xs font-semibold text-[var(--muted)]">Subtitles</h3>
      </div>

      <div className="max-h-[520px] overflow-auto pr-1">
        <div className="space-y-2">
          {cues.map((cue) => {
            const isActive = activeCue?.startMs === cue.startMs;

            return (
              <CueRow
                key={`${cue.startMs}-${cue.durationMs}`}
                cue={cue}
                isActive={isActive}
                onCueSelect={onCueSelect}
                onWordSelect={onWordSelect}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

type CueRowProps = {
  cue: TranscriptCue;
  isActive: boolean;
  onCueSelect: (cue: TranscriptCue) => void;
  onWordSelect: (args: {
    wordDisplay: string;
    wordLemma: string;
    contextSentence: string;
    cue: TranscriptCue;
  }) => void;
};

function CueRow({
  cue,
  isActive,
  onCueSelect,
  onWordSelect,
}: CueRowProps) {
  return (
    <div
      className={[
        "rounded-xl border p-3 text-sm leading-6 transition-colors",
        isActive
          ? "border-[var(--primary)] bg-white shadow-sm"
          : "border-transparent bg-transparent hover:border-[var(--border)]",
      ].join(" ")}
      onClick={() => onCueSelect(cue)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onCueSelect(cue);
      }}
    >
      <CueText
        text={cue.text}
        contextSentence={cue.text}
        cue={cue}
        onWordSelect={onWordSelect}
      />
    </div>
  );
}

function CueText({
  text,
  contextSentence,
  cue,
  onWordSelect,
}: {
  text: string;
  contextSentence: string;
  cue: TranscriptCue;
  onWordSelect: (args: {
    wordDisplay: string;
    wordLemma: string;
    contextSentence: string;
    cue: TranscriptCue;
  }) => void;
}) {
  const tokens = tokenizeCueText(text);

  return (
    <span className="break-words">
      {tokens.map((token, index) => {
        if (token.type === "word") {
          return (
            <button
              key={`${token.value}-${index}`}
              type="button"
              className="mx-0.5 rounded-md px-0.5 text-[var(--primary)] hover:bg-[var(--primary)]/10 focus:outline-none"
              onClick={(event) => {
                event.stopPropagation();
                if (!token.lemma) return;

                onWordSelect({
                  wordDisplay: token.value,
                  wordLemma: token.lemma,
                  contextSentence,
                  cue,
                });
              }}
            >
              {token.value}
            </button>
          );
        }

        return (
          <span key={`${token.value}-${index}`} className={token.type === "space" ? "" : "text-[var(--foreground)]/70"}>
            {token.value}
          </span>
        );
      })}
    </span>
  );
}

type Token =
  | { type: "word"; value: string; lemma: string | null }
  | { type: "space"; value: string }
  | { type: "text"; value: string };

function tokenizeCueText(text: string): Token[] {
  const parts = text.split(/(\b[\w']+\b)/g);

  const tokens: Token[] = [];
  for (const part of parts) {
    if (!part) continue;

    if (/^\b[\w']+\b$/.test(part)) {
      const lemma = sanitizeLemma(part);
      tokens.push({ type: "word", value: part, lemma });
      continue;
    }

    if (part === " ") {
      tokens.push({ type: "space", value: part });
      continue;
    }

    tokens.push({ type: "text", value: part });
  }

  return tokens;
}

function sanitizeLemma(word: string): string | null {
  const cleaned = word.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  if (!cleaned) return null;
  return cleaned;
}

