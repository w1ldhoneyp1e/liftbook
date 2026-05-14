"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"

import { cn } from "@/lib/utils"
import { useOverlayLayerContainer } from "./layers"

type PopoverProps = PopoverPrimitive.Root.Props & {
  backdropClassName?: string
  withBackdrop?: boolean
}

function Popover({
  backdropClassName,
  modal = "trap-focus",
  withBackdrop = true,
  ...props
}: PopoverProps) {
  return (
    <PopoverBackdropContext.Provider
      value={{
        backdropClassName,
        withBackdrop,
      }}
    >
      <PopoverPrimitive.Root
        modal={withBackdrop ? modal : false}
        {...props}
      />
    </PopoverBackdropContext.Provider>
  )
}

const PopoverBackdropContext = React.createContext<{
  backdropClassName?: string
  withBackdrop: boolean
}>({
  withBackdrop: true,
})

function PopoverTrigger({
  ...props
}: PopoverPrimitive.Trigger.Props & React.RefAttributes<HTMLElement>) {
  return <PopoverPrimitive.Trigger {...props} />
}

function PopoverPositioner({
  className,
  ...props
}: PopoverPrimitive.Positioner.Props & React.RefAttributes<HTMLDivElement>) {
  const { backdropClassName, withBackdrop } = React.useContext(
    PopoverBackdropContext
  )
  const container = useOverlayLayerContainer("popover")

  if (!container) {
    return null
  }

  return (
    <PopoverPrimitive.Portal container={container}>
      {withBackdrop ? (
        <PopoverPrimitive.Backdrop
          className={cn(
            "pointer-events-auto fixed inset-0 bg-background/10 backdrop-blur-[5px]",
            backdropClassName
          )}
        />
      ) : null}
      <PopoverPrimitive.Positioner
        className={cn("pointer-events-none outline-none", className)}
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
        "pointer-events-auto max-h-[var(--available-height)] overflow-auto rounded-2xl border border-border/50 bg-background/96 p-3 shadow-lg outline-none",
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
