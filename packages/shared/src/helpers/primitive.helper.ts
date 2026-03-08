import { randomInt } from "node:crypto";

export interface IJsonStringifyOptions {
  replacer?: () => unknown;
  spaces?: number;
}

class PrimitiveHelper {
  string = {
    toBoolean(str: string): boolean {
      switch (str) {
        case "true":
          return true;
        case "false":
        case undefined:
        case "":
          return false;
        default:
          throw new Error(`wrong string: ${str}`);
      }
    },

    removeLast(source: string, charToRemove: string): string {
      if (source.length > 0 && source[source.length - 1] === charToRemove) {
        return source.slice(0, -1);
      }
      return source;
    },
  };

  removeNullValues(obj: Record<string, unknown>): Record<string, unknown> {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  getRandomFrom<T>(values: T[]): T {
    return values[randomInt(values.length)];
  }

  getCurrentDateTime(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");
    const second = String(now.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  }

  getCurrenTime(): string {
    const now = new Date();
    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");
    const second = String(now.getSeconds()).padStart(2, "0");

    return `${hour}:${minute}:${second}`;
  }

  jsonStringify(value: unknown, options: IJsonStringifyOptions = {}): string {
    const { replacer = this.defaultReplacer, spaces = 2 } = options;
    return JSON.stringify(value, replacer, spaces);
  }

  defaultReplacer(_: string, value: unknown) {
    if (typeof value === "function")
      return `[Function: ${value.name || "anonymous"}]`;
    if (value instanceof Error) {
      const errorObj: Record<string, unknown> = {};

      Object.getOwnPropertyNames(value).forEach((k) => {
        errorObj[k] = value[k];
      });
      return errorObj;
    }
    return value;
  }
}

export const primitiveHelper = new PrimitiveHelper();
