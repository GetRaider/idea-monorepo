import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "@/lib/api/errors";

export class BaseApiService {
  /**
   * Wraps repository calls. Exceptions are passed to `mapError` only; there is
   * no silent recovery — unknown errors still propagate after `mapError` rethrows.
   */
  protected async handleOperation<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      return this.mapError(error);
    }
  }

  /**
   * Map repository/domain failures to HTTP errors (`notFound`, `badRequest`, …).
   * Rethrow anything you do not translate so route handlers can respond with 500.
   */
  protected mapError(error: unknown): never {
    throw error;
  }

  protected badRequest(message: string, details?: string): never {
    throw new BadRequestError(message, details);
  }

  protected conflict(message: string): never {
    throw new ConflictError(message);
  }

  protected notFound(resource = "Resource"): never {
    throw new NotFoundError(resource);
  }
}
