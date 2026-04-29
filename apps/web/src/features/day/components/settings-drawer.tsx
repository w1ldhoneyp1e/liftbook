"use client"

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type {
  AccountSession,
  Locale,
  UserSettings,
  WeightUnit,
} from "@/shared/domain/types"
import type { Dictionary } from "@/shared/i18n/dictionaries"

type SettingsDrawerProps = {
  accountConnecting: boolean
  accountError: boolean
  accountSession: AccountSession | null
  dictionary: Dictionary
  open: boolean
  settings: UserSettings
  syncSummary: {
    pending: number
    synced: number
  }
  syncError: boolean
  syncing: boolean
  onCreateGuestAccount: () => void
  onOpenChange: (open: boolean) => void
  onSyncNow: () => void
  onUpdateSettings: (
    patch: Partial<Omit<UserSettings, "id" | "updatedAt">>
  ) => void
}

export function SettingsDrawer({
  accountConnecting,
  accountError,
  accountSession,
  dictionary,
  open,
  settings,
  syncSummary,
  syncError,
  syncing,
  onCreateGuestAccount,
  onOpenChange,
  onSyncNow,
  onUpdateSettings,
}: SettingsDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-h-[92svh] max-w-md rounded-t-xl bg-background">
        <DrawerHeader className="text-left">
          <DrawerTitle>{dictionary.actions.settings}</DrawerTitle>
          <DrawerDescription>Liftbook</DrawerDescription>
        </DrawerHeader>

        <div className="space-y-5 px-4 pb-4">
          <section className="space-y-2">
            <Label className="text-sm font-medium">
              {dictionary.labels.account}
            </Label>
            <div className="rounded-lg bg-muted px-3 py-3">
              <div className="text-sm font-medium">
                {accountSession
                  ? dictionary.labels.accountConnected
                  : dictionary.labels.accountLocalOnly}
              </div>
              <div className="mt-1 break-all text-xs text-muted-foreground">
                {accountSession?.userId ?? "Liftbook"}
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
              {accountSession ? (
                <div className="mt-3 rounded-md bg-background px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">
                        {dictionary.labels.syncStatus}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {syncError
                          ? dictionary.labels.syncFailed
                          : syncSummary.pending > 0
                            ? `${dictionary.labels.syncReady}: ${syncSummary.pending}`
                            : dictionary.labels.syncSuccess}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      disabled={syncing || syncSummary.pending === 0}
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
                      label={dictionary.labels.syncStatus}
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
            label={dictionary.labels.previousResultDefaults}
            onCheckedChange={(previousResultDefaults) =>
              onUpdateSettings({ previousResultDefaults })
            }
          />

          <SettingsSwitchRow
            checked={settings.autoRestTimer}
            label={dictionary.labels.autoRestTimer}
            onCheckedChange={(autoRestTimer) =>
              onUpdateSettings({ autoRestTimer })
            }
          />
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
      ? "bg-emerald-50 text-emerald-700"
      : tone === "warning"
        ? "bg-amber-50 text-amber-700"
        : "bg-zinc-100 text-zinc-700"

  return (
    <div className={`rounded-md px-2 py-2 text-center ${toneClassName}`}>
      <div className="text-sm font-semibold">{value}</div>
      <div className="mt-0.5 text-[10px] leading-tight">{label}</div>
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
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            className={`h-9 rounded-lg border text-sm ${
              option.value === value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground"
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
  label: string
  onCheckedChange: (checked: boolean) => void
}

function SettingsSwitchRow({
  checked,
  label,
  onCheckedChange,
}: SettingsSwitchRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-3">
      <Label className="text-sm font-medium">{label}</Label>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
