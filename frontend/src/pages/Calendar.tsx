import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { EmptyState, Field, NativeSelect, PageHeader, PageSkeleton } from "@/components/shared"
import { getErrorMessage } from "@/lib/api"
import { CONTENT_TYPES, formatDate, STATUS_LABELS } from "@/lib/format"
import { queryKeys } from "@/lib/query-keys"
import { contentSchema, type ContentValues } from "@/lib/schemas"
import { campaignsApi, contentsApi } from "@/lib/services"
import type { Content } from "@/types"
import { cn } from "@/lib/utils"

const STATUS_DOT: Record<string, string> = {
  planejado: "bg-muted-foreground",
  em_producao: "bg-primary",
  publicado: "bg-data",
  cancelado: "bg-destructive",
}

function toLocalISO(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function monthRange(year: number, month: number) {
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0)
  return { start: toLocalISO(start), end: toLocalISO(end), days: end.getDate(), firstWeekday: start.getDay() }
}

function weekdayLabel(iso: string) {
  const [year, month, day] = iso.split("-").map(Number)
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR", { weekday: "short" })
}

function ContentChip({ item, onOpen }: { item: Content; onOpen: (item: Content) => void }) {
  const status = STATUS_LABELS[item.status] ?? item.status
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      title={`${item.title} · ${item.content_type} · ${status}`}
      className="flex min-h-9 w-full items-start gap-1.5 rounded-lg px-1 py-1 text-left hover:bg-surface-raised"
    >
      <span
        className={cn("mt-[7px] size-1.5 shrink-0 rounded-full", STATUS_DOT[item.status] ?? "bg-muted-foreground")}
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] leading-[16px] font-medium break-words whitespace-normal">
          {item.title}
        </span>
        <span className="mt-0.5 block font-mono text-[10px] leading-[14px] tracking-[0.08em] text-fg-muted uppercase">
          {item.content_type} · {status}
        </span>
      </span>
    </button>
  )
}

export function CalendarPage() {
  const queryClient = useQueryClient()
  const today = new Date()
  const todayIso = toLocalISO(today)
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Content | null>(null)
  const [toDelete, setToDelete] = useState<Content | null>(null)

  const range = useMemo(() => monthRange(cursor.year, cursor.month), [cursor])
  const contentParams = { start: range.start, end: range.end }
  const isCurrentMonth = cursor.year === today.getFullYear() && cursor.month === today.getMonth()
  const defaultDate = isCurrentMonth ? todayIso : range.start

  const { data: contents = [], isLoading } = useQuery({
    queryKey: queryKeys.contents(contentParams),
    queryFn: () => contentsApi.list(contentParams),
  })
  const { data: campaigns = [] } = useQuery({
    queryKey: queryKeys.campaigns(),
    queryFn: () => campaignsApi.list(),
  })

  const form = useForm<ContentValues>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      campaign_id: 0,
      title: "",
      content_type: "post",
      scheduled_date: defaultDate,
      status: "planejado",
      notes: "",
    },
  })

  const saveMutation = useMutation({
    mutationFn: (values: ContentValues) => (editing ? contentsApi.update(editing.id, values) : contentsApi.create(values)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contents"] })
      toast.success(editing ? "Peça atualizada." : "Peça planejada.")
      setOpen(false)
      setEditing(null)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: number) => contentsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contents"] })
      toast.success("Peça excluída.")
      setToDelete(null)
      setOpen(false)
      setEditing(null)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const byDate = useMemo(() => {
    const map = new Map<string, Content[]>()
    for (const item of contents) {
      const list = map.get(item.scheduled_date) ?? []
      list.push(item)
      map.set(item.scheduled_date, list)
    }
    return map
  }, [contents])

  const cells: Array<{ date?: string; day?: number }> = []
  for (let i = 0; i < range.firstWeekday; i += 1) cells.push({})
  for (let day = 1; day <= range.days; day += 1) {
    const date = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    cells.push({ date, day })
  }

  const agendaDays = useMemo(() => {
    const days: Array<{ date: string; day: number; items: Content[] }> = []
    for (let day = 1; day <= range.days; day += 1) {
      const date = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      const items = byDate.get(date) ?? []
      if (items.length > 0 || (isCurrentMonth && date === todayIso)) {
        days.push({ date, day, items })
      }
    }
    return days
  }, [byDate, isCurrentMonth, range.days, cursor.year, cursor.month, todayIso])

  function ensureCampaign() {
    if (campaigns.length === 0) {
      toast.error("Crie uma campanha antes de planejar conteúdos.")
      return false
    }
    return true
  }

  function openCreate(date: string) {
    if (!ensureCampaign()) return
    setEditing(null)
    form.reset({
      campaign_id: form.getValues("campaign_id") || campaigns[0].id,
      title: "",
      content_type: "post",
      scheduled_date: date,
      status: "planejado",
      notes: "",
    })
    setOpen(true)
  }

  function openEdit(item: Content) {
    if (!ensureCampaign()) return
    setEditing(item)
    form.reset({
      campaign_id: item.campaign_id,
      title: item.title,
      content_type: item.content_type,
      scheduled_date: item.scheduled_date,
      status: item.status as ContentValues["status"],
      notes: item.notes ?? "",
    })
    setOpen(true)
  }

  function goToday() {
    setCursor({ year: today.getFullYear(), month: today.getMonth() })
  }

  const title = new Date(cursor.year, cursor.month, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
  const scheduledDate = form.watch("scheduled_date")

  if (isLoading) return <PageSkeleton />

  return (
    <div>
      <PageHeader
        eyebrow="Agenda"
        title="Calendário"
        description="O que sai do forno esta semana."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="lg" onClick={goToday} aria-current={isCurrentMonth ? "date" : undefined}>
              Hoje
            </Button>
            <Button
              variant="outline"
              size="icon-lg"
              aria-label="Mês anterior"
              onClick={() =>
                setCursor({
                  year: cursor.month === 0 ? cursor.year - 1 : cursor.year,
                  month: cursor.month === 0 ? 11 : cursor.month - 1,
                })
              }
            >
              <ChevronLeft className="size-4" />
            </Button>
            <strong className="min-w-36 text-center font-serif text-lg font-semibold tracking-tight">{title}</strong>
            <Button
              variant="outline"
              size="icon-lg"
              aria-label="Próximo mês"
              onClick={() =>
                setCursor({
                  year: cursor.month === 11 ? cursor.year + 1 : cursor.year,
                  month: cursor.month === 11 ? 0 : cursor.month + 1,
                })
              }
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        }
      />

      <div className="mb-4 hidden overflow-hidden rounded-2xl border border-edge bg-edge md:grid md:grid-cols-7 md:gap-px">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((label) => (
          <div key={label} className="eyebrow bg-surface-raised px-2 py-2 text-center text-fg-muted">
            {label}
          </div>
        ))}
        {cells.map((cell, index) => (
          <div
            key={index}
            className={cn(
              "flex min-h-36 min-w-0 flex-col bg-surface p-2",
              !cell.date && "bg-surface-raised/40",
              cell.date === todayIso && "ring-1 ring-brand ring-inset",
            )}
          >
            {cell.date ? (
              <>
                <div className="flex items-center justify-between gap-1">
                  <span className={cn("font-mono text-sm", cell.date === todayIso && "font-semibold text-brand")}>{cell.day}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-9"
                    aria-label={`Planejar em ${formatDate(cell.date)}`}
                    onClick={() => openCreate(cell.date!)}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
                <div className="mt-1 grid min-w-0 gap-1">
                  {(byDate.get(cell.date) ?? []).map((item) => (
                    <ContentChip key={item.id} item={item} onOpen={openEdit} />
                  ))}
                </div>
              </>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mb-4 grid gap-3 md:hidden">
        {contents.length > 0
          ? agendaDays.map((day) => (
              <section
                key={day.date}
                className={cn("rounded-2xl border border-edge bg-surface p-3", day.date === todayIso && "border-brand")}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-serif capitalize">
                      {weekdayLabel(day.date)} {day.day}
                    </p>
                    {day.date === todayIso ? <p className="text-xs text-primary">Hoje</p> : null}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-9"
                    aria-label={`Planejar em ${formatDate(day.date)}`}
                    onClick={() => openCreate(day.date)}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
                {day.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma peça neste dia.</p>
                ) : (
                  <div className="grid gap-1">
                    {day.items.map((item) => (
                      <ContentChip key={item.id} item={item} onOpen={openEdit} />
                    ))}
                  </div>
                )}
              </section>
            ))
          : null}
      </div>

      {contents.length === 0 ? (
        <EmptyState
          title="Mês sem conteúdos"
          text="Planeje a primeira peça deste mês em um clique."
          action={<Button onClick={() => openCreate(defaultDate)}>Planejar peça</Button>}
        />
      ) : null}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) setEditing(null)
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar peça" : `Nova peça em ${formatDate(scheduledDate)}`}</DialogTitle>
          </DialogHeader>
          <form id="calendar-form" className="grid gap-4" onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}>
            <Field label="Campanha" error={form.formState.errors.campaign_id?.message}>
              <NativeSelect {...form.register("campaign_id", { valueAsNumber: true })}>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Título" error={form.formState.errors.title?.message}>
              <Input {...form.register("title")} />
            </Field>
            <Field label="Data prevista" error={form.formState.errors.scheduled_date?.message}>
              <Input type="date" {...form.register("scheduled_date")} />
            </Field>
            <Field label="Tipo" error={form.formState.errors.content_type?.message}>
              <NativeSelect {...form.register("content_type")}>
                {CONTENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Status" error={form.formState.errors.status?.message}>
              <NativeSelect {...form.register("status")}>
                <option value="planejado">Planejado</option>
                <option value="em_producao">Em produção</option>
                <option value="publicado">Publicado</option>
                <option value="cancelado">Cancelado</option>
              </NativeSelect>
            </Field>
            <Field label="Observações" error={form.formState.errors.notes?.message}>
              <Textarea rows={3} {...form.register("notes")} />
            </Field>
          </form>
          <DialogFooter className={editing ? "sm:justify-between" : undefined}>
            {editing ? (
              <Button type="button" variant="destructive" className="mr-auto" onClick={() => setToDelete(editing)}>
                Excluir
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="calendar-form" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(toDelete)} onOpenChange={(next) => !next && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir peça?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete ? `O conteúdo “${toDelete.title}” será excluído.` : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => toDelete && deleteMutation.mutate(toDelete.id)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
