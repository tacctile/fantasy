import { LogOut } from 'lucide-react'

import { signOut } from '@/app/login/actions'
import { Button } from '@/components/ui/button'

/** Ends the owner session via the signOut server action → /login. */
export default function SignOutButton() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="ghost" size="sm">
        <LogOut aria-hidden />
        Sign out
      </Button>
    </form>
  )
}
