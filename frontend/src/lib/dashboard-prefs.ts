import { presetRange, type DateRange } from "@/lib/period"

const STORAGE_KEY = "campanhahub:dashboard"

export type DashboardPrefs = {
  range: DateRange
  campaignId: number | null
}

const fallback: DashboardPrefs = {
  range: presetRange("last30"),
  campaignId: null,
}

export function loadDashboardPrefs(): DashboardPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<DashboardPrefs>
    const start = typeof parsed.range?.start === "string" ? parsed.range.start : fallback.range.start
    const end = typeof parsed.range?.end === "string" ? parsed.range.end : fallback.range.end
    const campaignId = typeof parsed.campaignId === "number" ? parsed.campaignId : null
    return { range: { start, end }, campaignId }
  } catch {
    return fallback
  }
}

export function saveDashboardPrefs(prefs: DashboardPrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
}
