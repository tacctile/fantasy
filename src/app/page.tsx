import { LayoutDashboard } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Placeholder shell proving the Wave 1 scaffold: shadcn tokens, the `@/`
 * import alias, lucide-react, and tabular-nums on a data display.
 * Replaced by real surfaces in later waves.
 */
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-background p-8 text-foreground">
      <div className="flex items-center gap-2">
        <LayoutDashboard className="size-6 text-muted-foreground" aria-hidden />
        <h1 className="text-2xl font-semibold tracking-tight">fantasy</h1>
      </div>
      <p className="max-w-md text-center text-muted-foreground">
        Multi-league dashboard and draft assistant. Wave 1 scaffold — schema
        and deploy plumbing land next.
      </p>
      <p className={cn("rounded-lg border bg-card px-4 py-2 text-sm text-card-foreground", "tabular-nums")}>
        0 leagues connected
      </p>
    </main>
  );
}
