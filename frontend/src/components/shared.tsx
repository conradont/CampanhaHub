import type { ComponentProps, ReactNode } from "react"
import { Inbox, MoreHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
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
        <h1 className="font-heading text-3xl font-medium">{title}</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">{description}</p>
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
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}

export function EmptyState({ title, text, icon }: { title: string; text: string; icon?: ReactNode }) {
  return (
    <div className="flex gap-4 rounded-lg border bg-card p-6">
      <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-primary">
        {icon ?? <Inbox className="size-4" />}
      </div>
      <div>
        <p className="font-heading text-lg">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{text}</p>
      </div>
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
}: {
  label: string
  value: string | number
  kind?: "métrica" | "indicador"
}) {
  return (
    <article className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between gap-2">
        <span className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase">{label}</span>
        {kind ? (
          <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">{kind}</span>
        ) : null}
      </div>
      <strong className={cn("mt-2 block font-mono text-3xl font-semibold leading-none")}>{value}</strong>
    </article>
  )
}

export function NativeSelect({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
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
