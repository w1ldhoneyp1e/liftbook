"use client"

import {
  CalendarDays,
  ChevronDown,
  ChevronsDownUp,
  Plus,
  Search,
  Settings,
  Timer,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { muscleGroups } from "@/shared/domain/exercise-catalog"
import type {
  DateState,
  Exercise,
  Locale,
  MuscleGroupId,
  UserSettings,
  WeightUnit,
} from "@/shared/domain/types"
import type { getDictionary } from "@/shared/i18n/dictionaries"

import { useDayScreenData } from "./use-day-screen-data"

type Dictionary = ReturnType<typeof getDictionary>

export function DayScreen() {
  const today = toDateKey(new Date())
  const [selectedDate, setSelectedDate] = useState(today)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [collapsedExerciseIds, setCollapsedExerciseIds] = useState<string[]>([])
  const [restSeconds, setRestSeconds] = useState(0)
  const [restTimerRunning, setRestTimerRunning] = useState(false)
  const {
    addExercise,
    addSet,
    dictionary,
    exerciseEntries,
    exercisesById,
    incrementNumber,
    locale,
    loading,
    settings,
    updateSettings,
    updateNumber,
  } = useDayScreenData(selectedDate)

  const unit = settings?.weightUnit ?? "kg"
  const weightStep = unit === "kg" ? (settings?.kgStep ?? 1) : (settings?.lbStep ?? 2.5)
  const repsStep = settings?.repsStep ?? 1
  const days = useMemo(
    () => createDateStrip(selectedDate, dictionary.labels.today, locale),
    [dictionary.labels.today, locale, selectedDate]
  )
  const selectedDateState = getDateState(selectedDate, today)
  const dateStatusLabel = getDateStatusLabel(
    selectedDateState,
    dictionary,
    selectedDate
  )
  const dateTone = getDateTone(selectedDateState)
  const allExercisesCollapsed =
    exerciseEntries.length > 0 &&
    exerciseEntries.every((entry) => collapsedExerciseIds.includes(entry.id))

  useEffect(() => {
    if (!restTimerRunning) {
      return
    }

    const intervalId = window.setInterval(() => {
      setRestSeconds((seconds) => seconds + 1)
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [restTimerRunning])

  async function handleAddExercise(exerciseId: string) {
    await addExercise(exerciseId)
    setExercisePickerOpen(false)
  }

  function handleSelectDate(date: Date | undefined) {
    if (!date) {
      return
    }

    setSelectedDate(toDateKey(date))
    setCalendarOpen(false)
  }

  function handleToggleAllExercises() {
    setCollapsedExerciseIds(
      allExercisesCollapsed ? [] : exerciseEntries.map((entry) => entry.id)
    )
  }

  function handleToggleExercise(exerciseEntryId: string) {
    setCollapsedExerciseIds((current) =>
      current.includes(exerciseEntryId)
        ? current.filter((id) => id !== exerciseEntryId)
        : [...current, exerciseEntryId]
    )
  }

  return (
    <div className="flex min-h-svh justify-center bg-zinc-100 text-foreground">
      <main className="flex min-h-svh w-full max-w-md flex-col bg-background">
        <header
          className={`border-b px-4 pb-3 pt-4 ${dateTone.headerClassName}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${dateTone.labelClassName}`}>
                {dateStatusLabel}
              </p>
              <h1 className="text-2xl font-semibold">Liftbook</h1>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                aria-label={dictionary.actions.search}
                onClick={() => setExercisePickerOpen(true)}
              >
                <Search />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label={dictionary.actions.calendar}
                onClick={() => setCalendarOpen(true)}
              >
                <CalendarDays />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label={dictionary.actions.settings}
                onClick={() => setSettingsOpen(true)}
              >
                <Settings />
              </Button>
            </div>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {days.map((item) => (
              <button
                key={item.dateKey}
                className={`min-w-14 rounded-lg border px-2 py-2 text-center text-sm ${getDateButtonClassName(
                  item.state,
                  item.selected
                )}`}
                type="button"
                onClick={() => setSelectedDate(item.dateKey)}
              >
                <span className="block text-xs">{item.day}</span>
                <span className="block font-semibold">{item.date}</span>
              </button>
            ))}
          </div>

          {selectedDate !== today ? (
            <Button
              variant="outline"
              size="sm"
              className="mt-3 bg-white/80"
              onClick={() => setSelectedDate(today)}
            >
              {dictionary.actions.goToToday}
            </Button>
          ) : null}
        </header>

        <section className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Timer className="size-4" />
            <span>{dictionary.labels.restTimer}</span>
            </div>
            <div className="mt-0.5 font-mono text-xl font-semibold">
              {formatTimer(restSeconds)}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              size="sm"
              onClick={() => setRestTimerRunning((running) => !running)}
            >
              {restTimerRunning
                ? dictionary.actions.pause
                : dictionary.actions.start}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRestTimerRunning(false)
                setRestSeconds(0)
              }}
            >
              {dictionary.actions.reset}
            </Button>
          </div>
        </section>

        <section className="flex flex-1 flex-col gap-3 px-4 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">
              {dictionary.labels.exercises}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleAllExercises}
            >
              <ChevronsDownUp />
              {allExercisesCollapsed
                ? dictionary.actions.expandAll
                : dictionary.actions.collapseAll}
            </Button>
          </div>

          {loading ? (
            <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
              {dictionary.labels.loading}
            </div>
          ) : null}

          {!loading && exerciseEntries.length === 0 ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setExercisePickerOpen(true)}
            >
              <Plus />
              {dictionary.actions.addExercise}
            </Button>
          ) : null}

          {exerciseEntries.map((entry) => {
            const exercise = exercisesById[entry.exerciseId]
            const primaryMuscleGroup = exercise?.muscleGroupIds[0]
            const collapsed = collapsedExerciseIds.includes(entry.id)

            return (
              <article
                key={entry.id}
                className="rounded-lg border border-border bg-card text-card-foreground"
              >
                <div className="flex items-center justify-between border-b border-border px-3 py-3">
                  <div>
                    <h3 className="font-medium">
                      {exercise?.name[locale] ?? entry.exerciseId}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {primaryMuscleGroup
                        ? dictionary.muscleGroups[primaryMuscleGroup]
                        : ""}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={
                      collapsed
                        ? dictionary.actions.expand
                        : dictionary.actions.collapse
                    }
                    onClick={() => handleToggleExercise(entry.id)}
                  >
                    <ChevronDown
                      className={collapsed ? "-rotate-90 transition-transform" : "transition-transform"}
                    />
                  </Button>
                </div>

                <div className={collapsed ? "hidden" : "space-y-2 p-3"}>
                  {entry.setEntries.map((set, index) => (
                    <div
                      key={set.id}
                      className="grid grid-cols-[2rem_1fr_1fr] items-center gap-2 rounded-lg bg-muted px-2 py-2"
                    >
                      <span className="text-center text-sm text-muted-foreground">
                        {index + 1}
                      </span>
                      <SetNumberControl
                        key={`weight-${set.id}-${set.weight ?? 0}`}
                        ariaLabel={`${exercise?.name[locale] ?? entry.exerciseId} set ${
                          index + 1
                        } ${dictionary.units[unit]}`}
                        decreaseLabel={dictionary.actions.decrease}
                        increaseLabel={dictionary.actions.increase}
                        step={weightStep}
                        suffix={dictionary.units[unit]}
                        value={set.weight ?? 0}
                        onCommit={(value) =>
                          updateNumber(entry.id, set.id, "weight", value)
                        }
                        onIncrement={(delta) =>
                          incrementNumber(entry.id, set.id, "weight", delta)
                        }
                      />
                      <SetNumberControl
                        key={`reps-${set.id}-${set.reps ?? 0}`}
                        ariaLabel={`${exercise?.name[locale] ?? entry.exerciseId} set ${
                          index + 1
                        } ${dictionary.units.reps}`}
                        decreaseLabel={dictionary.actions.decrease}
                        increaseLabel={dictionary.actions.increase}
                        step={repsStep}
                        suffix={dictionary.units.reps}
                        value={set.reps ?? 0}
                        onCommit={(value) =>
                          updateNumber(entry.id, set.id, "reps", value)
                        }
                        onIncrement={(delta) =>
                          incrementNumber(entry.id, set.id, "reps", delta)
                        }
                      />
                    </div>
                  ))}

                  <button
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground"
                    type="button"
                    onClick={() => addSet(entry.id)}
                  >
                    <Plus className="size-4" />
                    {dictionary.actions.addSet}
                  </button>
                </div>
              </article>
            )
          })}

          {exerciseEntries.length > 0 ? (
            <Button
              variant="outline"
              className="mt-1 w-full"
              onClick={() => setExercisePickerOpen(true)}
            >
              <Plus />
              {dictionary.actions.addExercise}
            </Button>
          ) : null}
        </section>
      </main>

      <ExercisePickerDrawer
        dictionary={dictionary}
        exercises={Object.values(exercisesById)}
        locale={locale}
        open={exercisePickerOpen}
        onOpenChange={setExercisePickerOpen}
        onSelectExercise={handleAddExercise}
      />

      <CalendarDrawer
        dictionary={dictionary}
        locale={locale}
        open={calendarOpen}
        selectedDate={selectedDate}
        onOpenChange={setCalendarOpen}
        onSelectDate={handleSelectDate}
      />

      {settings ? (
        <SettingsDrawer
          dictionary={dictionary}
          open={settingsOpen}
          settings={settings}
          onOpenChange={setSettingsOpen}
          onUpdateSettings={updateSettings}
        />
      ) : null}
    </div>
  )
}

type SettingsDrawerProps = {
  dictionary: Dictionary
  open: boolean
  settings: UserSettings
  onOpenChange: (open: boolean) => void
  onUpdateSettings: (
    patch: Partial<Omit<UserSettings, "id" | "updatedAt">>
  ) => void
}

function SettingsDrawer({
  dictionary,
  open,
  settings,
  onOpenChange,
  onUpdateSettings,
}: SettingsDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-md rounded-t-xl bg-background">
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

type CalendarDrawerProps = {
  dictionary: Dictionary
  locale: Locale
  open: boolean
  selectedDate: string
  onOpenChange: (open: boolean) => void
  onSelectDate: (date: Date | undefined) => void
}

function CalendarDrawer({
  dictionary,
  locale,
  open,
  selectedDate,
  onOpenChange,
  onSelectDate,
}: CalendarDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-md rounded-t-xl bg-background">
        <DrawerHeader className="text-left">
          <DrawerTitle>{dictionary.actions.calendar}</DrawerTitle>
          <DrawerDescription>{selectedDate}</DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4">
          <Calendar
            mode="single"
            locale={{ code: locale }}
            selected={new Date(`${selectedDate}T12:00:00`)}
            className="mx-auto"
            onSelect={onSelectDate}
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}

type ExercisePickerDrawerProps = {
  dictionary: Dictionary
  exercises: Exercise[]
  locale: Locale
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectExercise: (exerciseId: string) => void
}

function ExercisePickerDrawer({
  dictionary,
  exercises,
  locale,
  open,
  onOpenChange,
  onSelectExercise,
}: ExercisePickerDrawerProps) {
  const [selectedMuscleGroup, setSelectedMuscleGroup] =
    useState<MuscleGroupId>("chest")
  const [query, setQuery] = useState("")

  const filteredExercises = exercises
    .filter((exercise) => exercise.muscleGroupIds.includes(selectedMuscleGroup))
    .filter((exercise) =>
      exercise.name[locale].toLowerCase().includes(query.trim().toLowerCase())
    )
    .sort((a, b) => a.name[locale].localeCompare(b.name[locale]))

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-h-[85svh] max-w-md rounded-t-xl bg-background">
        <DrawerHeader className="text-left">
          <DrawerTitle>{dictionary.actions.chooseExercise}</DrawerTitle>
          <DrawerDescription>{dictionary.labels.searchExercise}</DrawerDescription>
        </DrawerHeader>

        <div className="space-y-3 overflow-hidden px-4 pb-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-10 pl-9"
              placeholder={dictionary.labels.searchExercise}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {muscleGroups.map((muscleGroup) => (
              <button
                key={muscleGroup}
                className={`h-8 shrink-0 rounded-lg border px-3 text-sm ${
                  selectedMuscleGroup === muscleGroup
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground"
                }`}
                type="button"
                onClick={() => setSelectedMuscleGroup(muscleGroup)}
              >
                {dictionary.muscleGroups[muscleGroup]}
              </button>
            ))}
          </div>

          <div className="max-h-[45svh] space-y-2 overflow-y-auto pb-2">
            {filteredExercises.length === 0 ? (
              <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                {dictionary.labels.noExercisesFound}
              </div>
            ) : null}

            {filteredExercises.map((exercise) => (
              <button
                key={exercise.id}
                className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-3 text-left"
                type="button"
                onClick={() => onSelectExercise(exercise.id)}
              >
                <span>
                  <span className="block text-sm font-medium">
                    {exercise.name[locale]}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {exercise.muscleGroupIds
                      .map((muscleGroup) => dictionary.muscleGroups[muscleGroup])
                      .join(", ")}
                  </span>
                </span>
                <Plus className="size-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

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

function SetNumberControl({
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

  function commitDraft() {
    const parsed = Number(draft.replace(",", "."))

    if (Number.isFinite(parsed)) {
      onCommit(parsed)
      return
    }

    setDraft(formatNumber(value))
  }

  return (
    <div className="grid grid-cols-[1.75rem_1fr_1.75rem] items-center rounded-md bg-background">
      <button
        aria-label={decreaseLabel}
        className="h-9 text-sm text-muted-foreground"
        type="button"
        onClick={() => onIncrement(-step)}
      >
        -
      </button>
      <div className="relative">
        <Input
          aria-label={ariaLabel}
          className="h-9 border-0 px-1 pr-8 text-center text-sm font-medium shadow-none focus-visible:ring-0"
          inputMode="decimal"
          value={draft}
          onBlur={commitDraft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur()
            }
          }}
        />
        <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
          {suffix}
        </span>
      </div>
      <button
        aria-label={increaseLabel}
        className="h-9 text-sm text-muted-foreground"
        type="button"
        onClick={() => onIncrement(step)}
      >
        +
      </button>
    </div>
  )
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : String(value)
}

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const restSeconds = seconds % 60

  return `${String(minutes).padStart(2, "0")}:${String(restSeconds).padStart(2, "0")}`
}

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function createDateStrip(
  selectedDate: string,
  todayLabel: string,
  locale: Locale
) {
  const selected = new Date(`${selectedDate}T12:00:00`)
  const today = toDateKey(new Date())

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(selected)
    date.setDate(selected.getDate() + index - 3)
    const dateKey = toDateKey(date)
    const isToday = dateKey === today

    return {
      date: String(date.getDate()),
      dateKey,
      day: isToday
        ? todayLabel
        : new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date),
      selected: dateKey === selectedDate,
      state: getDateState(dateKey, today),
    }
  })
}

function getDateState(dateKey: string, todayKey: string): DateState {
  if (dateKey === todayKey) {
    return "today"
  }

  return dateKey < todayKey ? "past" : "future"
}

function getDateStatusLabel(
  state: DateState,
  dictionary: Dictionary,
  selectedDate: string
) {
  if (state === "today") {
    return dictionary.labels.today
  }

  return `${state === "past" ? dictionary.labels.pastDate : dictionary.labels.futureDate} · ${selectedDate}`
}

function getDateTone(state: DateState) {
  if (state === "today") {
    return {
      headerClassName: "border-emerald-100 bg-emerald-50",
      labelClassName: "text-emerald-700",
    }
  }

  if (state === "future") {
    return {
      headerClassName: "border-sky-100 bg-sky-50",
      labelClassName: "text-sky-700",
    }
  }

  return {
    headerClassName: "border-zinc-200 bg-zinc-50",
    labelClassName: "text-zinc-600",
  }
}

function getDateButtonClassName(state: DateState, selected: boolean) {
  if (selected && state === "today") {
    return "border-emerald-600 bg-white text-emerald-900 ring-2 ring-emerald-500/30"
  }

  if (selected && state === "future") {
    return "border-sky-600 bg-white text-sky-900 ring-2 ring-sky-500/30"
  }

  if (selected) {
    return "border-zinc-500 bg-white text-zinc-900 ring-2 ring-zinc-400/30"
  }

  if (state === "today") {
    return "border-emerald-300 bg-white/80 text-emerald-800"
  }

  if (state === "future") {
    return "border-sky-200 bg-sky-50 text-sky-800"
  }

  return "border-zinc-200 bg-zinc-50 text-zinc-500"
}
