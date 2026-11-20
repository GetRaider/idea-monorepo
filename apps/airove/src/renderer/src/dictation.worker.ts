import { env, pipeline } from "@huggingface/transformers";
import wasmLoaderUrl from "onnxruntime-web/ort-wasm-simd-threaded.jsep.mjs?url";
import wasmUrl from "onnxruntime-web/ort-wasm-simd-threaded.jsep.wasm?url";

let transcriber: Promise<Transcriber> | null = null;

self.onmessage = async (event: MessageEvent<Float32Array>) => {
  try {
    if (!transcriber) {
      self.postMessage({ type: "loading" });
      env.allowLocalModels = false;
      env.backends.onnx.wasm!.numThreads = 1;
      env.backends.onnx.wasm!.proxy = false;
      env.backends.onnx.wasm!.wasmPaths = { mjs: wasmLoaderUrl, wasm: wasmUrl };
      transcriber = pipeline(
        "automatic-speech-recognition",
        "onnx-community/whisper-tiny",
        { dtype: "q8", device: "wasm" },
      ) as unknown as Promise<Transcriber>;
    }
    const recognize = await transcriber;
    self.postMessage({ type: "transcribing" });
    const output = await recognize(event.data, {
      chunk_length_s: 30,
      stride_length_s: 5,
      task: "transcribe",
    });
    self.postMessage({ type: "result", text: output.text.trim() });
  } catch {
    transcriber = null;
    self.postMessage({ type: "error" });
  }
};

interface Transcriber {
  (
    audio: Float32Array,
    options: { chunk_length_s: number; stride_length_s: number; task: string },
  ): Promise<{ text: string }>;
}
