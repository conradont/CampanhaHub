import { useMemo, type ReactNode } from "react"
import { LineChart } from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart as RechartsLine,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { EmptyState } from "@/components/shared"
import { fillEvolutionGaps } from "@/lib/evolution"
import { compactMoney, money, number, percent } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { DashboardCampaignRow, DashboardData, DashboardEvolutionPoint, DashboardPlatformRow } from "@/types"

export const chartBrand = "#3fcf5f"
export const chartMuted = "#9ba5a0"
export const chartGrid = "#242a26"
export const chartFill = "rgba(63, 207, 95, 0.18)"

const chartTones = ["#3fcf5f", "#eab308", "#f0616d", "#34b851", "#f6a623", "#7ee8fa"] as const

function chartTone(index: number) {
  return chartTones[index % chartTones.length]
}

function formatTooltipValue(dataKey: unknown, value: unknown) {
  const amount = Number(value)
  if (dataKey === "investment" || dataKey === "cpc") return money(amount)
  if (dataKey === "ctr") return percent(amount)
  return number(amount)
}

function ChartCard({
  title,
  question,
  children,
  empty,
  bodyClassName,
}: {
  title: string
  question: string
  children: ReactNode
  empty?: boolean
  bodyClassName?: string
}) {
  return (
    <section className="flex flex-col gap-6 rounded-2xl border border-edge bg-surface p-6">
      <div className="flex flex-col gap-1">
        <span className="eyebrow text-brand">{question}</span>
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-fg">{title}</h2>
      </div>
      {empty ? (
        <EmptyState icon={<LineChart className="size-4" />} title="Sem dados neste recorte" text="Ajuste os filtros ou registre métricas em uma campanha." />
      ) : (
        <div className={cn("h-[280px] w-full", bodyClassName)}>{children}</div>
      )}
    </section>
  )
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: readonly { dataKey?: unknown; name?: unknown; value?: unknown }[]
  label?: unknown
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-edge bg-surface px-3 py-2 text-sm shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
      <p className="mb-1 font-medium">{String(label ?? "")}</p>
      {payload.map((entry) => (
        <p key={String(entry.dataKey)} className="font-mono text-xs text-muted-foreground">
          {String(entry.name)}: <span className="text-foreground">{formatTooltipValue(entry.dataKey, entry.value)}</span>
        </p>
      ))}
    </div>
  )
}

const axis = { fontSize: 12, fill: chartMuted }

export function InvestmentHistoryChart({
  data,
  loading,
  range,
}: {
  data: DashboardEvolutionPoint[]
  loading?: boolean
  range?: Pick<DashboardData["filters"], "start" | "end" | "grain">
}) {
  const series = useMemo(() => fillEvolutionGaps(data, range), [data, range])
  return (
    <section className="flex h-full flex-col gap-4 rounded-2xl border border-edge bg-surface p-6">
      <div className="flex flex-col gap-1">
        <span className="eyebrow text-brand">Fluxo no tempo</span>
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-fg">Histórico de investimento</h2>
      </div>
      {loading ? (
        <div className="min-h-44 flex-1 animate-pulse rounded-xl bg-surface-raised" />
      ) : series.length === 0 ? (
        <p className="flex min-h-44 flex-1 items-center justify-center text-sm text-fg-muted">Sem série neste recorte.</p>
      ) : (
        <div className="min-h-44 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id="investment-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartBrand} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={chartBrand} stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={chartGrid} strokeDasharray="3 3" strokeOpacity={0.6} />
              <XAxis dataKey="label" stroke={chartMuted} tickLine={false} axisLine={false} fontSize={10} />
              <YAxis
                stroke={chartMuted}
                tickLine={false}
                axisLine={false}
                fontSize={10}
                width={52}
                tickFormatter={(value) => compactMoney(Number(value))}
              />
              <Tooltip content={(props) => <ChartTooltip active={props.active} payload={props.payload} label={props.label} />} />
              <Area
                type="monotone"
                dataKey="investment"
                name="Investimento"
                stroke={chartBrand}
                fill="url(#investment-fill)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: chartBrand }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}

export function InvestmentChart({ data }: { data: DashboardEvolutionPoint[] }) {
  return (
    <ChartCard title="Evolução do investimento" question="Quanto foi investido ao longo do período?" empty={data.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid stroke={chartGrid} vertical={false} />
          <XAxis dataKey="label" tick={axis} />
          <YAxis tick={axis} tickFormatter={(value) => compactMoney(Number(value))} />
          <Tooltip content={(props) => <ChartTooltip active={props.active} payload={props.payload} label={props.label} />} />
          <Area type="monotone" dataKey="investment" name="Investimento" stroke={chartBrand} strokeWidth={2} fill={chartFill} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function InvestmentConversionChart({
  data,
  loading,
  range,
}: {
  data: DashboardEvolutionPoint[]
  loading?: boolean
  range?: Pick<DashboardData["filters"], "start" | "end" | "grain">
}) {
  const series = useMemo(() => fillEvolutionGaps(data, range), [data, range])
  return (
    <section className="flex h-full flex-col gap-6 rounded-2xl border border-edge bg-surface p-6">
      <div className="flex flex-col gap-1">
        <span className="eyebrow text-brand">Comparativo</span>
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-fg">Investimento e conversões</h2>
      </div>
      {loading ? (
        <div className="min-h-56 flex-1 animate-pulse rounded-xl bg-surface-raised" />
      ) : series.length === 0 ? (
        <p className="flex min-h-56 flex-1 items-center justify-center text-sm text-fg-muted">Sem série neste recorte.</p>
      ) : (
        <div className="min-h-56 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid stroke={chartGrid} vertical={false} />
              <XAxis dataKey="label" stroke={chartMuted} tickLine={false} fontSize={11} />
              <YAxis
                yAxisId="investment"
                stroke={chartMuted}
                tickLine={false}
                fontSize={11}
                width={52}
                tickFormatter={(value) => compactMoney(Number(value))}
              />
              <YAxis
                yAxisId="conversions"
                orientation="right"
                stroke={chartMuted}
                tickLine={false}
                fontSize={11}
                width={36}
                allowDecimals={false}
              />
              <Tooltip content={(props) => <ChartTooltip active={props.active} payload={props.payload} label={props.label} />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar yAxisId="investment" dataKey="investment" name="Investimento" fill={chartBrand} radius={[4, 4, 0, 0]} />
              <Bar yAxisId="conversions" dataKey="conversions" name="Conversões" fill="#eab308" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}

export function ConversionsChart({ data }: { data: DashboardEvolutionPoint[] }) {
  return (
    <ChartCard title="Evolução das conversões" question="As conversões acompanham o investimento?" empty={data.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLine data={data}>
          <CartesianGrid stroke={chartGrid} vertical={false} />
          <XAxis dataKey="label" tick={axis} />
          <YAxis tick={axis} allowDecimals={false} />
          <Tooltip content={(props) => <ChartTooltip active={props.active} payload={props.payload} label={props.label} />} />
          <Line type="monotone" dataKey="conversions" name="Conversões" stroke={chartBrand} strokeWidth={2} dot={{ r: 3, fill: chartBrand }} />
        </RechartsLine>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function CtrChart({ data }: { data: DashboardEvolutionPoint[] }) {
  return (
    <ChartCard title="Evolução do CTR" question="O anúncio está ganhando ou perdendo cliques por impressão?" empty={data.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLine data={data}>
          <CartesianGrid stroke={chartGrid} vertical={false} />
          <XAxis dataKey="label" tick={axis} />
          <YAxis tick={axis} tickFormatter={(value) => `${value}%`} />
          <Tooltip content={(props) => <ChartTooltip active={props.active} payload={props.payload} label={props.label} />} />
          <Line type="monotone" dataKey="ctr" name="CTR" stroke={chartBrand} strokeWidth={2} dot={{ r: 3, fill: chartBrand }} connectNulls />
        </RechartsLine>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function PlatformInvestmentChart({ data }: { data: DashboardPlatformRow[] }) {
  return (
    <ChartCard title="Investimento por canal" question="Onde o orçamento está sendo utilizado?" empty={data.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 12, right: 12 }}>
          <CartesianGrid stroke={chartGrid} vertical={false} />
          <XAxis type="number" tick={axis} tickFormatter={(value) => compactMoney(Number(value))} />
          <YAxis type="category" dataKey="platform" width={96} tick={axis} />
          <Tooltip content={(props) => <ChartTooltip active={props.active} payload={props.payload} label={props.label} />} />
          <Bar dataKey="investment" name="Investimento" radius={4}>
            {data.map((row, index) => (
              <Cell key={row.platform} fill={chartTone(index)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function CampaignPerformanceChart({ data }: { data: DashboardCampaignRow[] }) {
  const rows = data.slice(0, 8)
  return (
    <ChartCard title="Conversões por campanha" question="Quais campanhas tiveram melhor desempenho?" empty={rows.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ left: 12, right: 12 }}>
          <CartesianGrid stroke={chartGrid} vertical={false} />
          <XAxis type="number" tick={axis} allowDecimals={false} />
          <YAxis type="category" dataKey="campaign" width={110} tick={axis} />
          <Tooltip content={(props) => <ChartTooltip active={props.active} payload={props.payload} label={props.label} />} />
          <Bar dataKey="conversions" name="Conversões" radius={4}>
            {rows.map((row, index) => (
              <Cell key={row.id} fill={chartTone(index)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function BudgetDonutChart({
  data,
  loading,
}: {
  data: DashboardPlatformRow[]
  loading?: boolean
}) {
  const slices = data.filter((row) => row.investment > 0)
  const total = slices.reduce((sum, row) => sum + row.investment, 0)

  return (
    <section className="flex h-full flex-col gap-6 rounded-2xl border border-edge bg-surface p-6">
      <div className="flex flex-col gap-1">
        <span className="eyebrow text-brand">Gastos por canal</span>
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-fg">Para onde foi o dinheiro</h2>
      </div>
      {loading ? (
        <div className="flex items-center gap-6">
          <div className="size-40 animate-pulse rounded-full bg-surface-raised" />
          <div className="flex flex-1 flex-col gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-6 animate-pulse rounded-md bg-surface-raised" />
            ))}
          </div>
        </div>
      ) : slices.length === 0 ? (
        <p className="py-8 text-center text-sm text-fg-muted">Nenhum investimento registrado neste período.</p>
      ) : (
        <div className="flex flex-col items-center gap-8 sm:flex-row">
          <div className="relative size-44 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="investment"
                  nameKey="platform"
                  innerRadius={58}
                  outerRadius={84}
                  paddingAngle={2}
                  stroke="none"
                >
                  {slices.map((row, index) => (
                    <Cell key={row.platform} fill={chartTone(index)} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="eyebrow text-fg-muted">Total</span>
              <span className="font-rounded text-lg font-bold tabular-nums text-fg">{money(total)}</span>
            </div>
          </div>
          <ul className="flex flex-1 flex-col gap-3">
            {slices.map((row, index) => (
              <li key={row.platform} className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: chartTone(index) }} aria-hidden />
                  <span className="truncate text-sm font-medium text-fg">{row.platform}</span>
                  <span className="shrink-0 font-mono text-xs text-fg-muted">{percent(row.share_percent)}</span>
                </div>
                <span className="shrink-0 font-mono text-sm tabular-nums text-fg-muted">{money(row.investment)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
