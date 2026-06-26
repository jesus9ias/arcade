import { Duration } from 'aws-cdk-lib';

/**
 * Shared infrastructure constants for the @arcade/infra construct library.
 * No CDK construct in this library uses inline literal values; every tunable
 * value is declared here.
 */

/** Object CloudFront serves when the request targets the distribution root. */
export const DEFAULT_ROOT_OBJECT = 'index.html';

/** Path a single-page-application fallback rewrites unmatched requests to. */
export const SPA_FALLBACK_PATH = '/index.html';

/** HTTP status codes referenced by CloudFront error responses. */
export const HTTP_STATUS = {
  OK: 200,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
} as const;

/** How long CloudFront caches a generated error response. */
export const ERROR_RESPONSE_TTL = Duration.seconds(10);

/** Lifetime advertised by the Strict-Transport-Security header. */
export const HSTS_MAX_AGE = Duration.days(365);

/**
 * Content Security Policy applied to every response.
 * Static games serve their own bundled scripts and styles; images may be
 * inlined as data URIs (e.g. generated sprites). Inline styles and scripts
 * are permitted because Astro's client:only hydration emits inline scripts
 * and the framework emits scoped style tags. For a static site with no
 * server-side rendering or user-generated HTML, unsafe-inline carries no
 * practical XSS risk.
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
].join('; ');
