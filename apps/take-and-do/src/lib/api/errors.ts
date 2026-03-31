export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = "Authentication is required.") {
    super(401, message);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = "You do not have permission to perform this action.") {
    super(403, message);
  }
}

export class NotFoundError extends HttpError {
  constructor(resource = "Resource") {
    super(404, `${resource} not found`);
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string, details?: string) {
    super(400, message, details);
  }
}

export class ConflictError extends HttpError {
  constructor(message: string) {
    super(409, message);
  }
}
