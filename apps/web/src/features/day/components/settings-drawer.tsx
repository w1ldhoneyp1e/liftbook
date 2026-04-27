"use client"

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { Locale, UserSettings, WeightUnit } from "@/shared/domain/types"
import type { Dictionary } from "@/shared/i18n/dictionaries"

type SettingsDrawerProps = {
  dictionary: Dictionary
  open: boolean
  settings: UserSettings
  onOpenChange: (open: boolean) => void
  onUpdateSettings: (
    patch: Partial<Omit<UserSettings, "id" | "updatedAt">>
  ) => void
}

export function SettingsDrawer({
  dictionary,
  open,
  settings,
  onOpenChange,
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
