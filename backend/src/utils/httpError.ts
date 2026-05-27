export interface HttpErrorOptions {
  details?: Record<string, unknown>;
}

export class HttpError extends Error {
  statusCode: number;
  details?: Record<string, unknown>;

  constructor(statusCode: number, message: string, options: HttpErrorOptions = {}) {
    super(message);
    this.statusCode = statusCode;
    if (options.details !== undefined) {
      this.details = options.details;
    }
  }
}