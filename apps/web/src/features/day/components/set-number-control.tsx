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
  const [editing, setEditing] = useState(false)

  function commitDraft() {
    const parsed = Number(draft.replace(",", "."))

    if (Number.isFinite(parsed)) {
      onCommit(parsed)
      setEditing(false)
      return
    }

    setDraft(formatNumber(value))
    setEditing(false)
  }

  return (
    <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-2">
      <button
        aria-label={decreaseLabel}
        className="flex h-12 items-center justify-center rounded-xl bg-muted/45 text-lg font-medium text-muted-foreground ring-1 ring-border/35 transition-colors hover:bg-muted/65 hover:text-foreground"
        type="button"
        onClick={() => onIncrement(-step)}
      >
        -
      </button>
      <div className="relative rounded-xl bg-muted/28 ring-1 ring-border/35">
        <Input
          aria-label={ariaLabel}
          className="h-12 border-0 bg-transparent px-3 pr-10 text-center text-lg font-semibold shadow-none focus-visible:ring-0"
          inputMode="decimal"
          value={editing ? draft : formatNumber(value)}
          onBlur={commitDraft}
          onChange={(event) => {
            setEditing(true)
            setDraft(event.target.value)
          }}
          onFocus={() => {
            setEditing(true)
            setDraft(formatNumber(value))
          }}
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
        className="flex h-12 items-center justify-center rounded-xl bg-muted/45 text-lg font-medium text-muted-foreground ring-1 ring-border/35 transition-colors hover:bg-muted/65 hover:text-foreground"
        type="button"
        onClick={() => onIncrement(step)}
      >
        +
      </button>
    </div>
  )
}
