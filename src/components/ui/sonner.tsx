'use client'

import type { CSSProperties } from 'react'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

/**
 * App-wide toast outlet (sonner, Nick-signed 2026-07-22 — the non-blocking
 * notification surface for the draft board's conflict/rollback toasts and
 * every later notification item). Theme is hardcoded dark: this app is
 * dark-mode-only by design (DESIGN_SYSTEM.md, Theme Mode) — never add a
 * light/system branch here. Colors reference tokens via CSS variables only.
 */
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as CSSProperties
      }
      {...props}
    />
  )
}
