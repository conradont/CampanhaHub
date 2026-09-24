import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Megaphone } from "lucide-react"
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
import { EmptyState, Field, FilterPill, NativeSelect, PageHeader, PageSkeleton, RowMenu, SearchField, StatusBadge } from "@/components/shared"
import { getErrorMessage } from "@/lib/api"
import { formatDate, money, STATUS_LABELS, todayISO } from "@/lib/format"
import { compareValues, matchesSearch, type SortState } from "@/lib/list"
import { queryKeys } from "@/lib/query-keys"
import { campaignSchema, type CampaignValues } from "@/lib/schemas"
import { campaignsApi, clientsApi, platformsApi } from "@/lib/services"
import type { Campaign } from "@/types"

const filters = ["todas", "ativa", "rascunho", "pausada", "historico"] as const

function emptyCampaign(clientId = 0, platformId = 0): CampaignValues {
  return {
    name: "",
    objective: "",
    description: "",
    client_id: clientId,
    platform_id: platformId,
    start_date: todayISO(),
    end_date: "",
    budget: 0,
    status: "rascunho",
  }
}

export function CampaignsPage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<(typeof filters)[number]>("todas")
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<SortState<"name" | "start" | "budget">>({ key: "start", dir: "desc" })
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Campaign | null>(null)
  const [toDelete, setToDelete] = useState<Campaign | null>(null)

  const form = useForm<CampaignValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: emptyCampaign(),
  })

  const apiFilter = filter === "historico" ? "finalizada" : filter === "todas" ? undefined : filter

  const { data: items = [], isLoading } = useQuery({
    queryKey: queryKeys.campaigns(filter),
    queryFn: () => campaignsApi.list(apiFilter),
  })
  const { data: clients = [] } = useQuery({ queryKey: queryKeys.clients, queryFn: clientsApi.list })
  const { data: platforms = [] } = useQuery({ queryKey: queryKeys.platforms, queryFn: platformsApi.list })

  const saveMutation = useMutation({
    mutationFn: (values: CampaignValues) =>
      editing ? campaignsApi.update(editing.id, values) : campaignsApi.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      toast.success(editing ? "Campanha atualizada." : "Campanha criada.")
      setOpen(false)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => campaignsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      toast.success("Campanha excluída.")
      setToDelete(null)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const visible = useMemo(() => {
    const filtered = items.filter((campaign) =>
      matchesSearch([campaign.name, campaign.client?.name, campaign.platform?.name, campaign.objective], query),
    )
    return [...filtered].sort((left, right) => {
      if (sort.key === "budget") return compareValues(left.budget, right.budget, sort.dir)
      if (sort.key === "start") return compareValues(left.start_date, right.start_date, sort.dir)
      return compareValues(left.name, right.name, sort.dir)
    })
  }, [items, query, sort])

  const canCreate = clients.length > 0 && platforms.length > 0

  function startCreate() {
    if (!canCreate) {
      toast.error("Cadastre um cliente e um canal antes de criar a campanha.")
      return
    }
    setEditing(null)
    form.reset(emptyCampaign(clients[0].id, platforms[0].id))
    setOpen(true)
  }

  function startEdit(campaign: Campaign) {
    setEditing(campaign)
    form.reset({
      name: campaign.name,
      objective: campaign.objective,
      description: campaign.description,
      client_id: campaign.client_id,
      platform_id: campaign.platform_id,
      start_date: campaign.start_date,
      end_date: campaign.end_date ?? "",
      budget: campaign.budget,
      status: campaign.status as CampaignValues["status"],
    })
    setOpen(true)
  }

  if (isLoading) return <PageSkeleton />

  return (
    <div>
      <PageHeader
        eyebrow="Fila"
        title="Campanhas"
        description="Uma fila de trabalho — não um mural de cards coloridos."
        actions={
          canCreate ? (
            <Button size="lg" onClick={startCreate}>
              Nova campanha
            </Button>
          ) : (
            <Button asChild size="lg">
              <Link to={clients.length === 0 ? "/clientes" : "/plataformas"}>
                {clients.length === 0 ? "Cadastrar cliente" : "Cadastrar canal"}
              </Link>
            </Button>
          )
        }
      />

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-wrap gap-2">
          {filters.map((value) => (
            <FilterPill
              key={value}
              active={filter === value}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {value === "historico" ? "Histórico" : STATUS_LABELS[value] ?? "Todas"}
            </FilterPill>
          ))}
        </div>
        {items.length > 0 ? (
          <>
            <SearchField value={query} onChange={setQuery} placeholder="Buscar campanha, cliente ou canal" />
            <label className="grid min-w-44 gap-1">
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Ordenar</span>
              <NativeSelect
                value={`${sort.key}:${sort.dir}`}
                onChange={(event) => {
                  const [key, dir] = event.target.value.split(":") as ["name" | "start" | "budget", "asc" | "desc"]
                  setSort({ key, dir })
                }}
              >
                <option value="start:desc">Início (recente)</option>
                <option value="start:asc">Início (antigo)</option>
                <option value="name:asc">Nome A–Z</option>
                <option value="name:desc">Nome Z–A</option>
                <option value="budget:desc">Maior orçamento</option>
                <option value="budget:asc">Menor orçamento</option>
              </NativeSelect>
            </label>
          </>
        ) : null}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title={filter === "todas" ? "Nenhuma campanha" : "Nada neste filtro"}
          text={
            filter !== "todas"
              ? "Tente outro status ou veja a fila completa."
              : canCreate
                ? "Crie uma campanha vinculada a um cliente e a um canal."
                : clients.length === 0
                  ? "Cadastre o primeiro cliente para conseguir criar campanhas."
                  : "Cadastre um canal antes de criar a campanha."
          }
          action={
            filter !== "todas" ? (
              <Button variant="outline" onClick={() => setFilter("todas")}>
                Ver todas
              </Button>
            ) : canCreate ? (
              <Button onClick={startCreate}>Nova campanha</Button>
            ) : (
              <Button asChild>
                <Link to={clients.length === 0 ? "/clientes" : "/plataformas"}>
                  {clients.length === 0 ? "Cadastrar cliente" : "Cadastrar canal"}
                </Link>
              </Button>
            )
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title={`Nada para “${query}”`}
          text="Tente outro termo ou limpe a busca para ver a fila."
          action={
            <Button variant="outline" onClick={() => setQuery("")}>
              Limpar busca
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((campaign) => (
            <article
              key={campaign.id}
              className="flex items-center gap-3 rounded-xl border border-edge bg-surface-raised px-2 transition-colors hover:bg-surface"
            >
              <Link
                to={`/campanhas/${campaign.id}`}
                aria-label={`Abrir ${campaign.name}`}
                className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-4 rounded-lg px-3 py-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                    <Megaphone className="size-4" strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0">
                    <StatusBadge status={campaign.status} />
                    <h3 className="mt-2 font-serif text-xl font-semibold tracking-tight text-fg">{campaign.name}</h3>
                    <p className="text-sm text-fg-muted">
                      {campaign.client?.name} · {campaign.platform?.name}
                    </p>
                    <p className="mt-1 font-mono text-xs tabular-nums text-fg-muted">
                      {formatDate(campaign.start_date)}
                      {campaign.end_date ? ` – ${formatDate(campaign.end_date)}` : ""} · {money(campaign.budget)}
                    </p>
                  </div>
                </div>
              </Link>
              <div className="pr-3">
                <RowMenu onEdit={() => startEdit(campaign)} onDelete={() => setToDelete(campaign)} />
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar campanha" : "Nova campanha"}</DialogTitle>
          </DialogHeader>
          <form id="campaign-form" className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}>
            <Field label="Nome" error={form.formState.errors.name?.message}>
              <Input {...form.register("name")} />
            </Field>
            <Field label="Objetivo" error={form.formState.errors.objective?.message}>
              <Input {...form.register("objective")} />
            </Field>
            <Field label="Cliente" error={form.formState.errors.client_id?.message}>
              <NativeSelect {...form.register("client_id", { valueAsNumber: true })}>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Canal" error={form.formState.errors.platform_id?.message}>
              <NativeSelect {...form.register("platform_id", { valueAsNumber: true })}>
                {platforms.map((platform) => (
                  <option key={platform.id} value={platform.id}>
                    {platform.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Início" error={form.formState.errors.start_date?.message}>
              <Input type="date" {...form.register("start_date")} />
            </Field>
            <Field label="Término" error={form.formState.errors.end_date?.message}>
              <Input type="date" {...form.register("end_date")} />
            </Field>
            <Field label="Orçamento (R$)" error={form.formState.errors.budget?.message}>
              <Input type="number" min="0" step="0.01" {...form.register("budget", { valueAsNumber: true })} />
            </Field>
            <Field label="Status" error={form.formState.errors.status?.message}>
              <NativeSelect {...form.register("status")}>
                <option value="rascunho">Rascunho</option>
                <option value="ativa">Ativa</option>
                <option value="pausada">Pausada</option>
                <option value="finalizada">Finalizada</option>
              </NativeSelect>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Descrição" error={form.formState.errors.description?.message}>
                <Textarea rows={3} {...form.register("description")} />
              </Field>
            </div>
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="campaign-form" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(toDelete)} onOpenChange={(next) => !next && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir campanha?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete ? `A campanha ${toDelete.name} e seus registros serão removidos.` : null}
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
