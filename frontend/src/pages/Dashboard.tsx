import { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { MousePointerClick, Percent, Target, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BudgetDonutChart, InvestmentConversionChart, InvestmentHistoryChart } from "@/components/charts"
import { CampaignHero, RecentCampaigns } from "@/components/dashboard-widgets"
import { PeriodPicker } from "@/components/PeriodPicker"
import { EmptyState, KpiCard, PageHeader, PageSkeleton, SetupChecklist } from "@/components/shared"
import { useDashboard } from "@/hooks/use-dashboard"
import { loadDashboardPrefs, saveDashboardPrefs } from "@/lib/dashboard-prefs"
import { money, number, percent } from "@/lib/format"
import { presetRange, rangesEqual } from "@/lib/period"
import { queryKeys } from "@/lib/query-keys"
import { campaignsApi, clientsApi, platformsApi } from "@/lib/services"
import { cn } from "@/lib/utils"
import type { DashboardFilters } from "@/types"

const defaultRange = presetRange("last30")

export function DashboardPage() {
  const prefs = useMemo(() => loadDashboardPrefs(), [])
  const [draftRange, setDraftRange] = useState(prefs.range)
  const [appliedRange, setAppliedRange] = useState(prefs.range)
  const [campaignId, setCampaignId] = useState<number | null>(prefs.campaignId)

  const filters = useMemo<DashboardFilters>(() => {
    const next: DashboardFilters = { period: "all" }
    if (appliedRange.start) next.start = appliedRange.start
    if (appliedRange.end) next.end = appliedRange.end
    if (campaignId) next.campaign_id = campaignId
    return next
  }, [appliedRange, campaignId])

  const { data, isLoading, isFetching, error } = useDashboard(filters)
  const setupQuery = useDashboard({ period: "all" })
  const clientsQuery = useQuery({ queryKey: queryKeys.clients, queryFn: clientsApi.list })
  const campaignsQuery = useQuery({ queryKey: queryKeys.campaigns(), queryFn: () => campaignsApi.list() })
  const platformsQuery = useQuery({ queryKey: queryKeys.platforms, queryFn: platformsApi.list })

  const clients = clientsQuery.data ?? []
  const campaigns = campaignsQuery.data ?? []
  const platforms = platformsQuery.data ?? []
  const listsLoading = clientsQuery.isLoading || campaignsQuery.isLoading || platformsQuery.isLoading

  useEffect(() => {
    saveDashboardPrefs({ range: appliedRange, campaignId })
  }, [appliedRange, campaignId])

  useEffect(() => {
    if (campaignId != null && campaigns.length > 0 && !campaigns.some((campaign) => campaign.id === campaignId)) {
      setCampaignId(null)
    }
  }, [campaigns, campaignId])

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
  const hasActiveFilters = Boolean(campaignId || !rangesEqual(appliedRange, defaultRange))
  const widgetsBusy = isFetching && Boolean(data)
  const seriesRange = data
    ? { start: data.filters.start, end: data.filters.end, grain: data.filters.grain }
    : undefined

  function applyRange(range: typeof appliedRange) {
    setDraftRange(range)
    setAppliedRange(range)
  }

  function clearFilters() {
    applyRange(defaultRange)
    setCampaignId(null)
  }

  return (
    <div>
      <PageHeader
        eyebrow="Visão geral"
        title="Painel"
        description="Suas campanhas organizadas em 2 segundos."
        actions={
          hasCampaign ? (
            <PeriodPicker
              range={draftRange}
              onChange={setDraftRange}
              onSearch={() => setAppliedRange(draftRange)}
              onApply={applyRange}
            />
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
              <InvestmentHistoryChart data={data.evolution} loading={isLoading} range={seriesRange} />
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

          <section className="mb-6 grid gap-4 rounded-2xl border border-edge bg-surface px-5 py-4 sm:grid-cols-4">
            <div>
              <span className="eyebrow text-fg-muted">CAC</span>
              <strong className="mt-2 block font-rounded text-lg font-bold tabular-nums">
                {data.overview.average_cac !== null ? money(data.overview.average_cac) : "—"}
              </strong>
            </div>
            <div>
              <span className="eyebrow text-fg-muted">Impressões</span>
              <strong className="mt-2 block font-rounded text-lg font-bold tabular-nums">{number(data.funnel.impressions)}</strong>
            </div>
            <div>
              <span className="eyebrow text-fg-muted">Cliques</span>
              <strong className="mt-2 block font-rounded text-lg font-bold tabular-nums">{number(data.funnel.clicks)}</strong>
            </div>
            <div>
              <span className="eyebrow text-fg-muted">Conversões</span>
              <strong className="mt-2 block font-rounded text-lg font-bold tabular-nums">{number(data.funnel.conversions)}</strong>
            </div>
          </section>

          {data.evolution.length > 0 || data.by_platform.length > 0 || data.by_campaign.length > 0 ? (
            <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="flex flex-col gap-6 xl:col-span-2">
                <BudgetDonutChart data={data.by_platform} loading={isLoading} />
                <InvestmentConversionChart data={data.evolution} loading={isLoading} range={seriesRange} />
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
