"use client"

import { createPortal } from "react-dom"
import type { MouseEvent, PointerEvent, ReactNode, TouchEvent } from "react"

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
  function consumePointerEvent(
    event: MouseEvent<HTMLDivElement> | PointerEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>
  ) {
    event.preventDefault()
    event.stopPropagation()
  }

  if (!open || typeof document === "undefined") {
    return null
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[90] isolate touch-none"
      onClick={() => onOpenChange(false)}
      onClickCapture={consumePointerEvent}
      onMouseDownCapture={consumePointerEvent}
      onMouseUpCapture={consumePointerEvent}
      onPointerDownCapture={consumePointerEvent}
      onPointerUpCapture={consumePointerEvent}
      onTouchEndCapture={consumePointerEvent}
      onTouchMoveCapture={consumePointerEvent}
      onTouchStartCapture={consumePointerEvent}
    >
      <div className="absolute inset-0 bg-black/10 supports-backdrop-filter:backdrop-blur-xs" />
      <div className="relative flex min-h-full items-center justify-center p-4">
        <div
          className={
            contentClassName ??
            "w-full max-w-sm rounded-2xl border border-border/60 bg-background/96 p-4 shadow-xl"
          }
          onClick={(event) => event.stopPropagation()}
          onClickCapture={(event) => event.stopPropagation()}
          onMouseDownCapture={(event) => event.stopPropagation()}
          onMouseUpCapture={(event) => event.stopPropagation()}
          onPointerDownCapture={(event) => event.stopPropagation()}
          onPointerUpCapture={(event) => event.stopPropagation()}
          onTouchEndCapture={(event) => event.stopPropagation()}
          onTouchMoveCapture={(event) => event.stopPropagation()}
          onTouchStartCapture={(event) => event.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
