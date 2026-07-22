import { notFound } from 'next/navigation'

import DraftBoardShell from '@/components/draft-board/draft-board-shell'
import { createClient } from '@/lib/supabase/server'
import { getDraftBoardData, listConnectedLeagues } from '@/services/draft-board'

/**
 * Admin-only static draft board (Wave 3a). Server Component: fetches the
 * merged player/ADP dataset and league context through the RLS-enforced
 * server client — the caller-supplied-client design of getDraftBoardData
 * exists precisely so this route reads as the signed-in admin, never with
 * service-role privileges. An unknown, malformed, or inaccessible league id
 * is a typed not-found from the data layer → 404, never a partial response.
 */
export default async function DraftBoardPage({
  params,
}: {
  params: Promise<{ leagueId: string }>
}) {
  const { leagueId } = await params
  const db = await createClient()
  const [result, leagues] = await Promise.all([
    getDraftBoardData(db, leagueId),
    listConnectedLeagues(db),
  ])
  if (!result.ok) notFound()

  return (
    <DraftBoardShell
      context={result.data.context}
      players={result.data.players}
      leagues={leagues}
    />
  )
}
