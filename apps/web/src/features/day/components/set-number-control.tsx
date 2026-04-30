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
    <div className="grid grid-cols-[1.75rem_1fr_1.75rem] items-center rounded-lg border border-border/50 bg-background shadow-sm">
      <button
        aria-label={decreaseLabel}
        className="h-10 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        type="button"
        onClick={() => onIncrement(-step)}
      >
        -
      </button>
      <div className="relative">
        <Input
          aria-label={ariaLabel}
          className="h-10 border-0 px-1 pr-8 text-center text-sm font-semibold shadow-none focus-visible:ring-0"
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
        <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
          {suffix}
        </span>
      </div>
      <button
        aria-label={increaseLabel}
        className="h-10 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        type="button"
        onClick={() => onIncrement(step)}
      >
        +
      </button>
    </div>
  )
}
