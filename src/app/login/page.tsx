import { redirect } from 'next/navigation'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getAdminAuthState } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

import LoginForm from './login-form'

/**
 * Owner sign-in page. Any already-authenticated session is bounced to the
 * root, which routes it (admin → first league's board, non-admin → the
 * not-authorized view). Spectator share links (Wave 4) never touch this page
 * — viewers have no login at all, per the Access Model.
 */
export default async function LoginPage() {
  const db = await createClient()
  const auth = await getAdminAuthState(db)
  if (auth.state !== 'unauthenticated') redirect('/')

  return (
    <main className="flex flex-1 items-center justify-center bg-background p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>fantasy</CardTitle>
          <CardDescription>Owner sign-in</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  )
}
