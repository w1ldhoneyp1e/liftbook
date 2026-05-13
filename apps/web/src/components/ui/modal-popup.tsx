"use client"

import { createPortal } from "react-dom"
import type { ReactNode } from "react"

type ModalPopupProps = {
  children: ReactNode
  contentClassName?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ModalPopup({
  children,
  contentClassName,
  open,
  onOpenChange,
}: ModalPopupProps) {
  if (!open || typeof document === "undefined") {
    return null
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[90] isolate"
      onClick={() => onOpenChange(false)}
      onMouseDown={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
    >
      <div className="absolute inset-0 bg-black/10 supports-backdrop-filter:backdrop-blur-xs" />
      <div className="relative flex min-h-full items-center justify-center p-4">
        <div
          className={
            contentClassName ??
            "w-full max-w-sm rounded-2xl border border-border/60 bg-background/96 p-4 shadow-xl"
          }
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
