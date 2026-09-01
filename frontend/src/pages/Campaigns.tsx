import { useState } from "react"
import { Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
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
import { EmptyState, Field, NativeSelect, PageHeader, PageSkeleton, RowMenu, StatusBadge } from "@/components/shared"
import { getErrorMessage } from "@/lib/api"
import { formatDate, money, STATUS_LABELS, todayISO } from "@/lib/format"
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

  const canCreate = clients.length > 0 && platforms.length > 0

  function startCreate() {
    if (!canCreate) {
      toast.error("Cadastre um cliente e uma plataforma antes de criar a campanha.")
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
        title="Campanhas"
        description="Uma fila de trabalho — não um mural de cards coloridos."
        actions={
          <Button size="lg" onClick={startCreate}>
            Nova campanha
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((value) => (
          <Button
            key={value}
            size="sm"
            variant={filter === value ? "default" : "outline"}
            onClick={() => setFilter(value)}
          >
            {value === "historico" ? "Histórico" : STATUS_LABELS[value] ?? "Todas"}
          </Button>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState title="Nenhuma campanha" text="Crie uma campanha vinculada a um cliente e a uma plataforma." />
      ) : (
        <div className="grid gap-3">
          {items.map((campaign) => (
            <article key={campaign.id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-card p-5">
              <div>
                <StatusBadge status={campaign.status} />
                <h3 className="mt-2 font-heading text-xl">{campaign.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {campaign.client?.name} · {campaign.platform?.name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(campaign.start_date)}
                  {campaign.end_date ? ` – ${formatDate(campaign.end_date)}` : ""} · {money(campaign.budget)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild>
                  <Link to={`/campanhas/${campaign.id}`}>Abrir</Link>
                </Button>
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
            <Field label="Plataforma" error={form.formState.errors.platform_id?.message}>
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
