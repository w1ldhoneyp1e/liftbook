"use client"

import { useState } from "react"

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type {
  AccountSession,
  Locale,
  ThemeMode,
  UserSettings,
  WeightUnit,
} from "@/shared/domain/types"
import type { Dictionary } from "@/shared/i18n/dictionaries"
import {
  applyThemeMode,
  persistThemeMode,
} from "@/shared/theme/theme-mode"
import { APP_VERSION } from "@/shared/app/version"

type SettingsDrawerProps = {
  accountConnecting: boolean
  accountError: boolean
  accountSession: AccountSession | null
  authError: string | null
  authSubmitting: boolean
  dictionary: Dictionary
  open: boolean
  settings: UserSettings
  syncSummary: {
    pending: number
    synced: number
  }
  isOnline: boolean
  syncMode: "auto" | "manual" | null
  syncError: boolean
  syncing: boolean
  onCreateGuestAccount: () => void
  onLoginAccount: (email: string, password: string) => Promise<void> | void
  onOpenChange: (open: boolean) => void
  onRegisterAccount: (email: string, password: string) => Promise<void> | void
  onSyncNow: () => void
  onUpdateSettings: (
    patch: Partial<Omit<UserSettings, "id" | "updatedAt">>
  ) => void
}

export function SettingsDrawer({
  accountConnecting,
  accountError,
  accountSession,
  authError,
  authSubmitting,
  dictionary,
  open,
  settings,
  syncSummary,
  isOnline,
  syncMode,
  syncError,
  syncing,
  onCreateGuestAccount,
  onLoginAccount,
  onOpenChange,
  onRegisterAccount,
  onSyncNow,
  onUpdateSettings,
}: SettingsDrawerProps) {
  const [email, setEmail] = useState(accountSession?.email ?? "")
  const [password, setPassword] = useState("")
  const syncStatusText = syncError
    ? dictionary.labels.syncFailed
    : syncing && (syncMode === "manual" || syncSummary.pending > 0)
      ? dictionary.labels.syncInProgress
      : !isOnline
        ? dictionary.labels.syncOffline
        : syncSummary.pending > 0
          ? `${dictionary.labels.syncReady}: ${syncSummary.pending}`
          : dictionary.labels.syncSuccess
  const isRegisteredAccount = accountSession?.kind === "account"

  async function handleRegister() {
    await onRegisterAccount(email, password)
    setPassword("")
  }

  async function handleLogin() {
    await onLoginAccount(email, password)
    setPassword("")
  }

  return (
    <Drawer direction="top" open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-h-[92svh] max-w-md rounded-b-2xl bg-background/98 backdrop-blur">
        <DrawerHeader className="text-left">
          <DrawerTitle>{dictionary.actions.settings}</DrawerTitle>
          <DrawerDescription>Liftbook</DrawerDescription>
        </DrawerHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <section className="space-y-2">
            <Label className="text-sm font-medium">
              {dictionary.labels.account}
            </Label>
            <div className="rounded-xl border border-border/60 bg-card/95 px-3 py-3 shadow-sm dark:border-border dark:bg-card/92 dark:shadow-[0_12px_30px_rgba(0,0,0,0.2)]">
              <div className="text-sm font-medium">
                {isRegisteredAccount
                  ? dictionary.labels.accountConnected
                  : accountSession
                    ? dictionary.labels.accountGuestConnected
                    : dictionary.labels.accountLocalOnly}
              </div>
              <div className="mt-1 break-all text-xs text-muted-foreground">
                {accountSession?.email ?? accountSession?.userId ?? "Liftbook"}
              </div>
              {!accountSession ? (
                <Button
                  className="mt-3 w-full"
                  size="sm"
                  disabled={accountConnecting}
                  onClick={onCreateGuestAccount}
                >
                  {dictionary.actions.createGuestAccount}
                </Button>
              ) : null}
              {accountError ? (
                <p className="mt-2 text-xs text-destructive">
                  {dictionary.labels.connectionError}
                </p>
              ) : null}
              {!isRegisteredAccount ? (
                <div className="mt-4 border-t border-border/60 pt-4">
                  <div className="text-sm font-medium">
                    {dictionary.labels.account}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {accountSession
                      ? dictionary.labels.authRegisteredHint
                      : dictionary.labels.authRegisterHint}
                  </p>
                  <div className="mt-3 space-y-2">
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
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
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
                    <p className="mt-2 text-xs text-destructive">{authError}</p>
                  ) : null}
                </div>
              ) : null}
              {accountSession ? (
                <div className="mt-4 border-t border-border/60 pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">
                        {dictionary.labels.syncStatus}
                      </div>
                      <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {syncStatusText}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="shrink-0"
                      disabled={!isOnline || (syncing && syncMode === "manual")}
                      onClick={onSyncNow}
                    >
                      {dictionary.actions.syncNow}
                    </Button>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <SyncBadge
                      label={dictionary.labels.syncPending}
                      tone="warning"
                      value={syncSummary.pending}
                    />
                    <SyncBadge
                      label={dictionary.labels.syncSynced}
                      tone="success"
                      value={syncSummary.synced}
                    />
                    <SyncBadge
                      label={dictionary.labels.syncRecords}
                      tone="neutral"
                      value={syncSummary.pending + syncSummary.synced}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <SettingsSegment<Locale>
            label={dictionary.labels.language}
            options={[
              { label: "English", value: "en" },
              { label: "Русский", value: "ru" },
            ]}
            value={settings.locale}
            onChange={(locale) => onUpdateSettings({ locale })}
          />

          <SettingsSegment<ThemeMode>
            label={dictionary.labels.theme}
            options={[
              { label: dictionary.labels.themeSystem, value: "system" },
              { label: dictionary.labels.themeLight, value: "light" },
              { label: dictionary.labels.themeDark, value: "dark" },
            ]}
            value={settings.themeMode}
            onChange={(themeMode) => {
              persistThemeMode(themeMode)
              applyThemeMode(themeMode)
              onUpdateSettings({ themeMode })
            }}
          />

          <SettingsSegment<WeightUnit>
            label={dictionary.labels.weightUnit}
            options={[
              { label: dictionary.units.kg, value: "kg" },
              { label: dictionary.units.lb, value: "lb" },
            ]}
            value={settings.weightUnit}
            onChange={(weightUnit) => onUpdateSettings({ weightUnit })}
          />

          <SettingsSwitchRow
            checked={settings.previousResultDefaults}
            description={dictionary.labels.previousResultDefaultsHelp}
            label={dictionary.labels.previousResultDefaults}
            onCheckedChange={(previousResultDefaults) =>
              onUpdateSettings({ previousResultDefaults })
            }
          />

          <SettingsSwitchRow
            checked={settings.autoRestTimer}
            description={dictionary.labels.autoRestTimerHelp}
            label={dictionary.labels.autoRestTimer}
            onCheckedChange={(autoRestTimer) =>
              onUpdateSettings({ autoRestTimer })
            }
          />

          <section className="space-y-2">
            <Label className="text-sm font-medium">Liftbook</Label>
            <div className="rounded-xl border border-border/70 bg-card/92 px-3 py-3 text-sm text-muted-foreground dark:bg-card/80">
              v{APP_VERSION}
            </div>
          </section>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

type SyncBadgeProps = {
  label: string
  tone: "neutral" | "success" | "warning"
  value: number
}

function SyncBadge({ label, tone, value }: SyncBadgeProps) {
  const toneClassName =
    tone === "success"
      ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
      : tone === "warning"
        ? "bg-amber-500/12 text-amber-700 dark:text-amber-300"
        : "bg-muted/75 text-foreground dark:bg-muted/55"

  return (
    <div
      className={`flex min-h-[4.5rem] flex-col items-center justify-center rounded-md px-2 py-2 text-center ${toneClassName}`}
    >
      <div className="text-sm font-semibold">{value}</div>
      <div className="mt-1 text-[10px] leading-tight text-balance break-words">
        {label}
      </div>
    </div>
  )
}

type SettingsSegmentProps<TValue extends string> = {
  label: string
  options: Array<{ label: string; value: TValue }>
  value: TValue
  onChange: (value: TValue) => void
}

function SettingsSegment<TValue extends string>({
  label,
  options,
  value,
  onChange,
}: SettingsSegmentProps<TValue>) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div
        className={`grid gap-2 ${
          options.length === 3 ? "grid-cols-3" : "grid-cols-2"
        }`}
      >
        {options.map((option) => (
          <button
            key={option.value}
            className={`h-9 rounded-lg border text-sm ${
              option.value === value
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border/70 bg-card/90 text-foreground hover:bg-muted/50 dark:bg-card/80 dark:hover:bg-muted/45"
            }`}
            type="button"
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

type SettingsSwitchRowProps = {
  checked: boolean
  description?: string
  label: string
  onCheckedChange: (checked: boolean) => void
}

function SettingsSwitchRow({
  checked,
  description,
  label,
  onCheckedChange,
}: SettingsSwitchRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/92 px-3 py-3 dark:bg-card/80">
      <div className="min-w-0 flex-1">
        <Label className="text-sm font-medium">{label}</Label>
        {description ? (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
