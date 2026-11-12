// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDictation } from "./useDictation";

let root: Root;
let container: HTMLDivElement;
let dictation: ReturnType<typeof useDictation>;
let microphone: ReturnType<typeof vi.fn>;
let stopTrack: ReturnType<typeof vi.fn>;
let getUserMedia: ReturnType<typeof vi.fn>;
let onTranscript: ReturnType<typeof vi.fn>;

function Harness() {
  dictation = useDictation(onTranscript);
  return <span>{dictation.phase}</span>;
}

beforeEach(async () => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  microphone = vi.fn(async () => true);
  window.airove = {
    requestMicrophone: microphone,
  } as unknown as Window["airove"];
  stopTrack = vi.fn();
  getUserMedia = vi.fn(async () => ({
    getTracks: () => [{ stop: stopTrack }],
  }));
  vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
  vi.stubGlobal("MediaRecorder", FakeRecorder);
  onTranscript = vi.fn();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(<Harness />));
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

class FakeRecorder {
  state = "inactive";
  mimeType = "audio/webm";
  ondataavailable?: (event: { data: Blob }) => void;
  onstop?: () => void;
  onerror?: () => void;
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    this.onstop?.();
  }
}

describe("local dictation lifecycle", () => {
  it("requests permission before opening an audio-only stream and releases it on Cancel", async () => {
    await act(async () => dictation.start());
    expect(microphone).toHaveBeenCalledOnce();
    expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(dictation.phase).toBe("recording");
    await act(async () => dictation.cancel());
    expect(stopTrack).toHaveBeenCalled();
    expect(dictation.phase).toBe("idle");
    expect(onTranscript).not.toHaveBeenCalled();
  });
  it("keeps typing available when microphone permission is denied", async () => {
    microphone.mockResolvedValueOnce(false);
    await act(async () => dictation.start());
    expect(getUserMedia).not.toHaveBeenCalled();
    expect(dictation.phase).toBe("idle");
    expect(dictation.error).toContain("Microphone access is unavailable");
  });
  it("releases a late stream when the user cancels while permission is resolving", async () => {
    let resolveStream!: (value: {
      getTracks: () => { stop: typeof stopTrack }[];
    }) => void;
    getUserMedia.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveStream = resolve;
        }),
    );
    let starting!: Promise<void>;
    await act(async () => {
      starting = dictation.start();
      await Promise.resolve();
    });
    await act(async () => dictation.cancel());
    await act(async () => {
      resolveStream({ getTracks: () => [{ stop: stopTrack }] });
      await starting;
    });
    expect(stopTrack).toHaveBeenCalled();
    expect(dictation.phase).toBe("idle");
  });
  it("stops streams when recorder construction fails", async () => {
    vi.stubGlobal(
      "MediaRecorder",
      class {
        constructor() {
          throw new Error("Unsupported recorder");
        }
      },
    );
    await act(async () => dictation.start());
    expect(stopTrack).toHaveBeenCalled();
    expect(dictation.phase).toBe("idle");
  });
  it("stops recording when the composer unmounts", async () => {
    await act(async () => dictation.start());
    await act(async () => root.render(<div />));
    expect(stopTrack).toHaveBeenCalled();
    expect(onTranscript).not.toHaveBeenCalled();
  });
});

describe("dictation transcription handoff", () => {
  it("decodes at 16 kHz and returns worker text for review without contacting a provider", async () => {
    const terminate = vi.fn();
    const decode = vi.fn(async () => ({
      getChannelData: () => new Float32Array([0.1, 0.2]),
    }));
    const audioOptions = vi.fn();
    class AudioContextMock {
      state = "running";
      constructor(options: unknown) {
        audioOptions(options);
      }
      decodeAudioData = decode;
      close = async () => {
        this.state = "closed";
      };
    }
    class WorkerMock {
      onmessage?: (event: { data: { type: string; text: string } }) => void;
      postMessage = () => {
        queueMicrotask(() =>
          this.onmessage?.({ data: { type: "result", text: "Dictated idea" } }),
        );
      };
      terminate = terminate;
    }
    vi.stubGlobal("AudioContext", AudioContextMock);
    vi.stubGlobal("Worker", WorkerMock);
    vi.stubGlobal(
      "Blob",
      class {
        arrayBuffer = async () => new ArrayBuffer(8);
      },
    );
    await act(async () => dictation.start());
    await act(async () => {
      dictation.stop();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(audioOptions).toHaveBeenCalledWith({ sampleRate: 16000 });
    expect(onTranscript).toHaveBeenCalledWith("Dictated idea");
    expect(terminate).toHaveBeenCalled();
    expect(stopTrack).toHaveBeenCalled();
    expect(dictation.phase).toBe("idle");
  });
});
