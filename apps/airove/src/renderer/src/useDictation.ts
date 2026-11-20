import { useCallback, useEffect, useRef, useState } from "react";

export function useDictation(onTranscript: (text: string) => void) {
  const [phase, setPhase] = useState<DictationPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const current = useRef<{
    recorder?: MediaRecorder;
    stream?: MediaStream;
    worker?: Worker;
    audio?: AudioContext;
    cancelled: boolean;
    timer?: ReturnType<typeof setTimeout>;
  }>({ cancelled: false });
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;
  const generation = useRef(0);

  const release = useCallback(() => {
    const resources = current.current;
    resources.cancelled = true;
    if (resources.timer) clearTimeout(resources.timer);
    if (resources.recorder?.state === "recording") resources.recorder.stop();
    resources.stream?.getTracks().forEach((track) => track.stop());
    resources.worker?.terminate();
    if (resources.audio && resources.audio.state !== "closed")
      void resources.audio.close().catch(() => {});
    current.current = { cancelled: true };
  }, []);

  useEffect(
    () => () => {
      generation.current += 1;
      release();
    },
    [release],
  );

  const start = async () => {
    if (phase !== "idle") return;
    const request = ++generation.current;
    setError(null);
    setPhase("permission");
    try {
      if (!(await window.airove.requestMicrophone()))
        throw new Error("Microphone access was not granted.");
      if (generation.current !== request) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (generation.current !== request) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      const resources: typeof current.current = { stream, cancelled: false };
      current.current = resources;
      const recorder = new MediaRecorder(stream);
      resources.recorder = recorder;
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.onerror = () => {
        if (resources.cancelled) return;
        release();
        setPhase("idle");
        setError("Recording failed. Try again or type your draft.");
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        if (resources.timer) clearTimeout(resources.timer);
        if (resources.cancelled) return;
        setPhase("transcribing");
        try {
          const audio = new AudioContext({ sampleRate: 16000 });
          resources.audio = audio;
          const decoded = await audio.decodeAudioData(
            await new Blob(chunks, { type: recorder.mimeType }).arrayBuffer(),
          );
          await audio.close();
          resources.audio = undefined;
          if (resources.cancelled) return;
          const samples = decoded.getChannelData(0).slice();
          const worker = new Worker(
            new URL("./dictation.worker.ts", import.meta.url),
            { type: "module" },
          );
          resources.worker = worker;
          const finish = () => {
            worker.terminate();
            resources.worker = undefined;
            setPhase("idle");
          };
          worker.onmessage = (
            event: MessageEvent<{ type: string; text?: string }>,
          ) => {
            if (resources.cancelled) return;
            if (event.data.type === "loading") setPhase("loading");
            if (event.data.type === "transcribing") setPhase("transcribing");
            if (event.data.type === "result") {
              if (event.data.text) onTranscriptRef.current(event.data.text);
              else
                setError("No speech recognized. Try again or type your draft.");
              finish();
            }
            if (event.data.type === "error") {
              setError(
                "Dictation failed. Check your connection for the first model download, or type your draft.",
              );
              finish();
            }
          };
          worker.onerror = () => {
            if (!resources.cancelled) {
              setError("Dictation is unavailable. You can type your draft.");
              finish();
            }
          };
          worker.postMessage(samples, [samples.buffer]);
        } catch {
          if (resources.audio && resources.audio.state !== "closed")
            void resources.audio.close().catch(() => {});
          resources.audio = undefined;
          if (!resources.cancelled) {
            setError(
              "Could not transcribe this recording. Try again or type your draft.",
            );
            setPhase("idle");
          }
        }
      };
      recorder.start();
      resources.timer = setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, 120000);
      setPhase("recording");
    } catch {
      if (generation.current !== request) return;
      release();
      setPhase("idle");
      setError(
        "Microphone access is unavailable. Check microphone permissions, or type your draft.",
      );
    }
  };
  const stop = () => {
    if (current.current.recorder?.state === "recording")
      current.current.recorder.stop();
  };
  const cancel = () => {
    generation.current += 1;
    release();
    setPhase("idle");
  };
  return { phase, error, start, stop, cancel };
}

type DictationPhase =
  | "idle"
  | "permission"
  | "recording"
  | "loading"
  | "transcribing";
