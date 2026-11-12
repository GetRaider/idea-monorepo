import type { AiroveApi } from "../shared";

declare global {
  interface Window {
    airove: AiroveApi;
  }
}
