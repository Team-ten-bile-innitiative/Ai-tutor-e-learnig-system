export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function notFound(message = "Resource not found") {
  return new ApiError(404, message);
}

export function unauthorized(message = "Please sign in to continue") {
  return new ApiError(401, message);
}

export function forbidden(message = "You do not have permission to do that") {
  return new ApiError(403, message);
}
