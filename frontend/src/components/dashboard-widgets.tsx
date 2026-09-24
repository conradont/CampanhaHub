import { Link } from "react-router-dom"
import { Megaphone, Wallet } from "lucide-react"
import { FilterPill } from "@/components/shared"
import { useCountUp } from "@/hooks/use-count-up"
import { money, number } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Campaign, DashboardCampaignRow } from "@/types"

function maskedNumber(id: number | null) {
  const tail = id == null ? "0000" : String(1000 + (id % 9000))
  return `•••• •••• •••• ${tail}`
}

export function CampaignHero({
  campaigns,
  selectedId,
  onSelect,
  amount,
  loading,
}: {
  campaigns: Campaign[]
  selectedId: number | null
  onSelect: (id: number | null) => void
  amount: number
  loading?: boolean
}) {
  const selected =
    selectedId == null
      ? { name: "Todas as campanhas", id: null as number | null }
      : {
          name: campaigns.find((campaign) => campaign.id === selectedId)?.name ?? "Campanha",
          id: selectedId,
        }
  const animatedAmount = useCountUp(amount)

  return (
    <section className="flex h-full flex-col gap-4">
      <div className="relative flex-1">
        <div className="absolute top-6 right-6 z-20 flex size-8 items-center justify-center text-brand">
          <Wallet className="size-5" strokeWidth={1.8} />
        </div>
        <div aria-hidden className="absolute top-2 -right-3 h-full w-full rounded-2xl border border-edge bg-surface-raised opacity-40" />
        <div aria-hidden className="absolute top-1 -right-1.5 h-full w-full rounded-2xl border border-edge bg-surface-raised opacity-70" />
        <div
          className="relative flex h-full min-h-[190px] flex-col justify-between overflow-hidden rounded-2xl border border-edge p-6 animate-[fadeInUp_400ms_ease]"
          style={{ background: "linear-gradient(135deg, #3a2f0a 0%, #1b201d 55%, #141816 100%)" }}
        >
          {loading ? (
            <>
              <div className="h-4 w-24 animate-pulse rounded bg-surface-raised" />
              <div className="h-9 w-40 animate-pulse rounded bg-surface-raised" />
              <div className="h-4 w-48 animate-pulse rounded bg-surface-raised" />
            </>
          ) : (
            <>
              <span className="eyebrow text-brand">Investimento acumulado</span>
              <span className="font-rounded text-4xl font-bold tracking-tight text-fg tabular-nums">{money(animatedAmount)}</span>
              <div className="flex items-end justify-between gap-4">
                <span className="font-mono text-sm tracking-widest text-fg-muted">{maskedNumber(selected.id)}</span>
                <span className="max-w-[45%] truncate text-sm font-medium text-fg">{selected.name}</span>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <FilterPill active={selectedId == null} onClick={() => onSelect(null)}>
          Todas
        </FilterPill>
        {campaigns.slice(0, 8).map((campaign) => (
          <FilterPill key={campaign.id} active={selectedId === campaign.id} onClick={() => onSelect(campaign.id)}>
            {campaign.name}
          </FilterPill>
        ))}
      </div>
    </section>
  )
}

export function RecentCampaigns({ rows, loading }: { rows: DashboardCampaignRow[]; loading?: boolean }) {
  const items = [...rows].sort((left, right) => right.investment - left.investment).slice(0, 8)

  return (
    <section className="flex h-full flex-col gap-6 rounded-2xl border border-edge bg-surface p-6">
      <div className="flex flex-col gap-1">
        <span className="eyebrow text-brand">Movimentações</span>
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-fg">Campanhas recentes</h2>
      </div>
      {loading ? (
        <div className="flex flex-1 flex-col gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-xl bg-surface-raised" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="flex flex-1 items-center justify-center py-8 text-center text-sm text-fg-muted">
          Nenhuma campanha com investimento neste período.
        </p>
      ) : (
        <ul className="flex flex-1 flex-col justify-between gap-2">
          {items.map((row) => (
            <li key={row.id}>
              <Link
                to={`/campanhas/${row.id}`}
                className="flex items-center justify-between gap-4 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-raised"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-data/10 text-data">
                    <Megaphone className="size-4" strokeWidth={1.8} />
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium text-fg">{row.campaign}</span>
                    <span className="text-xs text-fg-muted">
                      {number(row.conversions)} conv. · {number(row.clicks)} cliques
                    </span>
                  </div>
                </div>
                <span className={cn("shrink-0 font-mono text-sm tabular-nums", row.investment > 0 ? "text-fg" : "text-fg-muted")}>
                  {money(row.investment)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
