import type { ReactNode } from "react"
import { LineChart } from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart as RechartsLine,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/shared"
import { compactMoney, money, number, percent } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { DashboardCampaignRow, DashboardEvolutionPoint, DashboardPlatformRow } from "@/types"

export const chartBrand = "#fc4c02"
export const chartMuted = "#7a7c84"
export const chartGrid = "var(--border)"
export const chartFill = "rgba(252, 76, 2, 0.18)"

const chartTones = ["#fc4c02", "#ff5a14", "#ff7a3c", "#2dbe60", "#7a7c84", "#ffb08a"] as const

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
    <Card>
      <CardHeader>
        <CardTitle className="uppercase tracking-[0.06em]">{title}</CardTitle>
        <CardDescription>{question}</CardDescription>
      </CardHeader>
      <CardContent>
        {empty ? (
          <EmptyState icon={<LineChart className="size-4" />} title="Sem dados neste recorte" text="Ajuste os filtros ou registre métricas em uma campanha." />
        ) : (
          <div className={cn("h-[280px] w-full", bodyClassName)}>{children}</div>
        )}
      </CardContent>
    </Card>
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
    <div className="rounded-[10px] border bg-[#0f1014] px-3 py-2 text-sm shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
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

export function InvestmentChart({ data }: { data: DashboardEvolutionPoint[] }) {
  return (
    <ChartCard title="Evolução do investimento" question="Quanto foi investido ao longo do período?" empty={data.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
          <XAxis dataKey="label" tick={axis} />
          <YAxis tick={axis} tickFormatter={(value) => compactMoney(Number(value))} />
          <Tooltip content={(props) => <ChartTooltip active={props.active} payload={props.payload} label={props.label} />} />
          <Area type="monotone" dataKey="investment" name="Investimento" stroke={chartBrand} strokeWidth={2} fill={chartFill} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function ConversionsChart({ data }: { data: DashboardEvolutionPoint[] }) {
  return (
    <ChartCard title="Evolução das conversões" question="As conversões acompanham o investimento?" empty={data.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLine data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
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
          <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
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
          <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
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
          <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
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

export function BudgetDonutChart({ data }: { data: DashboardPlatformRow[] }) {
  const slices = data.filter((row) => row.investment > 0)
  return (
    <ChartCard
      title="Distribuição do orçamento"
      question="Como o investimento se reparte entre os canais?"
      empty={slices.length === 0}
      bodyClassName="h-auto min-h-[280px]"
    >
      <div className="flex h-full min-h-[280px] flex-col gap-4 sm:flex-row sm:items-center">
        <div className="h-[220px] w-full shrink-0 sm:h-[280px] sm:flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={slices} dataKey="investment" nameKey="platform" innerRadius={62} outerRadius={92} paddingAngle={2}>
                {slices.map((row, index) => (
                  <Cell key={row.platform} fill={chartTone(index)} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [money(Number(value)), String(name)]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="grid min-w-[180px] gap-2 sm:w-52">
          {slices.map((row, index) => (
            <li key={row.platform} className="flex items-center gap-2 text-sm">
              <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: chartTone(index) }} aria-hidden />
              <span className="min-w-0 flex-1 truncate">{row.platform}</span>
              <span className="shrink-0 font-mono text-xs text-muted-foreground">{percent(row.share_percent)}</span>
            </li>
          ))}
        </ul>
      </div>
    </ChartCard>
  )
}
