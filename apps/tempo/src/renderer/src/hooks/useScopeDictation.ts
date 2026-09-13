import { useEffect, useRef, useState } from "react";

import {
  createIdleWaveformLevels,
  DICTATION_WAVEFORM_SAMPLE_INTERVAL_MS,
  getRmsAmplitude,
  pushWaveformLevel,
} from "../../../helpers/dictation-waveform.helper";

export function useScopeDictation({
  disabled,
  onTranscript,
}: UseScopeDictationOptions): ScopeDictation {
  const [phase, setPhase] = useState<DictationPhase>("idle");
  const [waveformLevels, setWaveformLevels] = useState(createIdleWaveformLevels);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef(0);
  const chunksRef = useRef<Blob[]>([]);
  const shouldTranscribeRef = useRef(true);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  useEffect(() => {
    return () => {
      shouldTranscribeRef.current = false;
      stopWaveformMonitor(animationFrameRef, audioContextRef, analyserRef);
      stopRecording(mediaRecorderRef, mediaStreamRef);
    };
  }, []);

  useEffect(() => {
    if (disabled && phase === "recording") {
      shouldTranscribeRef.current = false;
      stopWaveformMonitor(animationFrameRef, audioContextRef, analyserRef);
      stopRecording(mediaRecorderRef, mediaStreamRef);
      setPhase("idle");
    }
  }, [disabled, phase]);

  async function start(): Promise<void> {
    if (disabled || phase !== "idle") {
      return;
    }

    setErrorMessage(null);
    shouldTranscribeRef.current = true;
    const microphoneGranted = await window.tempo.requestMicrophoneAccess();
    if (!microphoneGranted) {
      setErrorMessage("Microphone permission denied");
      return;
    }

    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setErrorMessage("Dictation unavailable");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setErrorMessage("Microphone permission denied");
      return;
    }

    mediaStreamRef.current = stream;
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    });
    recorder.addEventListener("stop", () => {
      const chunks = chunksRef.current;
      chunksRef.current = [];
      stopWaveformMonitor(animationFrameRef, audioContextRef, analyserRef);
      stopRecording(mediaRecorderRef, mediaStreamRef);
      if (!shouldTranscribeRef.current) {
        shouldTranscribeRef.current = true;
        setPhase("idle");
        setWaveformLevels(createIdleWaveformLevels());
        return;
      }
      setPhase("transcribing");
      void transcribeRecording(
        chunks,
        onTranscriptRef,
        setErrorMessage,
        setPhase,
        setWaveformLevels,
      );
    });
    recorder.addEventListener("error", () => {
      stopWaveformMonitor(animationFrameRef, audioContextRef, analyserRef);
      stopRecording(mediaRecorderRef, mediaStreamRef);
      setPhase("idle");
      setErrorMessage("Dictation unavailable");
    });

    try {
      startWaveformMonitor(
        stream,
        audioContextRef,
        analyserRef,
        animationFrameRef,
        setWaveformLevels,
      );
      recorder.start();
      setPhase("recording");
    } catch {
      stopWaveformMonitor(animationFrameRef, audioContextRef, analyserRef);
      stopRecording(mediaRecorderRef, mediaStreamRef);
      setErrorMessage("Dictation unavailable");
    }
  }

  function confirm(): void {
    if (phase !== "recording") {
      return;
    }
    shouldTranscribeRef.current = true;
    const recorder = mediaRecorderRef.current;
    if (recorder !== null && recorder.state !== "inactive") {
      recorder.stop();
    }
  }

  function cancel(): void {
    if (phase !== "recording") {
      return;
    }
    shouldTranscribeRef.current = false;
    const recorder = mediaRecorderRef.current;
    if (recorder !== null && recorder.state !== "inactive") {
      recorder.stop();
    }
  }

  return {
    phase,
    waveformLevels,
    errorMessage,
    start,
    confirm,
    cancel,
  };
}

function startWaveformMonitor(
  stream: MediaStream,
  audioContextRef: { current: AudioContext | null },
  analyserRef: { current: AnalyserNode | null },
  animationFrameRef: { current: number },
  setWaveformLevels: (updater: (current: number[]) => number[]) => void,
): void {
  const audioContext = new AudioContext();
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  audioContext.createMediaStreamSource(stream).connect(analyser);
  audioContextRef.current = audioContext;
  analyserRef.current = analyser;
  setWaveformLevels(() => createIdleWaveformLevels());

  const timeDomainData = new Uint8Array(analyser.fftSize);
  let lastSampleAt = 0;
  function tick(now: number): void {
    const currentAnalyser = analyserRef.current;
    if (currentAnalyser === null) {
      return;
    }
    if (now - lastSampleAt >= DICTATION_WAVEFORM_SAMPLE_INTERVAL_MS) {
      lastSampleAt = now;
      currentAnalyser.getByteTimeDomainData(timeDomainData);
      const amplitude = getRmsAmplitude(timeDomainData);
      setWaveformLevels((current) => pushWaveformLevel(current, amplitude));
    }
    animationFrameRef.current = requestAnimationFrame(tick);
  }
  animationFrameRef.current = requestAnimationFrame(tick);
}

function stopWaveformMonitor(
  animationFrameRef: { current: number },
  audioContextRef: { current: AudioContext | null },
  analyserRef: { current: AnalyserNode | null },
): void {
  if (animationFrameRef.current !== 0) {
    cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = 0;
  }
  analyserRef.current = null;
  const audioContext = audioContextRef.current;
  audioContextRef.current = null;
  if (audioContext !== null) {
    void audioContext.close();
  }
}

async function transcribeRecording(
  chunks: Blob[],
  onTranscriptRef: { current: (transcript: string) => void },
  setErrorMessage: (message: string | null) => void,
  setPhase: (phase: DictationPhase) => void,
  setWaveformLevels: (levels: number[]) => void,
): Promise<void> {
  if (chunks.length === 0) {
    setPhase("idle");
    setWaveformLevels(createIdleWaveformLevels());
    return;
  }

  const objectUrl = URL.createObjectURL(new Blob(chunks));
  try {
    const transcriber = await getWhisperTranscriber();
    const output = await transcriber(objectUrl);
    const transcript = getTranscriptText(output).trim();
    if (transcript.length > 0) {
      onTranscriptRef.current(transcript);
    }
  } catch {
    setErrorMessage("Dictation unavailable");
  } finally {
    URL.revokeObjectURL(objectUrl);
    setPhase("idle");
    setWaveformLevels(createIdleWaveformLevels());
  }
}

function getWhisperTranscriber(): Promise<WhisperTranscriber> {
  if (whisperTranscriberPromise === null) {
    whisperTranscriberPromise = import("@huggingface/transformers")
      .then(({ pipeline, env }) => {
        env.allowLocalModels = false;
        env.allowRemoteModels = true;
        return pipeline("automatic-speech-recognition", "onnx-community/whisper-tiny.en", {
          dtype: "fp32",
        });
      })
      .catch((error: unknown) => {
        whisperTranscriberPromise = null;
        throw error;
      });
  }
  return whisperTranscriberPromise as Promise<WhisperTranscriber>;
}

function getTranscriptText(output: unknown): string {
  if (typeof output === "string") {
    return output;
  }
  if (
    output !== null &&
    typeof output === "object" &&
    "text" in output &&
    typeof output.text === "string"
  ) {
    return output.text;
  }
  return "";
}

function stopRecording(
  mediaRecorderRef: { current: MediaRecorder | null },
  mediaStreamRef: { current: MediaStream | null },
): void {
  const recorder = mediaRecorderRef.current;
  mediaRecorderRef.current = null;
  if (recorder !== null && recorder.state !== "inactive") {
    try {
      recorder.stop();
    } catch {
      // already stopped
    }
  }
  mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
  mediaStreamRef.current = null;
}

let whisperTranscriberPromise: Promise<unknown> | null = null;

interface WhisperTranscriber {
  (audio: string): Promise<unknown>;
}

interface UseScopeDictationOptions {
  disabled: boolean;
  onTranscript: (transcript: string) => void;
}

interface ScopeDictation {
  phase: DictationPhase;
  waveformLevels: number[];
  errorMessage: string | null;
  start: () => Promise<void>;
  confirm: () => void;
  cancel: () => void;
}

type DictationPhase = "idle" | "recording" | "transcribing";
