export function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : String(value)
}

export function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const restSeconds = seconds % 60

  return `${String(minutes).padStart(2, "0")}:${String(restSeconds).padStart(2, "0")}`
}
