import { cloneElement, isValidElement, useId, type ComponentProps, type ReactElement, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { Check, ChevronDown, ChevronUp, ChevronsUpDown, Inbox, MoreHorizontal, Minus, Search, TrendingDown, TrendingUp } from "lucide-react"
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
  actions,
}: {
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4 print:hidden">
      <div>
        <h1 className="font-heading text-[34px] leading-9 font-bold tracking-[0.02em] uppercase">{title}</h1>
        <p className="mt-2 max-w-xl text-[14px] leading-[21px] text-[#7a7c84]">{description}</p>
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
      {icon ? <div className="text-primary">{icon}</div> : <Inbox className="size-4 text-[#7a7c84]" />}
      <p className="font-heading text-[26px] leading-[30px] font-bold tracking-[0.02em] uppercase">{title}</p>
      <p className="max-w-md text-[14px] leading-[21px] text-[#7a7c84]">{text}</p>
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
    <section className="mb-6 rounded-[12px] border bg-card p-6">
      <p className="font-heading text-[22px] leading-[26px] font-bold tracking-[0.01em] uppercase">Monte a mesa em quatro passos</p>
      <p className="mt-2 text-[14px] leading-[21px] text-[#7a7c84]">O painel fica útil quando a primeira métrica entra.</p>
      <ol className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => {
          const current = index === nextIndex
          return (
            <li
              key={step.title}
              className={cn("flex flex-col rounded-[12px] border p-4", current && "border-primary")}
            >
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-full text-sm font-medium",
                  step.done ? "bg-[#2dbe60] text-[#0b0b0e]" : current ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {step.done ? <Check className="size-4" strokeWidth={2.25} /> : index + 1}
              </span>
              <strong className="mt-3 text-[11px] font-bold tracking-[0.08em] uppercase">{step.title}</strong>
              <p className="mt-1 flex-1 text-sm text-[#7a7c84]">{step.text}</p>
              {current ? (
                <Button asChild className="mt-4 w-fit">
                  <Link to={step.to}>{step.cta}</Link>
                </Button>
              ) : step.done ? (
                <span className="mt-4 text-[11px] font-semibold tracking-[0.07em] text-[#7a7c84] uppercase">Concluído</span>
              ) : (
                <span className="mt-4 text-[11px] tracking-[0.07em] text-[#7a7c84] uppercase">Em seguida</span>
              )}
            </li>
          )
        })}
      </ol>
    </section>
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
  trend,
  invertTrend,
}: {
  label: string
  value: string | number
  kind?: "métrica" | "indicador"
  trend?: { deltaPercent: number | null } | null
  invertTrend?: boolean
}) {
  const delta = trend?.deltaPercent
  const improved = delta == null ? null : invertTrend ? delta < 0 : delta > 0
  const declined = delta == null ? null : invertTrend ? delta > 0 : delta < 0

  return (
    <article className="rounded-[12px] border bg-card p-6">
      <div className="flex items-center justify-between gap-2">
        <span className="block text-[11px] font-bold tracking-[0.08em] text-[#7a7c84] uppercase">{label}</span>
        {kind ? (
          <span className="text-[10px] font-bold tracking-[0.08em] text-[#7a7c84] uppercase">{kind}</span>
        ) : null}
      </div>
      <strong className="mt-2 block font-mono text-3xl font-medium leading-none">{value}</strong>
      {trend ? (
        <p
          className={cn(
            "mt-3 inline-flex items-center gap-1 text-xs font-medium",
            improved && "text-[#2dbe60]",
            declined && "text-[#ff8a87]",
            !improved && !declined && "text-[#7a7c84]",
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
        "h-9 w-full min-w-0 rounded-[10px] border border-input bg-[#16171b] px-2.5 text-sm outline-none transition-[border-color] duration-150 ease-[cubic-bezier(0.2,0,0,1)] focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50",
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
