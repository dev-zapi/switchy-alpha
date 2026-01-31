/**
 * Error classes for omega-target
 */

/**
 * Base network error
 */
export class NetworkError extends Error {
  cause?: Error;

  constructor(cause?: Error) {
    super(cause?.message ?? 'Network error');
    this.name = 'NetworkError';
    this.cause = cause;
  }
}

/**
 * HTTP error with status code
 */
export class HttpError extends NetworkError {
  statusCode?: number;

  constructor(cause?: Error & { statusCode?: number }) {
    super(cause);
    this.name = 'HttpError';
    this.statusCode = cause?.statusCode;
  }
}

/**
 * HTTP 404 Not Found error
 */
export class HttpNotFoundError extends HttpError {
  constructor(cause?: Error & { statusCode?: number }) {
    super(cause);
    this.name = 'HttpNotFoundError';
  }
}

/**
 * HTTP 5xx Server error
 */
export class HttpServerError extends HttpError {
  constructor(cause?: Error & { statusCode?: number }) {
    super(cause);
    this.name = 'HttpServerError';
  }
}

/**
 * Content type was rejected
 */
export class ContentTypeRejectedError extends Error {
  constructor(message = 'Content type rejected') {
    super(message);
    this.name = 'ContentTypeRejectedError';
  }
}

/**
 * Profile does not exist
 */
export class ProfileNotExistError extends Error {
  profileName: string;

  constructor(profileName: string) {
    super(`Profile ${profileName} does not exist!`);
    this.name = 'ProfileNotExistError';
    this.profileName = profileName;
  }
}

/**
 * No options available
 */
export class NoOptionsError extends Error {
  constructor() {
    super('No options available');
    this.name = 'NoOptionsError';
  }
}

/**
 * Storage rate limit exceeded
 */
export class RateLimitExceededError extends Error {
  constructor() {
    super('Rate limit exceeded');
    this.name = 'RateLimitExceededError';
  }
}

/**
 * Storage quota exceeded
 */
export class QuotaExceededError extends Error {
  constructor() {
    super('Quota exceeded');
    this.name = 'QuotaExceededError';
  }
}

/**
 * Storage unavailable (fatal)
 */
export class StorageUnavailableError extends Error {
  constructor() {
    super('Storage unavailable');
    this.name = 'StorageUnavailableError';
  }
}
