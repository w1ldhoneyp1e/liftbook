"use client"

import { createPortal } from "react-dom"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import { layers } from "./layers"

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
    <div className="fixed inset-0 isolate">
      <button
        className={cn(
          "absolute inset-0 block h-full w-full bg-black/10 supports-backdrop-filter:backdrop-blur-xs",
          layers.popupBackdrop
        )}
        type="button"
        aria-label="Close popup"
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          "pointer-events-none relative flex min-h-full items-center justify-center p-4",
          layers.popupContent
        )}
      >
        <div
          className={cn(
            "pointer-events-auto w-full max-w-sm rounded-2xl border border-border/60 bg-background/96 p-4 shadow-xl",
            contentClassName
          )}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
