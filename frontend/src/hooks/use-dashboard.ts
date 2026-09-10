import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { dashboardApi } from "@/lib/services"
import type { DashboardFilters } from "@/types"

export function useDashboard(filters: DashboardFilters = {}) {
  return useQuery({
    queryKey: queryKeys.dashboard(filters),
    queryFn: () => dashboardApi.get(filters),
    placeholderData: keepPreviousData,
  })
}
