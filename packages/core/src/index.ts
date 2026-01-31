/**
 * @anthropic-demo/onemega-core
 *
 * Browser-independent options and profile management for ZeroOmega.
 */

// Re-export from pac module
export {
  Profiles,
  Conditions,
  RuleList,
  type Profile,
  type Condition,
  type OmegaOptions,
  type Request,
  type Proxy,
  type ProxyAuth,
} from '@anthropic-demo/onemega-pac';

// Logging
export { Log, str } from './log';

// Errors
export {
  NetworkError,
  HttpError,
  HttpNotFoundError,
  HttpServerError,
  ContentTypeRejectedError,
  ProfileNotExistError,
  NoOptionsError,
  RateLimitExceededError,
  QuotaExceededError,
  StorageUnavailableError,
} from './errors';

// Storage
export { Storage, type WriteOperations, type WatchCallback } from './storage';
export { BrowserStorage } from './browser-storage';

// Options
export { Options, transformValueForSync } from './options';
