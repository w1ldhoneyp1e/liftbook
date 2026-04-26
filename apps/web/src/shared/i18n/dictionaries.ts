import type { Locale, MuscleGroupId } from "@/shared/domain/types"

type Dictionary = {
  actions: {
    addExercise: string
    addSet: string
    calendar: string
    chooseExercise: string
    collapse: string
    collapseAll: string
    decrease: string
    increase: string
    search: string
    start: string
  }
  labels: {
    exercises: string
    loading: string
    noExercisesFound: string
    restTimer: string
    searchExercise: string
    today: string
  }
  units: {
    kg: string
    lb: string
    reps: string
  }
  muscleGroups: Record<MuscleGroupId, string>
}

export const dictionaries: Record<Locale, Dictionary> = {
  en: {
    actions: {
      addExercise: "Add exercise",
      addSet: "Add set",
      calendar: "Calendar",
      chooseExercise: "Choose exercise",
      collapse: "Collapse",
      collapseAll: "Collapse all",
      decrease: "Decrease",
      increase: "Increase",
      search: "Search",
      start: "Start",
    },
    labels: {
      exercises: "Exercises",
      loading: "Loading...",
      noExercisesFound: "No exercises found",
      restTimer: "Rest timer",
      searchExercise: "Search exercise",
      today: "Today",
    },
    units: {
      kg: "kg",
      lb: "lb",
      reps: "reps",
    },
    muscleGroups: {
      chest: "Chest",
      back: "Back",
      legs: "Legs",
      shoulders: "Shoulders",
      biceps: "Biceps",
      triceps: "Triceps",
      core: "Core",
      glutes: "Glutes",
      cardio: "Cardio",
      full_body: "Full body",
      other: "Other",
    },
  },
  ru: {
    actions: {
      addExercise: "Добавить упражнение",
      addSet: "Добавить подход",
      calendar: "Календарь",
      chooseExercise: "Выбрать упражнение",
      collapse: "Свернуть",
      collapseAll: "Свернуть все",
      decrease: "Уменьшить",
      increase: "Увеличить",
      search: "Поиск",
      start: "Старт",
    },
    labels: {
      exercises: "Упражнения",
      loading: "Загрузка...",
      noExercisesFound: "Упражнения не найдены",
      restTimer: "Таймер отдыха",
      searchExercise: "Найти упражнение",
      today: "Сегодня",
    },
    units: {
      kg: "кг",
      lb: "lb",
      reps: "повт.",
    },
    muscleGroups: {
      chest: "Грудь",
      back: "Спина",
      legs: "Ноги",
      shoulders: "Плечи",
      biceps: "Бицепс",
      triceps: "Трицепс",
      core: "Кор",
      glutes: "Ягодицы",
      cardio: "Кардио",
      full_body: "Все тело",
      other: "Другое",
    },
  },
}

export function getDictionary(locale: Locale) {
  return dictionaries[locale]
}
