"use client"

import { useCallback, useEffect, useState } from "react"

import { getDictionary } from "@/shared/i18n/dictionaries"
import type {
  Exercise,
  ExerciseEntry,
  SetEntry,
  UserSettings,
  WorkoutDay,
} from "@/shared/domain/types"
import { db } from "@/shared/db/schema"
import { seedLocalDatabase } from "@/shared/db/seed"

type DayScreenData = {
  settings: UserSettings | null
  workoutDay: WorkoutDay | null
  exerciseEntries: ExerciseEntry[]
  exercisesById: Record<string, Exercise>
  loading: boolean
}

export function useDayScreenData(date: string) {
  const [state, setState] = useState<DayScreenData>({
    settings: null,
    workoutDay: null,
    exerciseEntries: [],
    exercisesById: {},
    loading: true,
  })

  const load = useCallback(async () => {
    await seedLocalDatabase()

    const [settings, workoutDay, exerciseEntries, exercises] = await Promise.all([
      db.userSettings.get("local"),
      db.workoutDays.where("date").equals(date).first(),
      db.exerciseEntries.where("workoutDate").equals(date).sortBy("position"),
      db.exercises.toArray(),
    ])

    setState({
      settings: settings ?? null,
      workoutDay: workoutDay ?? null,
      exerciseEntries,
      exercisesById: Object.fromEntries(
        exercises.map((exercise) => [exercise.id, exercise])
      ),
      loading: false,
    })
  }, [date])

  useEffect(() => {
    // Dexie is the local offline data source for this client-only screen.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const updateSet = useCallback(
    async (
      exerciseEntryId: string,
      setEntryId: string,
      patch: Partial<Pick<SetEntry, "reps" | "weight">>
    ) => {
      const entry = await db.exerciseEntries.get(exerciseEntryId)

      if (!entry) {
        return
      }

      const now = new Date().toISOString()
      const updatedEntry: ExerciseEntry = {
        ...entry,
        updatedAt: now,
        setEntries: entry.setEntries.map((setEntry) =>
          setEntry.id === setEntryId
            ? { ...setEntry, ...patch, updatedAt: now }
            : setEntry
        ),
      }

      await db.exerciseEntries.put(updatedEntry)
      await load()
    },
    [load]
  )

  const addSet = useCallback(
    async (exerciseEntryId: string) => {
      const entry = await db.exerciseEntries.get(exerciseEntryId)
      const settings = await db.userSettings.get("local")

      if (!entry) {
        return
      }

      const now = new Date().toISOString()
      const previousSet = entry.setEntries.at(-1)
      const newSet: SetEntry = {
        id: createLocalId("set"),
        weight: previousSet?.weight ?? 0,
        weightUnit: previousSet?.weightUnit ?? settings?.weightUnit ?? "kg",
        reps: previousSet?.reps ?? 0,
        createdAt: now,
        updatedAt: now,
      }

      await db.exerciseEntries.put({
        ...entry,
        updatedAt: now,
        setEntries: [...entry.setEntries, newSet],
      })

      await load()
    },
    [load]
  )

  const updateNumber = useCallback(
    async (
      exerciseEntryId: string,
      setEntryId: string,
      field: "reps" | "weight",
      value: number
    ) => {
      await updateSet(exerciseEntryId, setEntryId, {
        [field]: Math.max(0, value),
      })
    },
    [updateSet]
  )

  const incrementNumber = useCallback(
    async (
      exerciseEntryId: string,
      setEntryId: string,
      field: "reps" | "weight",
      delta: number
    ) => {
      const entry = state.exerciseEntries.find(
        (exerciseEntry) => exerciseEntry.id === exerciseEntryId
      )
      const setEntry = entry?.setEntries.find((set) => set.id === setEntryId)

      if (!setEntry) {
        return
      }

      const currentValue = field === "weight" ? setEntry.weight : setEntry.reps

      await updateNumber(
        exerciseEntryId,
        setEntryId,
        field,
        (currentValue ?? 0) + delta
      )
    },
    [state.exerciseEntries, updateNumber]
  )

  return {
    ...state,
    addSet,
    updateNumber,
    incrementNumber,
    locale: state.settings?.locale ?? "en",
    dictionary: getDictionary(state.settings?.locale ?? "en"),
  }
}

function createLocalId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`
}
