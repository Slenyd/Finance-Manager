export class ApiError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;

  constructor(statusCode: number, message: string, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || 'INTERNAL_ERROR';
    this.isOperational = true;
  }
}

export class ValidationError extends ApiError {
  errors: Record<string, string[]>;

  constructor(errors: Record<string, string[]>) {
    super(400, 'Validation failed', 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = 'Authentication failed') {
    super(401, message, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends ApiError {
  constructor(message = 'Access denied') {
    super(403, message, 'AUTHORIZATION_ERROR');
  }
}

export class BadRequestError extends ApiError {
  constructor(message = 'Bad request') {
    super(400, message, 'BAD_REQUEST');
  }
}

export class NotFoundError extends ApiError {
  constructor(resource = 'Resource') {
    super(404, `${resource} not found`, 'NOT_FOUND');
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Resource already exists') {
    super(409, message, 'CONFLICT');
  }
}
