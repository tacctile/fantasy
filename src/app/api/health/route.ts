import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

/**
 * Health check: proves the deployed environment can reach the database
 * with a trivial authenticated read. Returns no data beyond ok status.
 */
export async function GET() {
  const supabase = createClient()

  const { error } = await supabase
    .from("leagues")
    .select("platform_league_uuid", { count: "exact", head: true })

  if (error) {
    console.error("Health check failed:", error.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
