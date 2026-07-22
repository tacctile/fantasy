/**
 * Shared empty-state body for the board region: centered title + detail with
 * an action slot (button or command copy). Presentation only — each call site
 * owns its copy and next action, per the build item's "each with a clear next
 * action" requirement.
 */
export default function BoardEmptyState({
  title,
  detail,
  children,
}: {
  title: string
  detail?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-1 px-6 py-16 text-center">
      <p className="text-sm font-semibold">{title}</p>
      {detail !== undefined && (
        <p className="text-xs text-muted-foreground tabular-nums">{detail}</p>
      )}
      {children !== undefined && (
        <div className="pt-3 text-xs text-muted-foreground">{children}</div>
      )}
    </div>
  )
}
