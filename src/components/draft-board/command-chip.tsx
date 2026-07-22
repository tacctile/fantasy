/**
 * Inline terminal-command chip for owner-facing next-action copy (this is
 * Nick's own surface — empty states name the exact command to run). Well-
 * filled per DESIGN_SYSTEM: inputs/inset areas sit darker than background.
 */
export default function CommandChip({ command }: { command: string }) {
  return (
    <code className="rounded-md bg-well px-1.5 py-0.5 font-mono text-xs">
      {command}
    </code>
  )
}
