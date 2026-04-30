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
    <div className="grid grid-cols-[2.25rem_1fr_2.25rem] items-center rounded-xl border border-border/50 bg-background shadow-sm">
      <button
        aria-label={decreaseLabel}
        className="h-11 text-base font-medium text-muted-foreground transition-colors hover:text-foreground"
        type="button"
        onClick={() => onIncrement(-step)}
      >
        -
      </button>
      <div className="relative">
        <Input
          aria-label={ariaLabel}
          className="h-11 border-0 px-2 pr-9 text-center text-base font-semibold shadow-none focus-visible:ring-0"
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
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {suffix}
        </span>
      </div>
      <button
        aria-label={increaseLabel}
        className="h-11 text-base font-medium text-muted-foreground transition-colors hover:text-foreground"
        type="button"
        onClick={() => onIncrement(step)}
      >
        +
      </button>
    </div>
  )
}
