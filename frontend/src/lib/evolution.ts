import type { DashboardEvolutionPoint } from "@/types"

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

function pad(value: number) {
  return String(value).padStart(2, "0")
}

function fromIso(iso: string) {
  const [year, month, day] = iso.split("-").map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1)
}

function emptyPoint(date: string, label: string): DashboardEvolutionPoint {
  return {
    month: date,
    date,
    label,
    investment: 0,
    conversions: 0,
    clicks: 0,
    impressions: 0,
    ctr: null,
  }
}

export function fillEvolutionGaps(
  data: DashboardEvolutionPoint[],
  range?: { start: string | null; end: string | null; grain: "day" | "month" },
) {
  if (data.length === 0 && (!range?.start || !range?.end)) return data

  const lookup = new Map(data.map((point) => [point.date, point]))
  const grain = range?.grain ?? (data[0]?.date.length === 10 ? "day" : "month")
  const startIso = range?.start || data[0]?.date
  const endIso = range?.end || data[data.length - 1]?.date
  if (!startIso || !endIso) return data

  const filled: DashboardEvolutionPoint[] = []

  if (grain === "day") {
    const cursor = fromIso(startIso.slice(0, 10))
    const end = fromIso(endIso.slice(0, 10))
    while (cursor <= end) {
      const key = `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}-${pad(cursor.getDate())}`
      filled.push(lookup.get(key) ?? emptyPoint(key, `${pad(cursor.getDate())}/${pad(cursor.getMonth() + 1)}`))
      cursor.setDate(cursor.getDate() + 1)
    }
    return filled
  }

  const cursor = fromIso(`${startIso.slice(0, 7)}-01`)
  const end = fromIso(`${endIso.slice(0, 7)}-01`)
  while (cursor <= end) {
    const key = `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}`
    filled.push(lookup.get(key) ?? emptyPoint(key, `${MONTH_LABELS[cursor.getMonth()]} ${cursor.getFullYear()}`))
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return filled
}
