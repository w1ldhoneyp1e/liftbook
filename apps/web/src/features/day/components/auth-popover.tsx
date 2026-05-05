"use client"

import { CircleUserRound, X } from "lucide-react"
import { useState } from "react"
import { createPortal } from "react-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AccountSession } from "@/shared/domain/types"
import type { Dictionary } from "@/shared/i18n/dictionaries"

type AuthPopoverProps = {
  accountConnecting: boolean
  accountError: boolean
  accountSession: AccountSession | null
  authError: string | null
  authSubmitting: boolean
  dictionary: Dictionary
  onCreateGuestAccount: () => void
  onLoginAccount: (email: string, password: string) => Promise<void> | void
  onLogoutAccount: () => Promise<void> | void
  onRegisterAccount: (email: string, password: string) => Promise<void> | void
}

export function AuthPopover({
  accountConnecting,
  accountError,
  accountSession,
  authError,
  authSubmitting,
  dictionary,
  onCreateGuestAccount,
  onLoginAccount,
  onLogoutAccount,
  onRegisterAccount,
}: AuthPopoverProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState(accountSession?.email ?? "")
  const [password, setPassword] = useState("")

  const isRegisteredAccount = accountSession?.kind === "account"
  const statusLabel = isRegisteredAccount
    ? dictionary.labels.accountConnected
    : accountSession
      ? dictionary.labels.accountGuestConnected
      : dictionary.labels.accountLocalOnly

  async function handleRegister() {
    await onRegisterAccount(email, password)
    setPassword("")
  }

  async function handleLogin() {
    await onLoginAccount(email, password)
    setPassword("")
  }

  async function handleLogout() {
    await onLogoutAccount()
    setOpen(false)
    setPassword("")
  }

  return (
    <>
      <button
        className="inline-flex size-9 items-center justify-center rounded-xl border border-border/70 bg-background/92 text-foreground shadow-sm transition-colors hover:bg-muted/50 dark:bg-card/80 dark:hover:bg-muted/45"
        type="button"
        aria-label={dictionary.labels.account}
        onClick={() => setOpen(true)}
      >
        <CircleUserRound className="size-[18px]" />
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/10 p-4 supports-backdrop-filter:backdrop-blur-xs"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border/60 bg-background/96 p-4 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold">{dictionary.labels.account}</p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={dictionary.actions.cancel}
                onClick={() => setOpen(false)}
              >
                <X />
              </Button>
            </div>

            <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold">{statusLabel}</p>
              <p className="mt-1 break-all text-xs text-muted-foreground">
                {accountSession?.email ?? accountSession?.userId ?? "Liftbook"}
              </p>
            </div>

            {!accountSession ? (
              <Button
                className="w-full"
                size="sm"
                disabled={accountConnecting}
                onClick={onCreateGuestAccount}
              >
                {dictionary.actions.createGuestAccount}
              </Button>
            ) : null}

            {accountError ? (
              <p className="text-xs text-destructive">
                {dictionary.labels.connectionError}
              </p>
            ) : null}

            {accountSession ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  void handleLogout()
                }}
              >
                {dictionary.actions.logout}
              </Button>
            ) : null}

            {!isRegisteredAccount ? (
              <div className="space-y-3 border-t border-border/60 pt-4">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {accountSession
                    ? dictionary.labels.authRegisteredHint
                    : dictionary.labels.authRegisterHint}
                </p>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    {dictionary.labels.authEmail}
                  </Label>
                  <Input
                    autoCapitalize="none"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    {dictionary.labels.authPassword}
                  </Label>
                  <Input
                    autoComplete="current-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    disabled={authSubmitting}
                    onClick={() => {
                      void handleLogin()
                    }}
                  >
                    {dictionary.actions.login}
                  </Button>
                  <Button
                    disabled={authSubmitting}
                    onClick={() => {
                      void handleRegister()
                    }}
                  >
                    {dictionary.actions.register}
                  </Button>
                </div>

                {authError ? (
                  <p className="text-xs text-destructive">{authError}</p>
                ) : null}
              </div>
            ) : null}
            </div>
          </div>
        </div>,
        document.body
      ) : null}
    </>
  )
}
