import type { DashboardFilters } from "@/types"

export const queryKeys = {
  me: ["me"] as const,
  dashboard: (filters: DashboardFilters = {}) => ["dashboard", filters] as const,
  clients: ["clients"] as const,
  platforms: ["platforms"] as const,
  campaigns: (filter = "todas") => ["campaigns", filter] as const,
  campaign: (id: number) => ["campaign", id] as const,
  campaignSummary: (id: number) => ["campaign-summary", id] as const,
  metrics: (campaignId: number) => ["metrics", campaignId] as const,
  contents: (params: Record<string, string | number | undefined>) => ["contents", params] as const,
  expenses: (campaignId: number) => ["expenses", campaignId] as const,
  keywords: (campaignId: number) => ["keywords", campaignId] as const,
  experiments: (campaignId: number) => ["experiments", campaignId] as const,
  reports: (params: Record<string, string>) => ["reports", params] as const,
}
