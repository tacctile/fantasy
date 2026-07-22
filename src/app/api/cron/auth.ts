import { timingSafeEqual } from "node:crypto"

import { NextResponse } from "next/server"

/**
 * Shared auth gate for the cron routes (Wave 2 cron sub-section). Vercel Cron
 * invokes scheduled routes with `Authorization: Bearer ${CRON_SECRET}` when
 * that env var is set on the project; manual invocations supply the same
 * header. Fails closed: a missing/empty CRON_SECRET rejects every request
 * (500 — deployment misconfiguration, server-logged), and anything but an
 * exact bearer match rejects with 401. Response bodies stay generic.
 *
 * Returns the rejection response to send, or null when the request is
 * authorized.
 */
export function requireCronSecret(request: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET
  if (secret === undefined || secret === "") {
    console.error("Cron auth: CRON_SECRET is not configured — rejecting all invocations")
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  const header = request.headers.get("authorization")
  if (header === null || !isExactMatch(header, `Bearer ${secret}`)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  return null
}

/** Constant-time comparison; length mismatch short-circuits (length isn't secret). */
function isExactMatch(provided: string, expected: string): boolean {
  const providedBytes = Buffer.from(provided)
  const expectedBytes = Buffer.from(expected)
  if (providedBytes.length !== expectedBytes.length) return false
  return timingSafeEqual(providedBytes, expectedBytes)
}
