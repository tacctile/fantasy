'use client'

import { Check, Copy, Link2, RefreshCw, TriangleAlert } from 'lucide-react'
import { useState, useSyncExternalStore } from 'react'
import { toast } from 'sonner'

import { regenerateShareToken } from '@/app/(admin)/leagues/[leagueId]/dashboard/actions'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface ShareLinkPanelProps {
  /** platform_league_uuid — the league whose spectator link this manages. */
  leagueId: string
  /** Current `share_token` (owner-read on the dashboard page). */
  shareToken: string
}

/** The spectator path for a token — the absolute URL is resolved against the
 *  viewing origin at render/copy time (no site-URL env var; always correct for
 *  local/preview/prod). */
function sharePath(token: string): string {
  return `/share/${token}`
}

const NEVER_CHANGES = () => () => {}

/**
 * The viewing origin, read hydration-safely (`''` on the server and the initial
 * client render, then `window.location.origin`) — the same external-store
 * pattern the draft-queue store uses to avoid setState-in-effect. The origin
 * never changes within a page, so the subscribe is a no-op.
 */
function useOrigin(): string {
  return useSyncExternalStore(
    NEVER_CHANGES,
    () => window.location.origin,
    () => ''
  )
}

/**
 * Owner-only share-link settings panel (Wave 4, admin dashboard only). Shows the
 * league's read-only spectator URL with copy-to-clipboard, and a regenerate
 * control that mints a fresh token and immediately invalidates the previous link
 * (MASTER_CONTEXT Access Model: revocable/regeneratable per league, no
 * re-creation). Regenerate is a deliberate two-step confirm because it silently
 * breaks any link already shared with leaguemates.
 *
 * The absolute URL is built from `window.location.origin` on the client so it is
 * always correct for whatever host Nick is viewing from — the server never needs
 * a configured base URL. `share_token` never reaches any non-admin surface: this
 * panel renders only inside the owner-authenticated dashboard.
 */
export default function ShareLinkPanel({
  leagueId,
  shareToken,
}: ShareLinkPanelProps) {
  const [token, setToken] = useState(shareToken)
  const [copied, setCopied] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [pending, setPending] = useState(false)
  const origin = useOrigin()

  // `''` until the client store resolves — the field shows the relative path on
  // the server and first client render (no hydration mismatch), then the
  // absolute URL.
  const displayUrl = origin ? `${origin}${sharePath(token)}` : sharePath(token)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${sharePath(token)}`
      )
      setCopied(true)
      toast.success('Spectator link copied')
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy — select the link and copy manually')
    }
  }

  async function handleRegenerate() {
    setPending(true)
    try {
      const result = await regenerateShareToken(leagueId)
      if (result.outcome === 'regenerated') {
        setToken(result.shareToken)
        setConfirming(false)
        setCopied(false)
        toast.success('New spectator link generated — the old link no longer works')
      } else if (result.outcome === 'unauthorized') {
        toast.error('Not authorized to regenerate this link')
      } else {
        toast.error('League not found — could not regenerate the link')
      }
    } catch {
      toast.error('Could not regenerate the link — try again')
    } finally {
      setPending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="size-4 text-muted-foreground" aria-hidden />
          Share link
        </CardTitle>
        <CardDescription>
          A read-only, no-login spectator view of this league. Anyone with the
          link can see standings, matchups, and power rankings — never the draft
          board or admin tools.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Input
            readOnly
            value={displayUrl}
            aria-label="Spectator link"
            className="font-mono"
            onFocus={(event) => event.currentTarget.select()}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            aria-label="Copy spectator link"
          >
            {copied ? (
              <Check aria-hidden />
            ) : (
              <Copy aria-hidden />
            )}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>

        {confirming ? (
          <div className="flex flex-col gap-2 rounded-lg border border-warning/40 bg-warning/5 p-3">
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <TriangleAlert
                className="mt-0.5 size-4 shrink-0 text-warning"
                aria-hidden
              />
              <span>
                Regenerating issues a new link and immediately stops the current
                one from working. Anyone you&apos;ve already shared it with will
                need the new link.
              </span>
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRegenerate}
                disabled={pending}
              >
                <RefreshCw
                  className={pending ? 'animate-spin' : undefined}
                  aria-hidden
                />
                {pending ? 'Regenerating…' : 'Confirm regenerate'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirming(false)}
                disabled={pending}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirming(true)}
            >
              <RefreshCw aria-hidden />
              Regenerate link
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
