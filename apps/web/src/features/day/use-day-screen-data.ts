"use client"

import { useEffect, useState } from "react"

import { getDictionary } from "@/shared/i18n/dictionaries"
import type { Exercise, UserSettings, WorkoutDay } from "@/shared/domain/types"
import { db } from "@/shared/db/schema"
import { seedLocalDatabase } from "@/shared/db/seed"

type DayScreenData = {
  settings: UserSettings | null
  workoutDay: WorkoutDay | null
  exercisesById: Record<string, Exercise>
  loading: boolean
}

export function useDayScreenData(date: string) {
  const [state, setState] = useState<DayScreenData>({
    settings: null,
    workoutDay: null,
    exercisesById: {},
    loading: true,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      await seedLocalDatabase()

      const [settings, workoutDay, exercises] = await Promise.all([
        db.userSettings.get("local"),
        db.workoutDays.where("date").equals(date).first(),
        db.exercises.toArray(),
      ])

      if (cancelled) {
        return
      }

      setState({
        settings: settings ?? null,
        workoutDay: workoutDay ?? null,
        exercisesById: Object.fromEntries(
          exercises.map((exercise) => [exercise.id, exercise])
        ),
        loading: false,
      })
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [date])

  const locale = state.settings?.locale ?? "en"

  return {
    ...state,
    locale,
    dictionary: getDictionary(locale),
  }
}
