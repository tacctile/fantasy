/**
 * Typed, server-only HTTP client for Sleeper's public read API
 * (https://api.sleeper.app/v1 — per wiki/topics/sleeper-api/authentication.md).
 *
 * Server-only: import from server code (services, route handlers, scripts)
 * only — never from client components. Sleeper needs no credentials, but
 * league IDs in request paths are treated with credential-level care, so
 * errors from this module must stay in server logs.
 *
 * No auth headers, tokens, or refresh logic exist on this API's read path,
 * and there is no 401/403 taxonomy — a bad ID is an ordinary 404. The only
 * caller-behavior error class is volume-based throttling, and per
 * wiki/topics/sleeper-api/rate-limits.md a 429, a non-JSON body, and a
 * connection-level failure/timeout are one backoff category: enforcement can
 * escalate past clean 429s to CDN-level challenge pages and dropped
 * connections, so all three retry under the same exponential-backoff-with-
 * jitter policy, with a bounded attempt count and no reliance on Retry-After
 * (not reliably present).
 */

const SLEEPER_BASE_URL = 'https://api.sleeper.app/v1'

const DEFAULT_TIMEOUT_MS = 10_000
const MAX_ATTEMPTS = 3
const BACKOFF_BASE_MS = 1_000

export type SleeperErrorKind =
  | 'timeout' // request or body read exceeded its deadline
  | 'network' // connection-level failure (DNS, reset, refused)
  | 'throttled' // HTTP 429
  | 'not_found' // HTTP 404 — nonexistent ID; definitive, never retried
  | 'http' // any other non-2xx status
  | 'invalid_response' // 2xx but body is not parseable JSON

/** Structured translation of every failure mode this client can produce. */
export class SleeperApiError extends Error {
  readonly kind: SleeperErrorKind
  /** HTTP status, when a response was received at all. */
  readonly status: number | undefined
  /** Request path (no origin). May contain league IDs — server logs only. */
  readonly path: string
  /**
   * True for the three signals the rate-limits page groups into one backoff
   * category: 429, non-JSON body, connection-level failure/timeout.
   */
  readonly isThrottleSignal: boolean

  constructor(
    kind: SleeperErrorKind,
    path: string,
    options?: { status?: number; cause?: unknown }
  ) {
    const status = options?.status
    super(
      `Sleeper request failed (${kind}${status ? ` ${status}` : ''}): ${path}`,
      options?.cause === undefined ? undefined : { cause: options.cause }
    )
    this.name = 'SleeperApiError'
    this.kind = kind
    this.status = status
    this.path = path
    this.isThrottleSignal =
      kind === 'timeout' ||
      kind === 'network' ||
      kind === 'throttled' ||
      kind === 'invalid_response'
  }
}

function isTimeoutError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'TimeoutError' || error.name === 'AbortError')
  )
}

function isRetriable(error: SleeperApiError): boolean {
  if (error.isThrottleSignal) return true
  return error.kind === 'http' && error.status !== undefined && error.status >= 500
}

function backoffDelayMs(attempt: number): number {
  return BACKOFF_BASE_MS * 2 ** (attempt - 1) + Math.random() * BACKOFF_BASE_MS
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function requestOnce<T>(path: string, timeoutMs: number): Promise<T> {
  const signal = AbortSignal.timeout(timeoutMs)

  let response: Response
  try {
    response = await fetch(`${SLEEPER_BASE_URL}${path}`, {
      signal,
      cache: 'no-store',
      headers: { accept: 'application/json' },
    })
  } catch (error) {
    if (isTimeoutError(error)) throw new SleeperApiError('timeout', path, { cause: error })
    throw new SleeperApiError('network', path, { cause: error })
  }

  if (!response.ok) {
    if (response.status === 429) throw new SleeperApiError('throttled', path, { status: 429 })
    if (response.status === 404) throw new SleeperApiError('not_found', path, { status: 404 })
    throw new SleeperApiError('http', path, { status: response.status })
  }

  try {
    return (await response.json()) as T
  } catch (error) {
    // The timeout signal also aborts a slow body read — keep that classified
    // as a timeout rather than a malformed response.
    if (isTimeoutError(error)) throw new SleeperApiError('timeout', path, { cause: error })
    throw new SleeperApiError('invalid_response', path, { status: response.status, cause: error })
  }
}

/**
 * GET a Sleeper read endpoint and parse its JSON body.
 *
 * The generic parameter is a caller-side assertion — callers that persist the
 * result must structurally validate it (per the players-endpoint page's
 * validate-before-swap guidance); this client guarantees only "2xx and JSON".
 *
 * @param path Endpoint path including leading slash, e.g. `/players/nfl`.
 * @param options.timeoutMs Per-request deadline; the catalog fetch overrides
 *   the 10s default because its payload is 5MB+.
 */
export async function sleeperGet<T>(
  path: string,
  options?: { timeoutMs?: number }
): Promise<T> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS

  let lastError: SleeperApiError | null = null
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (attempt > 1) await sleep(backoffDelayMs(attempt - 1))
    try {
      return await requestOnce<T>(path, timeoutMs)
    } catch (error) {
      if (!(error instanceof SleeperApiError) || !isRetriable(error)) throw error
      lastError = error
    }
  }
  // The loop only falls through after a retriable failure, so lastError is set.
  throw lastError as SleeperApiError
}
