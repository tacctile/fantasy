'use client'

import { Component, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  /**
   * Rendered in place of `children` after a render/commit error — a quiet
   * inline notice per the draft board's degrade-gracefully posture (Wave 3b
   * resilience item 1, Nick's Clarify): a failing live region drops to this
   * notice while every other region and the static board stay usable.
   */
  fallback: ReactNode
  /**
   * When any value here changes (shallow, positional), the boundary clears its
   * error and retries `children`. A live region revived by fresh data (a new
   * pick shrinking the pool, a recovered fetch) recovers instead of staying
   * dead for the rest of the draft. Omit for a boundary that should latch until
   * the subtree remounts.
   */
  resetKeys?: readonly unknown[]
}

interface ErrorBoundaryState {
  hasError: boolean
}

function resetKeysChanged(
  previous: readonly unknown[] | undefined,
  next: readonly unknown[] | undefined
): boolean {
  if (previous === undefined || next === undefined) return false
  if (previous.length !== next.length) return true
  for (let index = 0; index < previous.length; index++) {
    if (!Object.is(previous[index], next[index])) return true
  }
  return false
}

/**
 * Reusable render-error boundary — the sanctioned "wrapped in an error
 * boundary (major components)" mechanism from MASTER_CONTEXT's New Component
 * Checklist. React error boundaries must be class components, so this is the
 * one class component in the app.
 *
 * Scope note: this catches errors thrown during a child's render/commit, NOT
 * async rejections or event-handler throws (React's documented boundary
 * limits) — those surfaces already handle their own failures (the poll ticker
 * catches network faults; server actions return typed results). It exists so a
 * throw inside one live-enhancement region degrades that region alone rather
 * than bubbling to the route-segment error.tsx and taking down the whole
 * board. Raw error content is never rendered (Access Model data-exposure
 * posture) — only the caller-supplied quiet `fallback`.
 */
export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidUpdate(previousProps: ErrorBoundaryProps): void {
    if (
      this.state.hasError &&
      resetKeysChanged(previousProps.resetKeys, this.props.resetKeys)
    ) {
      this.setState({ hasError: false })
    }
  }

  render(): ReactNode {
    return this.state.hasError ? this.props.fallback : this.props.children
  }
}
