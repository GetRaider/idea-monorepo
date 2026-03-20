"use client";

class WaiterHelper {
  async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async retry<T>(
    operation: () => Promise<T>,
    { retries = 5, timeout = 150 }: RetryParams = {},
  ): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt < retries) await this.sleep(timeout);
      }
    }

    throw lastError;
  }
}

export const waiterHelper = new WaiterHelper();

interface RetryParams {
  retries?: number;
  timeout?: number;
}
