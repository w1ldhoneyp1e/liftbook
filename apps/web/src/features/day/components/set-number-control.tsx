"use client"

import { useState } from "react"

import { Input } from "@/components/ui/input"

import { formatNumber } from "../lib/format"

type SetNumberControlProps = {
  ariaLabel: string
  decreaseLabel: string
  increaseLabel: string
  step: number
  suffix: string
  value: number
  onCommit: (value: number) => void
  onIncrement: (delta: number) => void
}

export function SetNumberControl({
  ariaLabel,
  decreaseLabel,
  increaseLabel,
  step,
  suffix,
  value,
  onCommit,
  onIncrement,
}: SetNumberControlProps) {
  const [draft, setDraft] = useState(formatNumber(value))

  function commitDraft() {
    const parsed = Number(draft.replace(",", "."))

    if (Number.isFinite(parsed)) {
      onCommit(parsed)
      return
    }

    setDraft(formatNumber(value))
  }

  return (
    <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-2">
      <button
        aria-label={decreaseLabel}
        className="flex h-12 items-center justify-center rounded-xl border border-border/50 bg-background text-lg font-medium text-muted-foreground shadow-sm transition-colors hover:text-foreground"
        type="button"
        onClick={() => onIncrement(-step)}
      >
        -
      </button>
      <div className="relative rounded-xl border border-border/50 bg-background shadow-sm">
        <Input
          aria-label={ariaLabel}
          className="h-12 border-0 px-3 pr-10 text-center text-lg font-semibold shadow-none focus-visible:ring-0"
          inputMode="decimal"
          value={draft}
          onBlur={commitDraft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur()
            }
          }}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          {suffix}
        </span>
      </div>
      <button
        aria-label={increaseLabel}
        className="flex h-12 items-center justify-center rounded-xl border border-border/50 bg-background text-lg font-medium text-muted-foreground shadow-sm transition-colors hover:text-foreground"
        type="button"
        onClick={() => onIncrement(step)}
      >
        +
      </button>
    </div>
  )
}
