"use client"

import { useCallback, useEffect, useState } from "react"

import { getDictionary } from "@/shared/i18n/dictionaries"
import type {
  Exercise,
  ExerciseEntry,
  Locale,
  MuscleGroupId,
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
      workoutDay: workoutDay && !workoutDay.deletedAt ? workoutDay : null,
      exerciseEntries: exerciseEntries
        .filter((entry) => !entry.deletedAt)
        .map((entry) => ({
          ...entry,
          setEntries: entry.setEntries.filter((setEntry) => !setEntry.deletedAt),
        })),
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
        syncStatus: "pending",
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
      const previousSet = entry.setEntries
        .filter((setEntry) => !setEntry.deletedAt)
        .at(-1)
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
        syncStatus: "pending",
        updatedAt: now,
        setEntries: [...entry.setEntries, newSet],
      })

      await load()
    },
    [load]
  )

  const deleteSet = useCallback(
    async (exerciseEntryId: string, setEntryId: string) => {
      const entry = await db.exerciseEntries.get(exerciseEntryId)

      if (!entry) {
        return
      }

      const now = new Date().toISOString()

      await db.exerciseEntries.put({
        ...entry,
        syncStatus: "pending",
        updatedAt: now,
        setEntries: entry.setEntries.map((setEntry) =>
          setEntry.id === setEntryId
            ? { ...setEntry, deletedAt: now, updatedAt: now }
            : setEntry
        ),
      })

      await load()
    },
    [load]
  )

  const deleteExercise = useCallback(
    async (exerciseEntryId: string) => {
      await db.transaction("rw", db.workoutDays, db.exerciseEntries, async () => {
        const now = new Date().toISOString()
        const entry = await db.exerciseEntries.get(exerciseEntryId)

        if (!entry) {
          return
        }

        await db.exerciseEntries.put({
          ...entry,
          deletedAt: now,
          syncStatus: "pending",
          updatedAt: now,
        })

        const remainingEntries = await db.exerciseEntries
          .where("workoutDate")
          .equals(date)
          .sortBy("position")
        const activeEntries = remainingEntries.filter(
          (entry) => !entry.deletedAt
        )

        if (activeEntries.length === 0) {
          await db.workoutDays.update(`day_${date}`, {
            deletedAt: now,
            syncStatus: "pending",
            updatedAt: now,
          })
          return
        }

        await db.exerciseEntries.bulkPut(
          activeEntries.map((entry, position) => ({
            ...entry,
            position,
            syncStatus: "pending",
            updatedAt: now,
          }))
        )

        await db.workoutDays.update(`day_${date}`, {
          syncStatus: "pending",
          updatedAt: now,
        })
      })

      await load()
    },
    [date, load]
  )

  const addExercise = useCallback(
    async (exerciseId: string) => {
      const [settings, existingDay, entriesForDate, previousEntries] =
        await Promise.all([
          db.userSettings.get("local"),
          db.workoutDays.where("date").equals(date).first(),
          db.exerciseEntries
            .where("workoutDate")
            .equals(date)
            .and((entry) => !entry.deletedAt)
            .toArray(),
          db.exerciseEntries.where("exerciseId").equals(exerciseId).toArray(),
        ])

      const now = new Date().toISOString()
      const workoutDay =
        existingDay ??
        ({
          id: `day_${date}`,
          date,
          localOwnerId: "local",
          createdAt: now,
          syncStatus: "pending",
          updatedAt: now,
        } satisfies WorkoutDay)

      const previousResult =
        settings?.previousResultDefaults === false
          ? undefined
          : previousEntries
              .filter((entry) => !entry.deletedAt && entry.workoutDate < date)
              .sort((a, b) => b.workoutDate.localeCompare(a.workoutDate))[0]

      const setEntries =
        previousResult?.setEntries
          .filter((setEntry) => !setEntry.deletedAt)
          .map((setEntry) => ({
            ...setEntry,
            id: createLocalId("set"),
            deletedAt: undefined,
            createdAt: now,
            updatedAt: now,
          })) ?? []

      const initialSetEntries =
        setEntries.length > 0
          ? setEntries
          : [
              {
                id: createLocalId("set"),
                weight: 0,
                weightUnit: settings?.weightUnit ?? "kg",
                reps: 0,
                createdAt: now,
                updatedAt: now,
              },
            ]

      const exerciseEntry: ExerciseEntry = {
        id: createLocalId("entry"),
        exerciseId,
        workoutDate: date,
        position: entriesForDate.length,
        setEntries: initialSetEntries,
        previousResultSourceId: previousResult?.id,
        createdAt: now,
        syncStatus: "pending",
        updatedAt: now,
      }

      await db.transaction("rw", db.workoutDays, db.exerciseEntries, async () => {
        await db.workoutDays.put({
          ...workoutDay,
          deletedAt: undefined,
          syncStatus: "pending",
          updatedAt: now,
        })
        await db.exerciseEntries.put(exerciseEntry)
      })

      await load()
    },
    [date, load]
  )

  const addCustomExercise = useCallback(
    async (name: string, muscleGroupId: MuscleGroupId, locale: Locale) => {
      const trimmedName = name.trim()

      if (!trimmedName) {
        return
      }

      const exerciseId = createLocalId("exercise")
      const now = new Date().toISOString()

      await db.exercises.put({
        id: exerciseId,
        name: {
          en: trimmedName,
          ru: trimmedName,
          [locale]: trimmedName,
        },
        muscleGroupIds: [muscleGroupId],
        trackingMode: "weight_reps",
        builtIn: false,
        createdAt: now,
        updatedAt: now,
        syncStatus: "pending",
      })

      await addExercise(exerciseId)
    },
    [addExercise]
  )

  const renameCustomExercise = useCallback(
    async (exerciseId: string, name: string, locale: Locale) => {
      const trimmedName = name.trim()
      const exercise = await db.exercises.get(exerciseId)

      if (!exercise || exercise.builtIn || !trimmedName) {
        return
      }

      await db.exercises.put({
        ...exercise,
        name: {
          ...exercise.name,
          [locale]: trimmedName,
        },
        syncStatus: "pending",
        updatedAt: new Date().toISOString(),
      })

      await load()
    },
    [load]
  )

  const deleteCustomExercise = useCallback(
    async (exerciseId: string) => {
      const exercise = await db.exercises.get(exerciseId)

      if (!exercise || exercise.builtIn) {
        return
      }

      const now = new Date().toISOString()

      await db.exercises.put({
        ...exercise,
        deletedAt: now,
        syncStatus: "pending",
        updatedAt: now,
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

  const updateSettings = useCallback(
    async (patch: Partial<Omit<UserSettings, "id" | "updatedAt">>) => {
      const currentSettings = await db.userSettings.get("local")

      if (!currentSettings) {
        return
      }

      await db.userSettings.put({
        ...currentSettings,
        ...patch,
        syncStatus: "pending",
        updatedAt: new Date().toISOString(),
      })

      await load()
    },
    [load]
  )

  return {
    ...state,
    addExercise,
    addCustomExercise,
    addSet,
    deleteCustomExercise,
    deleteExercise,
    deleteSet,
    updateNumber,
    incrementNumber,
    renameCustomExercise,
    updateSettings,
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
