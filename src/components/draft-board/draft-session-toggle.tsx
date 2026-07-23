'use client'

import { Play, Square } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition, type ReactNode } from 'react'

import {
  endDraftSession,
  startDraftSession,
} from '@/app/(admin)/leagues/[leagueId]/draft/actions'
import { Button } from '@/components/ui/button'
import type { DraftSessionState } from '@/services/draft-sessions'

interface DraftSessionToggleProps {
  session: DraftSessionState
  /** Rendered inside the live cluster right after the "Draft live" label —
   *  home of the live status indicator (Nick's placement, 2026-07-22). */
  statusSlot?: ReactNode
}

/**
 * The draft start/stop control (Wave 3b orchestration item 1, Nick's Clarify
 * placement: board toolbar). Toggling ACTIVE is what elevates draft polling
 * to live cadence; the live indicator uses the brand teal (`--primary`) per
 * the token rule that teal means interactive/live. A lapsed 6-hour soft TTL
 * renders as "session expired" — honest about why polling stood down when
 * the flag was never explicitly turned off.
 */
export default function DraftSessionToggle({
  session,
  statusSlot,
}: DraftSessionToggleProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [notice, setNotice] = useState<string | null>(null)

  const toggle = () => {
    setNotice(null)
    startTransition(async () => {
      if (session.isDraftActive) {
        const result = await endDraftSession(session.leagueId)
        if (result.outcome !== 'deactivated') {
          setNotice('Could not end the draft session.')
        }
      } else {
        const result = await startDraftSession(session.leagueId)
        if (result.outcome !== 'activated') {
          setNotice('Could not start the draft session.')
        } else if (result.initialSync.status === 'failure') {
          // Non-blocking by design: the flag is on, polling will retry.
          setNotice('Draft is live; initial pick sync failed and will retry.')
        }
      }
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-2">
      {session.isDraftActive ? (
        <>
          <span className="flex items-center gap-1.5 text-sm font-medium text-primary">
            <span
              aria-hidden
              className="size-2 animate-pulse rounded-full bg-primary"
            />
            Draft live
          </span>
          {statusSlot}
        </>
      ) : session.isStale ? (
        <span className="text-sm text-muted-foreground">Session expired</span>
      ) : null}
      <Button
        type="button"
        variant={session.isDraftActive ? 'destructive' : 'outline'}
        size="sm"
        onClick={toggle}
        disabled={isPending}
      >
        {session.isDraftActive ? <Square aria-hidden /> : <Play aria-hidden />}
        {session.isDraftActive ? 'End draft' : 'Start draft'}
      </Button>
      {notice !== null ? (
        <span role="status" className="text-sm text-muted-foreground">
          {notice}
        </span>
      ) : null}
    </div>
  )
}
