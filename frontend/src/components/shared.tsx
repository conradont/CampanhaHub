import { cloneElement, isValidElement, useId, type ComponentProps, type ReactElement, type ReactNode } from "react"
import { Link } from "react-router-dom"
import type { LucideIcon } from "lucide-react"
import { Calendar, Check, ChevronDown, ChevronUp, ChevronsUpDown, Inbox, MoreHorizontal, Minus, Search, TrendingDown, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { STATUS_LABELS } from "@/lib/format"
import { cn } from "@/lib/utils"

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
}: {
  title: string
  description: string
  eyebrow?: string
  actions?: ReactNode
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4 print:hidden">
      <div className="flex flex-col gap-1">
        {eyebrow ? <span className="eyebrow text-brand">{eyebrow}</span> : null}
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-fg">{title}</h1>
        <p className="text-sm text-fg-muted">{description}</p>
      </div>
      {actions}
    </header>
  )
}

export function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  const id = useId()
  const errorId = `${id}-error`
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error ? errorId : undefined,
      })
    : children

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {control}
      {error ? (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function EmptyState({
  title,
  text,
  icon,
  action,
}: {
  title: string
  text: string
  icon?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3.5 py-8">
      {icon ? <div className="text-brand">{icon}</div> : <Inbox className="size-4 text-fg-muted" />}
      <p className="font-serif text-2xl font-semibold tracking-tight text-fg">{title}</p>
      <p className="max-w-md text-sm text-fg-muted">{text}</p>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  )
}

export function SetupChecklist({
  hasClient,
  hasChannel,
  hasCampaign,
  hasMetrics,
  firstCampaignId,
}: {
  hasClient: boolean
  hasChannel: boolean
  hasCampaign: boolean
  hasMetrics: boolean
  firstCampaignId?: number
}) {
  const steps = [
    { done: hasClient, title: "Cliente", text: "Cadastre quem paga a campanha.", to: "/clientes", cta: "Cadastrar cliente" },
    { done: hasChannel, title: "Canal", text: "Instagram e Google Ads já vêm no cadastro.", to: "/plataformas", cta: "Ver canais" },
    { done: hasCampaign, title: "Campanha", text: "Vincule cliente, canal e orçamento.", to: "/campanhas", cta: "Nova campanha" },
    {
      done: hasMetrics,
      title: "Métricas",
      text: "Lance alcance, cliques e investimento.",
      to: firstCampaignId ? `/campanhas/${firstCampaignId}` : "/campanhas",
      cta: "Registrar métricas",
    },
  ]
  const nextIndex = steps.findIndex((step) => !step.done)
  if (nextIndex === -1) return null

  return (
    <section className="mb-6 rounded-2xl border border-edge bg-surface p-6">
      <span className="eyebrow text-brand">Onboarding</span>
      <p className="mt-1 font-serif text-2xl font-semibold tracking-tight text-fg">Monte a mesa em quatro passos</p>
      <p className="mt-2 text-sm text-fg-muted">O painel fica útil quando a primeira métrica entra.</p>
      <ol className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => {
          const current = index === nextIndex
          return (
            <li
              key={step.title}
              className={cn("flex flex-col rounded-xl border border-edge bg-surface-raised p-4", current && "border-brand")}
            >
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-lg text-sm font-medium",
                  step.done ? "bg-data text-background" : current ? "bg-brand text-background" : "bg-surface text-fg-muted",
                )}
              >
                {step.done ? <Check className="size-4" strokeWidth={2.25} /> : index + 1}
              </span>
              <strong className="eyebrow mt-3 text-fg">{step.title}</strong>
              <p className="mt-1 flex-1 text-sm text-fg-muted">{step.text}</p>
              {current ? (
                <Button asChild className="mt-4 w-fit">
                  <Link to={step.to}>{step.cta}</Link>
                </Button>
              ) : step.done ? (
                <span className="eyebrow mt-4 text-fg-muted">Concluído</span>
              ) : (
                <span className="eyebrow mt-4 text-fg-muted">Em seguida</span>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export function FilterPill({
  active,
  children,
  className,
  ...props
}: ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-full border px-4 py-1.5 text-sm transition-colors duration-200",
        active ? "border-brand bg-brand-soft text-brand" : "border-edge bg-surface text-fg-muted hover:text-fg",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function DateRangeBar({
  start,
  end,
  onStartChange,
  onEndChange,
  className,
}: {
  start: string
  end: string
  onStartChange: (value: string) => void
  onEndChange: (value: string) => void
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-2 rounded-xl border border-edge bg-surface px-3 py-2", className)}>
      <Calendar className="size-4 text-fg-muted" strokeWidth={1.8} />
      <input
        type="date"
        value={start}
        max={end || undefined}
        onChange={(event) => onStartChange(event.target.value)}
        className="bg-transparent font-mono text-xs text-fg outline-none [color-scheme:dark]"
      />
      <span className="text-fg-muted">—</span>
      <input
        type="date"
        value={end}
        min={start || undefined}
        onChange={(event) => onEndChange(event.target.value)}
        className="bg-transparent font-mono text-xs text-fg outline-none [color-scheme:dark]"
      />
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "ativa" || status === "ativo" || status === "publicado"
      ? "default"
      : status === "cancelado" || status === "inativo"
        ? "destructive"
        : "secondary"
  return <Badge variant={variant}>{STATUS_LABELS[status] ?? status.replace("_", " ")}</Badge>
}

export function PageSkeleton() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-8 w-52" />
      <Skeleton className="h-4 w-80" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    </div>
  )
}

export function KpiCard({
  label,
  value,
  kind,
  icon: Icon,
  tone = "neutral",
  glow,
  trend,
  invertTrend,
}: {
  label: string
  value: string | number
  kind?: "métrica" | "indicador"
  icon?: LucideIcon
  tone?: "data" | "negative" | "neutral"
  glow?: boolean
  trend?: { deltaPercent: number | null } | null
  invertTrend?: boolean
}) {
  const delta = trend?.deltaPercent
  const improved = delta == null ? null : invertTrend ? delta < 0 : delta > 0
  const declined = delta == null ? null : invertTrend ? delta > 0 : delta < 0
  const toneClass = tone === "data" ? "text-data" : tone === "negative" ? "text-negative" : "text-fg"

  return (
    <div className="relative">
      {glow ? (
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-[2px] rounded-2xl opacity-35 blur-md"
          style={{ background: "conic-gradient(from 180deg, #f6d365, #a1ffce, #7ee8fa, #b79df6, #f6a6c1, #f6d365)" }}
        />
      ) : null}
      <article className="relative flex flex-col gap-4 rounded-2xl border border-edge bg-surface p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="eyebrow text-fg-muted">{label}</span>
          {Icon ? (
            <span className="flex size-8 items-center justify-center rounded-lg bg-surface-raised text-fg-muted">
              <Icon className="size-4" strokeWidth={1.8} />
            </span>
          ) : kind ? (
            <span className="eyebrow text-fg-muted">{kind}</span>
          ) : null}
        </div>
        <strong className={cn("font-rounded text-3xl font-bold tabular-nums tracking-tight", toneClass)}>{value}</strong>
        {trend ? (
          <p
            className={cn(
              "inline-flex items-center gap-1 text-xs font-medium",
              improved && "text-data",
              declined && "text-negative",
              !improved && !declined && "text-fg-muted",
            )}
          >
            {delta == null || delta === 0 ? (
              <Minus className="size-3.5" />
            ) : delta > 0 ? (
              <TrendingUp className="size-3.5" />
            ) : (
              <TrendingDown className="size-3.5" />
            )}
            {delta == null ? "Sem base anterior" : `${delta > 0 ? "+" : ""}${delta.toLocaleString("pt-BR")}% vs. recorte anterior`}
          </p>
        ) : null}
      </article>
    </div>
  )
}

export function SearchField({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  className?: string
}) {
  return (
    <label className={cn("relative block min-w-56 flex-1", className)}>
      <span className="sr-only">{placeholder}</span>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="pl-9" />
    </label>
  )
}

export function SortButton({
  label,
  active,
  direction,
  onClick,
  align = "left",
}: {
  label: string
  active: boolean
  direction: "asc" | "desc"
  onClick: () => void
  align?: "left" | "right"
}) {
  const Icon = !active ? ChevronsUpDown : direction === "asc" ? ChevronUp : ChevronDown
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Ordenar por ${label}`}
      className={cn(
        "inline-flex items-center gap-1 rounded-md text-xs font-semibold tracking-wider uppercase hover:text-foreground",
        align === "right" && "w-full justify-end",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {label}
      <Icon className="size-3.5" aria-hidden />
    </button>
  )
}

export function NativeSelect({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-xl border border-edge bg-surface-raised px-3 text-sm outline-none transition-[border-color] duration-150 focus-visible:border-brand disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
}

export function RowMenu({
  onEdit,
  onDelete,
}: {
  onEdit?: () => void
  onDelete?: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Ações">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onEdit ? <DropdownMenuItem onClick={onEdit}>Editar</DropdownMenuItem> : null}
        {onDelete ? (
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            Excluir
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
