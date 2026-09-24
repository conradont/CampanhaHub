import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { MousePointerClick, Percent, Target, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BudgetDonutChart, InvestmentHistoryChart } from "@/components/charts"
import { CampaignHero, RecentCampaigns } from "@/components/dashboard-widgets"
import { EmptyState, FilterPill, KpiCard, PageHeader, PageSkeleton, SetupChecklist } from "@/components/shared"
import { useDashboard } from "@/hooks/use-dashboard"
import { money, number, percent } from "@/lib/format"
import { queryKeys } from "@/lib/query-keys"
import { campaignsApi, clientsApi, platformsApi } from "@/lib/services"
import { cn } from "@/lib/utils"
import type { DashboardFilters } from "@/types"

const periods = [
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "12m", label: "12 meses" },
  { value: "all", label: "Todo o período" },
] as const

export function DashboardPage() {
  const [period, setPeriod] = useState<DashboardFilters["period"]>("30d")
  const [campaignId, setCampaignId] = useState<number | null>(null)

  const filters = useMemo<DashboardFilters>(() => {
    const next: DashboardFilters = { period }
    if (campaignId) next.campaign_id = campaignId
    return next
  }, [period, campaignId])

  const { data, isLoading, isFetching, error } = useDashboard(filters)
  const setupQuery = useDashboard({ period: "all" })
  const clientsQuery = useQuery({ queryKey: queryKeys.clients, queryFn: clientsApi.list })
  const campaignsQuery = useQuery({ queryKey: queryKeys.campaigns(), queryFn: () => campaignsApi.list() })
  const platformsQuery = useQuery({ queryKey: queryKeys.platforms, queryFn: platformsApi.list })

  const clients = clientsQuery.data ?? []
  const campaigns = campaignsQuery.data ?? []
  const platforms = platformsQuery.data ?? []
  const listsLoading = clientsQuery.isLoading || campaignsQuery.isLoading || platformsQuery.isLoading

  if (listsLoading && !data) return <PageSkeleton />
  if ((error || !data) && !listsLoading && !isLoading) {
    return <p className="text-sm text-destructive">{error instanceof Error ? error.message : "Erro ao carregar o painel."}</p>
  }

  const hasClient = clients.length > 0
  const hasChannel = platforms.length > 0
  const hasCampaign = campaigns.length > 0
  const setupOverview = setupQuery.data?.overview ?? data?.overview
  const hasMetrics = Boolean(
    setupOverview && (setupOverview.total_investment > 0 || setupOverview.total_clicks > 0 || setupOverview.total_conversions > 0),
  )
  const hasActiveFilters = Boolean(campaignId || period !== "30d")
  const widgetsBusy = isFetching && Boolean(data)

  return (
    <div>
      <PageHeader
        eyebrow="Visão geral"
        title="Painel"
        description="Suas campanhas organizadas em 2 segundos."
        actions={
          hasCampaign ? (
            <div className="flex flex-wrap gap-2">
              {periods.map((item) => (
                <FilterPill
                  key={item.value}
                  active={period === item.value}
                  aria-pressed={period === item.value}
                  onClick={() => setPeriod(item.value)}
                >
                  {item.label}
                </FilterPill>
              ))}
            </div>
          ) : undefined
        }
      />

      <SetupChecklist
        hasClient={hasClient}
        hasChannel={hasChannel}
        hasCampaign={hasCampaign}
        hasMetrics={hasMetrics}
        firstCampaignId={campaigns[0]?.id}
      />

      {hasCampaign && !data ? <PageSkeleton /> : null}

      {hasCampaign && data ? (
        <div className={cn("transition-opacity", widgetsBusy && "opacity-60")}>
          <section className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="h-full xl:col-span-1">
              <CampaignHero
                campaigns={campaigns}
                selectedId={campaignId}
                onSelect={setCampaignId}
                amount={data.overview.total_investment}
                loading={isLoading}
              />
            </div>
            <div className="xl:col-span-2">
              <InvestmentHistoryChart data={data.evolution} loading={isLoading} />
            </div>
          </section>

          <section className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard icon={Percent} tone="data" label="CTR médio" value={percent(data.overview.average_ctr)} />
            <KpiCard
              icon={MousePointerClick}
              label="CPC médio"
              value={data.overview.average_cpc !== null ? money(data.overview.average_cpc) : "—"}
            />
            <KpiCard icon={Target} label="Conversões" value={number(data.overview.total_conversions)} />
            <KpiCard icon={Wallet} glow tone="data" label="Investimento" value={money(data.overview.total_investment)} />
          </section>

          {data.evolution.length > 0 || data.by_platform.length > 0 || data.by_campaign.length > 0 ? (
            <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <BudgetDonutChart data={data.by_platform} loading={isLoading} />
              </div>
              <div className="h-full xl:col-span-1">
                <RecentCampaigns rows={data.by_campaign} loading={isLoading} />
              </div>
            </section>
          ) : hasMetrics ? (
            <EmptyState
              title="Sem dados neste recorte"
              text="Ajuste o período ou a campanha para ver os gráficos."
              action={
                hasActiveFilters ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPeriod("30d")
                      setCampaignId(null)
                    }}
                  >
                    Limpar filtros
                  </Button>
                ) : undefined
              }
            />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
