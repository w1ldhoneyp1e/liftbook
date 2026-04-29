"use client"

import { useCallback, useEffect, useState } from "react"

import {
  createGuestAccount as requestGuestAccount,
  pullSyncChanges,
  pushSyncChanges,
  type SyncChange,
  type SyncEntityType,
} from "@/shared/api/liftbook-api"
import { getDictionary } from "@/shared/i18n/dictionaries"
import type {
  AccountSession,
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
  accountSession: AccountSession | null
  settings: UserSettings | null
  workoutDay: WorkoutDay | null
  exerciseEntries: ExerciseEntry[]
  exercisesById: Record<string, Exercise>
  loading: boolean
  syncSummary: {
    pending: number
    synced: number
  }
}

export function useDayScreenData(date: string) {
  const [state, setState] = useState<DayScreenData>({
    accountSession: null,
    settings: null,
    workoutDay: null,
    exerciseEntries: [],
    exercisesById: {},
    loading: true,
    syncSummary: {
      pending: 0,
      synced: 0,
    },
  })

  const load = useCallback(async () => {
    await seedLocalDatabase()
    await normalizeLegacyConflicts()

    const [
      accountSession,
      settings,
      workoutDay,
      exerciseEntries,
      exercises,
    ] = await Promise.all([
      db.accountSessions.get("local"),
      db.userSettings.get("local"),
      db.workoutDays.where("date").equals(date).first(),
      db.exerciseEntries.where("workoutDate").equals(date).sortBy("position"),
      db.exercises.toArray(),
    ])
    const syncSummary = await getSyncSummary()

    setState({
      accountSession: accountSession ?? null,
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
      syncSummary,
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

  const createGuestAccount = useCallback(async () => {
    const locale = state.settings?.locale ?? "en"
    const response = await requestGuestAccount(locale)
    const now = new Date().toISOString()

    await db.accountSessions.put({
      id: "local",
      userId: response.user.id,
      kind: response.user.kind,
      accessToken: response.session.accessToken,
      tokenType: response.session.tokenType,
      expiresAt: response.session.expiresAt,
      syncCursor: response.sync.cursor,
      createdAt: response.user.createdAt,
      updatedAt: now,
    })

    await load()
  }, [load, state.settings?.locale])

  const syncPendingChanges = useCallback(async () => {
    const accountSession = await db.accountSessions.get("local")

    if (!accountSession) {
      throw new Error("Account session is required for sync")
    }

    const cursorBeforeSync = accountSession.syncCursor
    const changes = await collectPendingSyncChanges()

    if (changes.length > 0) {
      const pushResponse = await pushSyncChanges({
        accessToken: accountSession.accessToken,
        changes,
        cursor: cursorBeforeSync,
      })

      await markAcceptedChangesSynced(pushResponse.accepted)
    }

    await pullAllSyncChanges(accountSession.accessToken, cursorBeforeSync)
    await load()
  }, [load])

  return {
    ...state,
    addExercise,
    addCustomExercise,
    addSet,
    createGuestAccount,
    deleteCustomExercise,
    deleteExercise,
    deleteSet,
    updateNumber,
    incrementNumber,
    renameCustomExercise,
    syncPendingChanges,
    updateSettings,
    locale: state.settings?.locale ?? "en",
    dictionary: getDictionary(state.settings?.locale ?? "en"),
  }
}

async function getSyncSummary() {
  const [customExercises, workoutDays, exerciseEntries, userSettings] =
    await Promise.all([
      db.exercises
        .filter((exercise) => !exercise.builtIn)
        .toArray(),
      db.workoutDays.toArray(),
      db.exerciseEntries.toArray(),
      db.userSettings.toArray(),
    ])

  const syncableRecords = [
    ...customExercises,
    ...workoutDays,
    ...exerciseEntries,
    ...userSettings,
  ]

  return syncableRecords.reduce(
    (summary, record) => {
      const status = record.syncStatus

      if (status === "pending") {
        summary.pending += 1
      } else if (status === "synced") {
        summary.synced += 1
      }

      return summary
    },
    {
      pending: 0,
      synced: 0,
    }
  )
}

async function collectPendingSyncChanges() {
  const [exercises, workoutDays, exerciseEntries, userSettings] =
    await Promise.all([
      db.exercises.where("syncStatus").equals("pending").toArray(),
      db.workoutDays.where("syncStatus").equals("pending").toArray(),
      db.exerciseEntries.where("syncStatus").equals("pending").toArray(),
      db.userSettings.where("syncStatus").equals("pending").toArray(),
    ])

  return [
    ...exercises.map((exercise) => createSyncChange("exercise", exercise)),
    ...workoutDays.map((workoutDay) =>
      createSyncChange("workoutDay", workoutDay)
    ),
    ...exerciseEntries.map((exerciseEntry) =>
      createSyncChange("exerciseEntry", exerciseEntry)
    ),
    ...userSettings.map((settings) =>
      createSyncChange("userSettings", settings)
    ),
  ]
}

function createSyncChange(
  entityType: SyncEntityType,
  entity: {
    id: string
    deletedAt?: string
    updatedAt?: string
  }
): SyncChange {
  return {
    entityType,
    localId: entity.id,
    operation: entity.deletedAt ? "delete" : "upsert",
    payload: entity,
    updatedAt: entity.updatedAt ?? new Date().toISOString(),
  }
}

async function markAcceptedChangesSynced(
  acceptedChanges: Array<{
    entityType: SyncEntityType
    localId: string
  }>
) {
  await Promise.all(
    acceptedChanges.map((change) =>
      markEntitySynced(change.entityType, change.localId)
    )
  )
}

async function updateSyncCursor(nextCursor: string) {
  const accountSession = await db.accountSessions.get("local")

  if (accountSession) {
    await db.accountSessions.put({
      ...accountSession,
      syncCursor: nextCursor,
      updatedAt: new Date().toISOString(),
    })
  }
}

async function markEntitySynced(entityType: SyncEntityType, localId: string) {
  const patch = {
    syncStatus: "synced" as const,
  }

  if (entityType === "exercise") {
    await db.exercises.update(localId, patch)
    return
  }

  if (entityType === "workoutDay") {
    await db.workoutDays.update(localId, patch)
    return
  }

  if (entityType === "exerciseEntry") {
    await db.exerciseEntries.update(localId, patch)
    return
  }

  await db.userSettings.update(localId as UserSettings["id"], patch)
}

async function applyPulledChanges(
  changes: Array<SyncChange & { serverTime: string }>,
  nextCursor: string
) {
  for (const change of changes) {
    await applyPulledChange(change)
  }

  await updateSyncCursor(nextCursor)
}

async function pullAllSyncChanges(accessToken: string, initialCursor?: string | null) {
  let cursor = initialCursor ?? null

  while (true) {
    const pullResponse = await pullSyncChanges({
      accessToken,
      cursor,
    })

    await applyPulledChanges(pullResponse.changes, pullResponse.nextCursor)
    cursor = pullResponse.nextCursor

    if (!pullResponse.hasMore) {
      return
    }
  }
}

async function applyPulledChange(change: SyncChange & { serverTime: string }) {
  if (change.entityType === "exercise") {
    await applyPulledExercise(change)
    return
  }

  if (change.entityType === "workoutDay") {
    await applyPulledWorkoutDay(change)
    return
  }

  if (change.entityType === "exerciseEntry") {
    await applyPulledExerciseEntry(change)
    return
  }

  await applyPulledUserSettings(change)
}

async function applyPulledExercise(change: SyncChange & { serverTime: string }) {
  const existingExercise = await db.exercises.get(change.localId)

  if (existingExercise && shouldKeepLocalVersion(existingExercise, change)) {
    await db.exercises.put({ ...existingExercise, syncStatus: "pending" })
    return
  }

  if (change.operation === "delete") {
    if (existingExercise) {
      await db.exercises.put({
        ...existingExercise,
        deletedAt: existingExercise.deletedAt ?? change.serverTime,
        syncStatus: "synced",
      })
    }

    return
  }

  if (isExercisePayload(change.payload)) {
    await db.exercises.put({
      ...change.payload,
      syncStatus: "synced",
    })
  }
}

async function applyPulledWorkoutDay(
  change: SyncChange & { serverTime: string }
) {
  const existingWorkoutDay = await db.workoutDays.get(change.localId)

  if (
    existingWorkoutDay &&
    shouldKeepLocalVersion(existingWorkoutDay, change)
  ) {
    await db.workoutDays.put({ ...existingWorkoutDay, syncStatus: "pending" })
    return
  }

  if (change.operation === "delete") {
    if (existingWorkoutDay) {
      await db.workoutDays.put({
        ...existingWorkoutDay,
        deletedAt: existingWorkoutDay.deletedAt ?? change.serverTime,
        syncStatus: "synced",
      })
    }

    return
  }

  if (isWorkoutDayPayload(change.payload)) {
    await db.workoutDays.put({
      ...change.payload,
      syncStatus: "synced",
    })
  }
}

async function applyPulledExerciseEntry(
  change: SyncChange & { serverTime: string }
) {
  const existingExerciseEntry = await db.exerciseEntries.get(change.localId)

  if (
    existingExerciseEntry &&
    shouldKeepLocalVersion(existingExerciseEntry, change)
  ) {
    await db.exerciseEntries.put({
      ...existingExerciseEntry,
      syncStatus: "pending",
    })
    return
  }

  if (change.operation === "delete") {
    if (existingExerciseEntry) {
      await db.exerciseEntries.put({
        ...existingExerciseEntry,
        deletedAt: existingExerciseEntry.deletedAt ?? change.serverTime,
        syncStatus: "synced",
      })
    }

    return
  }

  if (isExerciseEntryPayload(change.payload)) {
    await db.exerciseEntries.put({
      ...change.payload,
      syncStatus: "synced",
    })
  }
}

async function applyPulledUserSettings(
  change: SyncChange & { serverTime: string }
) {
  const existingSettings = await db.userSettings.get("local")

  if (existingSettings && shouldKeepLocalVersion(existingSettings, change)) {
    await db.userSettings.put({
      ...existingSettings,
      syncStatus: "pending",
    })
    return
  }

  if (change.operation === "delete") {
    return
  }

  if (isUserSettingsPayload(change.payload)) {
    await db.userSettings.put({
      ...change.payload,
      id: "local",
      syncStatus: "synced",
    } as UserSettings)
  }
}

async function normalizeLegacyConflicts() {
  const [customExercises, workoutDays, exerciseEntries, userSettings] =
    await Promise.all([
      db.exercises
        .filter(
          (exercise) => !exercise.builtIn && exercise.syncStatus === "conflict"
        )
        .toArray(),
      db.workoutDays.where("syncStatus").equals("conflict").toArray(),
      db.exerciseEntries.where("syncStatus").equals("conflict").toArray(),
      db.userSettings.where("syncStatus").equals("conflict").toArray(),
    ])

  if (
    customExercises.length === 0 &&
    workoutDays.length === 0 &&
    exerciseEntries.length === 0 &&
    userSettings.length === 0
  ) {
    return
  }

  await Promise.all([
    ...customExercises.map((exercise) =>
      db.exercises.update(exercise.id, { syncStatus: "pending" })
    ),
    ...workoutDays.map((workoutDay) =>
      db.workoutDays.update(workoutDay.id, { syncStatus: "pending" })
    ),
    ...exerciseEntries.map((exerciseEntry) =>
      db.exerciseEntries.update(exerciseEntry.id, { syncStatus: "pending" })
    ),
    ...userSettings.map((settings) =>
      db.userSettings.update(settings.id, { syncStatus: "pending" })
    ),
  ])
}

function shouldKeepLocalVersion(
  localEntity: { syncStatus?: string; updatedAt?: string },
  remoteChange: SyncChange & { serverTime: string }
) {
  if (localEntity.syncStatus !== "pending" && localEntity.syncStatus !== "conflict") {
    return false
  }

  const localUpdatedAt = Date.parse(localEntity.updatedAt ?? "")
  const remoteUpdatedAt = Date.parse(remoteChange.updatedAt || remoteChange.serverTime)

  if (!Number.isFinite(localUpdatedAt)) {
    return false
  }

  if (!Number.isFinite(remoteUpdatedAt)) {
    return true
  }

  return localUpdatedAt >= remoteUpdatedAt
}

function isRecord(payload: unknown): payload is Record<string, unknown> {
  return (
    typeof payload === "object" &&
    payload !== null
  )
}

function isExercisePayload(payload: unknown): payload is Exercise {
  if (!isRecord(payload)) {
    return false
  }

  return (
    typeof payload.id === "string" &&
    isRecord(payload.name) &&
    Array.isArray(payload.muscleGroupIds) &&
    typeof payload.trackingMode === "string" &&
    typeof payload.builtIn === "boolean"
  )
}

function isWorkoutDayPayload(payload: unknown): payload is WorkoutDay {
  if (!isRecord(payload)) {
    return false
  }

  return (
    typeof payload.id === "string" &&
    typeof payload.date === "string" &&
    typeof payload.localOwnerId === "string" &&
    typeof payload.createdAt === "string" &&
    typeof payload.updatedAt === "string"
  )
}

function isExerciseEntryPayload(payload: unknown): payload is ExerciseEntry {
  if (!isRecord(payload)) {
    return false
  }

  return (
    typeof payload.id === "string" &&
    typeof payload.exerciseId === "string" &&
    typeof payload.workoutDate === "string" &&
    typeof payload.position === "number" &&
    Array.isArray(payload.setEntries) &&
    typeof payload.createdAt === "string" &&
    typeof payload.updatedAt === "string"
  )
}

function isUserSettingsPayload(payload: unknown): payload is UserSettings {
  if (!isRecord(payload)) {
    return false
  }

  return (
    payload.id === "local" &&
    (payload.locale === "en" || payload.locale === "ru") &&
    (payload.weightUnit === "kg" || payload.weightUnit === "lb") &&
    typeof payload.kgStep === "number" &&
    typeof payload.lbStep === "number" &&
    typeof payload.repsStep === "number" &&
    typeof payload.autoRestTimer === "boolean" &&
    typeof payload.previousResultDefaults === "boolean" &&
    typeof payload.updatedAt === "string"
  )
}

function createLocalId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`
}
