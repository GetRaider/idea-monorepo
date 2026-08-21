import type { TempoApi } from "../shared/tempo-api.types";

declare global {
  interface Window {
    tempo: TempoApi;
  }
}

export {};
