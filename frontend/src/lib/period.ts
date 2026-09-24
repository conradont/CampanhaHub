export type DateRange = { start: string; end: string }

export type PresetKey = "week" | "last30" | "month" | "year" | "all"

export const PRESET_LABELS: Record<PresetKey, string> = {
  last30: "Últimos 30 dias",
  month: "Este mês",
  week: "Esta semana",
  year: "Este ano",
  all: "Todo o período",
}

export const PRESET_ORDER: PresetKey[] = ["last30", "month", "week", "year", "all"]

function iso(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function currentMonthRange(): DateRange {
  const now = new Date()
  return {
    start: iso(new Date(now.getFullYear(), now.getMonth(), 1)),
    end: iso(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  }
}

export function presetRange(key: PresetKey): DateRange {
  const now = new Date()
  const year = now.getFullYear()

  if (key === "month") return currentMonthRange()
  if (key === "year") {
    return { start: iso(new Date(year, 0, 1)), end: iso(new Date(year, 11, 31)) }
  }
  if (key === "last30") {
    const start = new Date(now)
    start.setDate(now.getDate() - 29)
    return { start: iso(start), end: iso(now) }
  }
  if (key === "week") {
    const diffToMonday = (now.getDay() + 6) % 7
    const monday = new Date(now)
    monday.setDate(now.getDate() - diffToMonday)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    return { start: iso(monday), end: iso(sunday) }
  }
  return { start: "", end: "" }
}

export function rangesEqual(left: DateRange, right: DateRange) {
  return left.start === right.start && left.end === right.end
}

export function matchPreset(range: DateRange): PresetKey | null {
  for (const key of PRESET_ORDER) {
    if (rangesEqual(range, presetRange(key))) return key
  }
  return null
}
