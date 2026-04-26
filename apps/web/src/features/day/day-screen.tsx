"use client"

import {
  CalendarDays,
  ChevronDown,
  ChevronsDownUp,
  Plus,
  Search,
  Timer,
} from "lucide-react"

import { Button } from "@/components/ui/button"

import { useDayScreenData } from "./use-day-screen-data"

const selectedDate = "2026-04-26"

const days = [
  { day: "Mon", date: "22", state: "past" },
  { day: "Tue", date: "23", state: "past" },
  { day: "Wed", date: "24", state: "past" },
  { day: "Thu", date: "25", state: "past" },
  { day: "Today", date: "26", state: "today" },
  { day: "Sat", date: "27", state: "future" },
  { day: "Sun", date: "28", state: "future" },
]

export function DayScreen() {
  const { dictionary, exercisesById, locale, loading, settings, workoutDay } =
    useDayScreenData(selectedDate)

  const exerciseEntries = workoutDay?.exerciseEntries ?? []
  const unit = settings?.weightUnit ?? "kg"

  return (
    <div className="flex min-h-svh justify-center bg-zinc-100 text-foreground">
      <main className="flex min-h-svh w-full max-w-md flex-col bg-background">
        <header className="border-b border-border bg-emerald-50 px-4 pb-3 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-700">
                {dictionary.labels.today}
              </p>
              <h1 className="text-2xl font-semibold">Liftbook</h1>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                aria-label={dictionary.actions.search}
              >
                <Search />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label={dictionary.actions.calendar}
              >
                <CalendarDays />
              </Button>
            </div>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {days.map((item) => (
              <button
                key={`${item.day}-${item.date}`}
                className={`min-w-14 rounded-lg border px-2 py-2 text-center text-sm ${
                  item.state === "today"
                    ? "border-emerald-500 bg-white text-emerald-800"
                    : item.state === "future"
                      ? "border-sky-200 bg-sky-50 text-sky-800"
                      : "border-zinc-200 bg-zinc-50 text-zinc-500"
                }`}
              >
                <span className="block text-xs">{item.day}</span>
                <span className="block font-semibold">{item.date}</span>
              </button>
            ))}
          </div>
        </header>

        <section className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Timer className="size-4" />
            <span>{dictionary.labels.restTimer}</span>
          </div>
          <Button size="sm">{dictionary.actions.start}</Button>
        </section>

        <section className="flex flex-1 flex-col gap-3 px-4 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">
              {dictionary.labels.exercises}
            </h2>
            <Button variant="ghost" size="sm">
              <ChevronsDownUp />
              {dictionary.actions.collapseAll}
            </Button>
          </div>

          {loading ? (
            <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
              Loading...
            </div>
          ) : null}

          {!loading && exerciseEntries.length === 0 ? (
            <Button variant="outline" className="w-full">
              <Plus />
              {dictionary.actions.addExercise}
            </Button>
          ) : null}

          {exerciseEntries.map((entry) => {
            const exercise = exercisesById[entry.exerciseId]
            const primaryMuscleGroup = exercise?.muscleGroupIds[0]

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
                    aria-label={dictionary.actions.collapse}
                  >
                    <ChevronDown />
                  </Button>
                </div>

                <div className="space-y-2 p-3">
                  {entry.setEntries.map((set, index) => (
                    <div
                      key={set.id}
                      className="grid grid-cols-[2rem_1fr_1fr] items-center gap-2 rounded-lg bg-muted px-2 py-2"
                    >
                      <span className="text-center text-sm text-muted-foreground">
                        {index + 1}
                      </span>
                      <div className="rounded-md bg-background px-2 py-2 text-center text-sm font-medium">
                        {set.weight ?? 0} {dictionary.units[unit]}
                      </div>
                      <div className="rounded-md bg-background px-2 py-2 text-center text-sm font-medium">
                        {set.reps ?? 0} {dictionary.units.reps}
                      </div>
                    </div>
                  ))}

                  <button className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground">
                    <Plus className="size-4" />
                    {dictionary.actions.addSet}
                  </button>
                </div>
              </article>
            )
          })}

          {exerciseEntries.length > 0 ? (
            <Button variant="outline" className="mt-1 w-full">
              <Plus />
              {dictionary.actions.addExercise}
            </Button>
          ) : null}
        </section>
      </main>
    </div>
  )
}
