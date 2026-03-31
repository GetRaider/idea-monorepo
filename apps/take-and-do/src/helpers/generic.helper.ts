import { randomUUID } from "node:crypto";

export const genericHelper = {
  generateId(): string {
    return randomUUID();
  },
};
