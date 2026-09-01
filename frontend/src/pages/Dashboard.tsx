import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import {
  BudgetDonutChart,
  CampaignPerformanceChart,
  ConversionsChart,
  CtrChart,
  InvestmentChart,
  PlatformInvestmentChart,
} from "@/components/charts"
import { KpiCard, NativeSelect, PageHeader, PageSkeleton } from "@/components/shared"
import { useDashboard } from "@/hooks/use-dashboard"
import { money, number, percent } from "@/lib/format"
import { queryKeys } from "@/lib/query-keys"
import { campaignsApi, clientsApi, platformsApi } from "@/lib/services"
import type { DashboardFilters } from "@/types"

const periods = [
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "12m", label: "12 meses" },
  { value: "all", label: "Todo o período" },
] as const

export function DashboardPage() {
  const [period, setPeriod] = useState<DashboardFilters["period"]>("all")
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

  const { data, isLoading, error } = useDashboard(filters)
  const { data: clients = [] } = useQuery({ queryKey: queryKeys.clients, queryFn: clientsApi.list })
  const { data: campaigns = [] } = useQuery({ queryKey: queryKeys.campaigns(), queryFn: () => campaignsApi.list() })
  const { data: platforms = [] } = useQuery({ queryKey: queryKeys.platforms, queryFn: platformsApi.list })

  const visibleCampaigns = clientId ? campaigns.filter((campaign) => String(campaign.client_id) === clientId) : campaigns

  if (isLoading) return <PageSkeleton />
  if (error || !data) {
    return <p className="text-sm text-destructive">{error instanceof Error ? error.message : "Erro ao carregar o painel."}</p>
  }

  return (
    <div>
      <PageHeader
        title="Painel"
        description="Métricas viram indicadores; indicadores viram gráficos — para decidir onde a verba rende."
        actions={
          <Button asChild size="lg">
            <Link to="/campanhas">Nova campanha</Link>
          </Button>
        }
      />

      <section className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
        <div className="grid gap-1">
          <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Período</span>
          <div className="flex flex-wrap gap-1">
            {periods.map((item) => (
              <Button key={item.value} size="sm" variant={period === item.value ? "default" : "outline"} onClick={() => setPeriod(item.value)}>
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
          <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Plataforma</span>
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

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <KpiCard kind="métrica" label="Campanhas" value={data.overview.total_campaigns} />
        <KpiCard kind="métrica" label="Investimento" value={money(data.overview.total_investment)} />
        <KpiCard kind="métrica" label="Cliques" value={number(data.overview.total_clicks)} />
        <KpiCard kind="métrica" label="Conversões" value={number(data.overview.total_conversions)} />
        <KpiCard kind="indicador" label="CTR médio" value={percent(data.overview.average_ctr)} />
        <KpiCard kind="indicador" label="CPC médio" value={data.overview.average_cpc !== null ? money(data.overview.average_cpc) : "—"} />
      </section>

      <section className="grid gap-4">
        <InvestmentChart data={data.evolution} />
        <div className="grid gap-4 lg:grid-cols-2">
          <ConversionsChart data={data.evolution} />
          <CampaignPerformanceChart data={data.by_campaign} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <PlatformInvestmentChart data={data.by_platform} />
          <BudgetDonutChart data={data.by_platform} />
        </div>
        <CtrChart data={data.evolution} />
      </section>
    </div>
  )
}
