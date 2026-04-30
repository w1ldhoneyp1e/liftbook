"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"

import { cn } from "@/lib/utils"

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root modal="trap-focus" {...props} />
}

function PopoverTrigger({
  ...props
}: PopoverPrimitive.Trigger.Props & React.RefAttributes<HTMLElement>) {
  return <PopoverPrimitive.Trigger {...props} />
}

function PopoverPositioner({
  className,
  ...props
}: PopoverPrimitive.Positioner.Props & React.RefAttributes<HTMLDivElement>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Backdrop className="fixed inset-0 z-40 bg-background/10 backdrop-blur-[5px]" />
      <PopoverPrimitive.Positioner
        className={cn("z-50 outline-none", className)}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

function PopoverPopup({
  className,
  ...props
}: PopoverPrimitive.Popup.Props & React.RefAttributes<HTMLDivElement>) {
  return (
    <PopoverPrimitive.Popup
      className={cn(
        "max-h-[var(--available-height)] overflow-auto rounded-2xl border border-border/50 bg-background/96 p-3 shadow-lg outline-none",
        className
      )}
      {...props}
    />
  )
}

function PopoverClose({
  ...props
}: PopoverPrimitive.Close.Props & React.RefAttributes<HTMLButtonElement>) {
  return <PopoverPrimitive.Close {...props} />
}

export { Popover, PopoverClose, PopoverPopup, PopoverPositioner, PopoverTrigger }
