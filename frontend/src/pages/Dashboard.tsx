import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ConversionsChart, InvestmentChart, PlatformInvestmentChart } from "@/components/charts"
import { EmptyState, KpiCard, NativeSelect, PageHeader, PageSkeleton, SetupChecklist } from "@/components/shared"
import { useDashboard } from "@/hooks/use-dashboard"
import { money, number, percent } from "@/lib/format"
import { queryKeys } from "@/lib/query-keys"
import { campaignsApi, clientsApi, platformsApi } from "@/lib/services"
import { cn } from "@/lib/utils"
import type { DashboardData, DashboardFilters } from "@/types"

const periods = [
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "12m", label: "12 meses" },
  { value: "all", label: "Todo o período" },
] as const

function trendOf(
  comparison: DashboardData["overview"]["comparison"],
  key: keyof NonNullable<DashboardData["overview"]["comparison"]>,
) {
  if (!comparison) return null
  return { deltaPercent: comparison[key].delta_percent }
}

export function DashboardPage() {
  const [period, setPeriod] = useState<DashboardFilters["period"]>("30d")
  const [clientId, setClientId] = useState("")
  const [campaignId, setCampaignId] = useState("")
  const [platformId, setPlatformId] = useState("")

  const filters = useMemo<DashboardFilters>(() => {
    const next: DashboardFilters = { period }
    if (clientId) next.client_id = Number(clientId)
    if (campaignId) next.campaign_id = Number(campaignId)
    if (platformId) next.platform_id = Number(platformId)
    return next
  }, [period, clientId, campaignId, platformId])

  const { data, isLoading, isFetching, error } = useDashboard(filters)
  const setupQuery = useDashboard({ period: "all" })
  const clientsQuery = useQuery({ queryKey: queryKeys.clients, queryFn: clientsApi.list })
  const campaignsQuery = useQuery({ queryKey: queryKeys.campaigns(), queryFn: () => campaignsApi.list() })
  const platformsQuery = useQuery({ queryKey: queryKeys.platforms, queryFn: platformsApi.list })

  const clients = clientsQuery.data ?? []
  const campaigns = campaignsQuery.data ?? []
  const platforms = platformsQuery.data ?? []
  const visibleCampaigns = clientId ? campaigns.filter((campaign) => String(campaign.client_id) === clientId) : campaigns
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
  const setupDone = hasClient && hasCampaign && hasMetrics
  const hasChartData = Boolean(data && (data.evolution.length > 0 || data.by_campaign.length > 0 || data.by_platform.length > 0))
  const hasActiveFilters = Boolean(clientId || campaignId || platformId || period !== "30d")
  const comparison = data?.overview.comparison ?? null
  const widgetsBusy = isFetching && Boolean(data)

  function clearFilters() {
    setPeriod("30d")
    setClientId("")
    setCampaignId("")
    setPlatformId("")
  }

  return (
    <div>
      <PageHeader
        title="Painel"
        description="CTR, CPC e conversão no recorte — para decidir onde a verba rende."
        actions={
          setupDone ? (
            <Button asChild size="lg">
              <Link to={campaigns[0] ? `/campanhas/${campaigns[0].id}` : "/campanhas"}>Registrar métricas</Link>
            </Button>
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

      {hasCampaign ? (
        <section className="mb-6 flex flex-wrap items-end gap-3 rounded-[12px] border bg-card p-4">
          <div className="grid gap-1">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Período</span>
            <div className="flex flex-wrap gap-1">
              {periods.map((item) => (
                <Button
                  key={item.value}
                  size="sm"
                  variant={period === item.value ? "default" : "outline"}
                  aria-pressed={period === item.value}
                  onClick={() => setPeriod(item.value)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
          <label className="grid min-w-40 flex-1 gap-1">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Cliente</span>
            <NativeSelect
              value={clientId}
              onChange={(event) => {
                setClientId(event.target.value)
                setCampaignId("")
              }}
            >
              <option value="">Todos</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </NativeSelect>
          </label>
          <label className="grid min-w-40 flex-1 gap-1">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Campanha</span>
            <NativeSelect value={campaignId} onChange={(event) => setCampaignId(event.target.value)}>
              <option value="">Todas</option>
              {visibleCampaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </NativeSelect>
          </label>
          <label className="grid min-w-40 flex-1 gap-1">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Canal</span>
            <NativeSelect value={platformId} onChange={(event) => setPlatformId(event.target.value)}>
              <option value="">Todas</option>
              {platforms.map((platform) => (
                <option key={platform.id} value={platform.id}>
                  {platform.name}
                </option>
              ))}
            </NativeSelect>
          </label>
        </section>
      ) : null}

      {hasCampaign && !data ? (
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-72" />
        </div>
      ) : null}

      {hasCampaign && data ? (
        <div className={cn("transition-opacity", widgetsBusy && "opacity-60")}>
          <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              kind="indicador"
              label="CTR médio"
              value={percent(data.overview.average_ctr)}
              trend={trendOf(comparison, "average_ctr")}
            />
            <KpiCard
              kind="indicador"
              label="CPC médio"
              value={data.overview.average_cpc !== null ? money(data.overview.average_cpc) : "—"}
              trend={trendOf(comparison, "average_cpc")}
              invertTrend
            />
            <KpiCard
              kind="métrica"
              label="Conversões"
              value={number(data.overview.total_conversions)}
              trend={trendOf(comparison, "total_conversions")}
            />
            <KpiCard
              kind="métrica"
              label="Investimento"
              value={money(data.overview.total_investment)}
              trend={trendOf(comparison, "total_investment")}
            />
          </section>

          <section className="mb-6 grid gap-4 border-y py-4 sm:grid-cols-3">
            {[
              ["Campanhas", number(data.overview.total_campaigns)],
              ["Cliques", number(data.overview.total_clicks)],
              ["Impressões", number(data.totals.impressions)],
            ].map(([label, value]) => (
              <div key={label}>
                <span className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase">{label}</span>
                <strong className="mt-2 block font-mono text-lg">{value}</strong>
              </div>
            ))}
          </section>

          {hasChartData ? (
            <section className="grid gap-4">
              <InvestmentChart data={data.evolution} />
              <div className="grid gap-4 lg:grid-cols-2">
                <ConversionsChart data={data.evolution} />
                <PlatformInvestmentChart data={data.by_platform} />
              </div>
            </section>
          ) : hasMetrics ? (
            <EmptyState
              title="Sem dados neste recorte"
              text="Ajuste o período, o cliente ou a campanha para ver os gráficos."
              action={
                hasActiveFilters ? (
                  <Button variant="outline" onClick={clearFilters}>
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
