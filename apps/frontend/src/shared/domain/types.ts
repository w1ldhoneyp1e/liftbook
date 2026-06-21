type Locale = 'en' | 'ru'

type WeightUnit = 'kg' | 'lb'
type ThemeMode = 'system' | 'light' | 'dark'
type RestTimerMode = 'stopwatch' | 'timer'

type DateState = 'past' | 'today' | 'future'

type AccountKind = 'guest' | 'account'

type SyncStatus = 'pending' | 'synced' | 'conflict'

type SyncMetadata = {
	serverId?: string,
	createdAt?: string,
	updatedAt?: string,
	deletedAt?: string,
	syncStatus: SyncStatus,
}

type MuscleGroupId =
  | 'chest'
  | 'back'
  | 'legs'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'core'
  | 'glutes'
  | 'cardio'
  | 'full_body'
  | 'other'

type ExerciseTrackingMode =
  | 'weight_reps'
  | 'bodyweight_reps'
  | 'time'
  | 'distance_time'
  | 'weighted_bodyweight'

type LocalizedText = Record<Locale, string>

type Exercise = {
	id: string,
	name: LocalizedText,
	muscleGroupIds: MuscleGroupId[],
	trackingMode: ExerciseTrackingMode,
	builtIn: boolean,
} & Partial<SyncMetadata>

type SetEntry = {
	id: string,
	weight?: number,
	weightUnit?: WeightUnit,
	reps?: number,
	previousResultSourceSetId?: string,
	durationSeconds?: number,
	distanceMeters?: number,
	deletedAt?: string,
	createdAt: string,
	updatedAt: string,
}

type ExerciseEntry = {
	id: string,
	exerciseId: string,
	workoutDate: string,
	position: number,
	setEntries: SetEntry[],
	previousResultSourceId?: string,
	createdAt: string,
	updatedAt: string,
} & Partial<SyncMetadata>

type WorkoutDay = {
	id: string,
	date: string,
	localOwnerId: string,
	inferredDurationSeconds?: number,
	createdAt: string,
	updatedAt: string,
} & Partial<SyncMetadata>

type AccountSession = {
	id: 'local',
	userId: string,
	kind: AccountKind,
	email?: string,
	emailVerified?: boolean,
	accessToken: string,
	tokenType: 'Bearer',
	expiresAt: string,
	syncCursor?: string | null,
	createdAt: string,
	updatedAt: string,
}

type UserSettings = {
	id: 'local',
	locale: Locale,
	themeMode: ThemeMode,
	weightUnit: WeightUnit,
	kgStep: number,
	lbStep: number,
	repsStep: number,
	autoRestTimer: boolean,
	previousResultDefaults: boolean,
	restTimerMode: RestTimerMode,
	restTimerDurationSeconds: number,
	restTimerSoundEnabled: boolean,
	restTimerVibrationEnabled: boolean,
	restTimerNotificationsEnabled: boolean,
	restTimerWakeLockEnabled: boolean,
	restTimerLockScreenEnabled: boolean,
	updatedAt: string,
} & Partial<SyncMetadata>

export type {
	Locale,
	WeightUnit,
	ThemeMode,
	RestTimerMode,
	DateState,
	AccountKind,
	SyncStatus,
	SyncMetadata,
	MuscleGroupId,
	ExerciseTrackingMode,
	LocalizedText,
	Exercise,
	SetEntry,
	ExerciseEntry,
	WorkoutDay,
	AccountSession,
	UserSettings,
}
