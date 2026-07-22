/**
 * Typed, server-only HTTP client for Sleeper's UNDOCUMENTED projections
 * surface on api.sleeper.com — deliberately separate from the documented-API
 * client in services/sleeper/client.ts (pinned to api.sleeper.app/v1), per
 * wiki/topics/sleeper-api/projections-endpoint.md: these are two different
 * hosts with different reliability characteristics, and nothing established
 * about the documented host (rate limits, throttling behavior) transfers.
 * No shared code path, no multi-host abstraction — the fragile surface stays
 * quarantined so its failure modes and future churn can never entangle the
 * client every stable feature depends on.
 *
 * The politeness disciplines are mirrored, not inherited: same 250ms pacing
 * gate (module-local state — this host's budget is independent), same
 * bounded exponential-backoff-with-jitter retry, same one-backoff-category
 * treatment of 429 / non-JSON body / connection failure. The documented
 * host's ~1,000 req/min ceiling is NOT assumed to apply here.
 *
 * Server-only: import from services, route handlers, and scripts only.
 */

const ADP_SOURCE_BASE_URL = 'https://api.sleeper.com'

// The response carries every fetched player's full projection record —
// comfortably beyond the 10s default a small endpoint would get.
const DEFAULT_TIMEOUT_MS = 30_000
const MAX_ATTEMPTS = 3
const BACKOFF_BASE_MS = 1_000
const MIN_REQUEST_GAP_MS = 250

export type AdpSourceErrorKind =
  | 'timeout'
  | 'network'
  | 'throttled'
  | 'not_found'
  | 'http'
  | 'invalid_response'

/** Structured translation of every failure mode this client can produce.
 * Failures here must degrade only the ADP feature — callers contain them
 * (see ingestion.ts); nothing built on the documented API may depend on
 * this module. */
export class AdpSourceError extends Error {
  readonly kind: AdpSourceErrorKind
  readonly status: number | undefined
  /** Request path (no origin) — server logs only. */
  readonly path: string
  readonly isThrottleSignal: boolean

  constructor(
    kind: AdpSourceErrorKind,
    path: string,
    options?: { status?: number; cause?: unknown }
  ) {
    const status = options?.status
    super(
      `ADP source request failed (${kind}${status ? ` ${status}` : ''}): ${path}`,
      options?.cause === undefined ? undefined : { cause: options.cause }
    )
    this.name = 'AdpSourceError'
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

function isRetriable(error: AdpSourceError): boolean {
  if (error.isThrottleSignal) return true
  return error.kind === 'http' && error.status !== undefined && error.status >= 500
}

function backoffDelayMs(attempt: number): number {
  return BACKOFF_BASE_MS * 2 ** (attempt - 1) + Math.random() * BACKOFF_BASE_MS
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Module-local pacing gate — independent of the documented-host client's.
let nextRequestAt = 0

async function paceRequest(): Promise<void> {
  const now = Date.now()
  const waitMs = nextRequestAt - now
  nextRequestAt = Math.max(now, nextRequestAt) + MIN_REQUEST_GAP_MS
  if (waitMs > 0) await sleep(waitMs)
}

async function requestOnce(path: string, timeoutMs: number): Promise<unknown> {
  await paceRequest()
  const signal = AbortSignal.timeout(timeoutMs)

  let response: Response
  try {
    response = await fetch(`${ADP_SOURCE_BASE_URL}${path}`, {
      signal,
      cache: 'no-store',
      headers: { accept: 'application/json' },
    })
  } catch (error) {
    if (isTimeoutError(error)) throw new AdpSourceError('timeout', path, { cause: error })
    throw new AdpSourceError('network', path, { cause: error })
  }

  if (!response.ok) {
    if (response.status === 429) throw new AdpSourceError('throttled', path, { status: 429 })
    if (response.status === 404) throw new AdpSourceError('not_found', path, { status: 404 })
    throw new AdpSourceError('http', path, { status: response.status })
  }

  try {
    return await response.json()
  } catch (error) {
    if (isTimeoutError(error)) throw new AdpSourceError('timeout', path, { cause: error })
    throw new AdpSourceError('invalid_response', path, { status: response.status, cause: error })
  }
}

/**
 * Fetch the season-level projections array (which carries the per-format
 * `adp_*` fields) for one season.
 *
 * The request uses exactly the parameter combination the wiki page records
 * as live-verified — `season_type=regular`, the repeatable `position[]`
 * filter, and `order_by` — because behavior outside that combination
 * (notably omitting `position[]`) is explicitly unverified on this
 * undocumented surface. `order_by` only affects response ordering; every
 * record carries all its `adp_*` fields regardless, so one request serves
 * every format.
 *
 * Positions: the six standard managed-league fantasy positions (Nick-signed
 * 2026-07-22). IDP positions are deliberately not fetched — no IDP league is
 * connected.
 *
 * Returns the parsed body as `unknown` — the ingestion service structurally
 * validates before anything is persisted (validate-before-swap).
 */
export async function fetchSeasonProjections(seasonYear: number): Promise<unknown> {
  const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF']
  const positionParams = positions.map((p) => `position[]=${p}`).join('&')
  const path =
    `/projections/nfl/${seasonYear}` +
    `?season_type=regular&${positionParams}&order_by=adp_ppr`

  let lastError: AdpSourceError | null = null
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (attempt > 1) await sleep(backoffDelayMs(attempt - 1))
    try {
      return await requestOnce(path, DEFAULT_TIMEOUT_MS)
    } catch (error) {
      if (!(error instanceof AdpSourceError) || !isRetriable(error)) throw error
      lastError = error
    }
  }
  throw lastError as AdpSourceError
}
