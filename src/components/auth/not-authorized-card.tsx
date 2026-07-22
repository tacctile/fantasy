import { ShieldX } from 'lucide-react'

import { signOut } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface NotAuthorizedCardProps {
  /** Email of the signed-in (but non-admin) session, for honest display. */
  email: string | null
}

/**
 * Shown to a valid session that is not the fantasy admin — possible because
 * the auth namespace is shared with Nick's other prolabel apps. Renders zero
 * league data and no admin markup; sign-out is the only action offered.
 */
export default function NotAuthorizedCard({ email }: NotAuthorizedCardProps) {
  return (
    <main className="flex flex-1 items-center justify-center bg-background p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldX className="size-5 text-muted-foreground" aria-hidden />
            <CardTitle>Not authorized</CardTitle>
          </div>
          <CardDescription>
            {email === null ? 'This account' : email} doesn&apos;t have access
            to this app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signOut}>
            <Button type="submit" variant="outline" className="w-full">
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
