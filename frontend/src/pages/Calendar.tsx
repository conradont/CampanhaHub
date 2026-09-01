import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { EmptyState, Field, NativeSelect, PageHeader, PageSkeleton, StatusBadge } from "@/components/shared"
import { getErrorMessage } from "@/lib/api"
import { CONTENT_TYPES, formatDate } from "@/lib/format"
import { queryKeys } from "@/lib/query-keys"
import { contentSchema, type ContentValues } from "@/lib/schemas"
import { campaignsApi, contentsApi } from "@/lib/services"
import type { Content } from "@/types"
import { cn } from "@/lib/utils"

function toLocalISO(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function monthRange(year: number, month: number) {
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0)
  return { start: toLocalISO(start), end: toLocalISO(end), days: end.getDate(), firstWeekday: start.getDay() }
}

export function CalendarPage() {
  const queryClient = useQueryClient()
  const today = new Date()
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [open, setOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(toLocalISO(today))

  const range = useMemo(() => monthRange(cursor.year, cursor.month), [cursor])
  const contentParams = { start: range.start, end: range.end }

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
      scheduled_date: selectedDate,
      status: "planejado",
      notes: "",
    },
  })

  const saveMutation = useMutation({
    mutationFn: contentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contents"] })
      toast.success("Peça planejada.")
      setOpen(false)
      form.setValue("title", "")
      form.setValue("notes", "")
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

  function openFor(date: string) {
    if (campaigns.length === 0) {
      toast.error("Crie uma campanha antes de planejar conteúdos.")
      return
    }
    setSelectedDate(date)
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

  const title = new Date(cursor.year, cursor.month, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })

  if (isLoading) return <PageSkeleton />

  return (
    <div>
      <PageHeader
        title="Calendário"
        description="O que sai do forno esta semana."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
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
            <strong className="min-w-36 text-center font-heading capitalize">{title}</strong>
            <Button
              variant="outline"
              size="icon"
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

      <div className="mb-4 grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((label) => (
          <div key={label} className="bg-muted px-2 py-2 text-center text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {label}
          </div>
        ))}
        {cells.map((cell, index) => (
          <button
            key={index}
            type="button"
            disabled={!cell.date}
            onClick={() => cell.date && openFor(cell.date)}
            className={cn(
              "min-h-28 bg-card p-2 text-left align-top transition-colors hover:bg-accent disabled:pointer-events-none disabled:bg-muted/40",
              cell.date === toLocalISO(today) && "ring-1 ring-primary ring-inset",
            )}
          >
            <span className="font-mono text-sm">{cell.day}</span>
            <div className="mt-2 grid gap-1">
              {(byDate.get(cell.date ?? "") ?? []).map((item) => (
                <small key={item.id} className="flex items-center gap-1 truncate text-xs">
                  <StatusBadge status={item.status} />
                  <span className="truncate">{item.title}</span>
                </small>
              ))}
            </div>
          </button>
        ))}
      </div>

      {contents.length === 0 ? <EmptyState title="Mês sem conteúdos" text="Clique em um dia para planejar uma publicação." /> : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Peça em {formatDate(selectedDate)}</DialogTitle>
          </DialogHeader>
          <form id="calendar-form" className="grid gap-4" onSubmit={form.handleSubmit((values) => saveMutation.mutate({ ...values, scheduled_date: selectedDate }))}>
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="calendar-form" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
