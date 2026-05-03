import type { MuscleGroupId } from "@/shared/domain/types"

type MuscleGroupColor = {
  badgeClassName: string
  dotClassName: string
  textClassName: string
}

export const muscleGroupColors: Record<MuscleGroupId, MuscleGroupColor> = {
  chest: {
    badgeClassName: "bg-rose-100 text-rose-700 dark:bg-rose-950/45 dark:text-rose-300",
    dotClassName: "bg-rose-500",
    textClassName: "text-rose-700 dark:text-rose-300",
  },
  back: {
    badgeClassName: "bg-sky-100 text-sky-700 dark:bg-sky-950/45 dark:text-sky-300",
    dotClassName: "bg-sky-500",
    textClassName: "text-sky-700 dark:text-sky-300",
  },
  legs: {
    badgeClassName: "bg-amber-100 text-amber-800 dark:bg-amber-950/45 dark:text-amber-300",
    dotClassName: "bg-amber-500",
    textClassName: "text-amber-700 dark:text-amber-300",
  },
  shoulders: {
    badgeClassName: "bg-violet-100 text-violet-700 dark:bg-violet-950/45 dark:text-violet-300",
    dotClassName: "bg-violet-500",
    textClassName: "text-violet-700 dark:text-violet-300",
  },
  biceps: {
    badgeClassName: "bg-lime-100 text-lime-800 dark:bg-lime-950/45 dark:text-lime-300",
    dotClassName: "bg-lime-500",
    textClassName: "text-lime-700 dark:text-lime-300",
  },
  triceps: {
    badgeClassName: "bg-orange-100 text-orange-800 dark:bg-orange-950/45 dark:text-orange-300",
    dotClassName: "bg-orange-500",
    textClassName: "text-orange-700 dark:text-orange-300",
  },
  core: {
    badgeClassName: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/45 dark:text-cyan-300",
    dotClassName: "bg-cyan-500",
    textClassName: "text-cyan-700 dark:text-cyan-300",
  },
  glutes: {
    badgeClassName: "bg-pink-100 text-pink-700 dark:bg-pink-950/45 dark:text-pink-300",
    dotClassName: "bg-pink-500",
    textClassName: "text-pink-700 dark:text-pink-300",
  },
  cardio: {
    badgeClassName: "bg-red-100 text-red-700 dark:bg-red-950/45 dark:text-red-300",
    dotClassName: "bg-red-500",
    textClassName: "text-red-700 dark:text-red-300",
  },
  full_body: {
    badgeClassName: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/45 dark:text-emerald-300",
    dotClassName: "bg-emerald-500",
    textClassName: "text-emerald-700 dark:text-emerald-300",
  },
  other: {
    badgeClassName: "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
    dotClassName: "bg-zinc-500",
    textClassName: "text-zinc-700 dark:text-zinc-300",
  },
}

export function getMuscleGroupColor(muscleGroupId: MuscleGroupId) {
  return muscleGroupColors[muscleGroupId]
}
