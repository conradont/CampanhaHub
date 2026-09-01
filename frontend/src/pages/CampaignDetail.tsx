import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronLeft, Trash2 } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState, Field, KpiCard, NativeSelect, PageSkeleton, StatusBadge } from "@/components/shared"
import { getErrorMessage } from "@/lib/api"
import { CONTENT_TYPES, formatDate, money, number, percent, todayISO } from "@/lib/format"
import { queryKeys } from "@/lib/query-keys"
import {
  contentSchema,
  expenseSchema,
  metricSchema,
  type ContentValues,
  type ExpenseValues,
  type MetricValues,
} from "@/lib/schemas"
import { campaignsApi, contentsApi, expensesApi, metricsApi } from "@/lib/services"

function emptyMetric(campaignId: number): MetricValues {
  return {
    campaign_id: campaignId,
    date: todayISO(),
    reach: 0,
    impressions: 0,
    clicks: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    conversions: 0,
    investment: 0,
  }
}

function emptyContent(campaignId: number): ContentValues {
  return {
    campaign_id: campaignId,
    title: "",
    content_type: "post",
    scheduled_date: todayISO(),
    status: "planejado",
    notes: "",
  }
}

function emptyExpense(campaignId: number): ExpenseValues {
  return {
    campaign_id: campaignId,
    description: "",
    amount: 0.01,
    date: todayISO(),
    category: "mídia",
  }
}

export function CampaignDetailPage() {
  const { id } = useParams()
  const campaignId = Number(id)
  const queryClient = useQueryClient()
  const [tab, setTab] = useState("metricas")
  const [metricOpen, setMetricOpen] = useState(false)
  const [contentOpen, setContentOpen] = useState(false)
  const [expenseOpen, setExpenseOpen] = useState(false)

  const metricForm = useForm<MetricValues>({
    resolver: zodResolver(metricSchema),
    defaultValues: emptyMetric(campaignId),
  })
  const contentForm = useForm<ContentValues>({
    resolver: zodResolver(contentSchema),
    defaultValues: emptyContent(campaignId),
  })
  const expenseForm = useForm<ExpenseValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: emptyExpense(campaignId),
  })

  const { data: summary, isLoading } = useQuery({
    queryKey: queryKeys.campaignSummary(campaignId),
    queryFn: () => campaignsApi.summary(campaignId),
    enabled: Number.isFinite(campaignId) && campaignId > 0,
  })
  const { data: metrics = [] } = useQuery({
    queryKey: queryKeys.metrics(campaignId),
    queryFn: () => metricsApi.list(campaignId),
    enabled: Number.isFinite(campaignId) && campaignId > 0,
  })
  const { data: contents = [] } = useQuery({
    queryKey: queryKeys.contents({ campaign_id: campaignId }),
    queryFn: () => contentsApi.list({ campaign_id: campaignId }),
    enabled: Number.isFinite(campaignId) && campaignId > 0,
  })
  const { data: expenses = [] } = useQuery({
    queryKey: queryKeys.expenses(campaignId),
    queryFn: () => expensesApi.list(campaignId),
    enabled: Number.isFinite(campaignId) && campaignId > 0,
  })

  function invalidateCampaign() {
    queryClient.invalidateQueries({ queryKey: queryKeys.campaignSummary(campaignId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.metrics(campaignId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.contents({ campaign_id: campaignId }) })
    queryClient.invalidateQueries({ queryKey: queryKeys.expenses(campaignId) })
    queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    queryClient.invalidateQueries({ queryKey: ["contents"] })
  }

  const metricMutation = useMutation({
    mutationFn: metricsApi.create,
    onSuccess: () => {
      invalidateCampaign()
      toast.success("Métricas registradas.")
      setMetricOpen(false)
      metricForm.reset(emptyMetric(campaignId))
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
  const contentMutation = useMutation({
    mutationFn: contentsApi.create,
    onSuccess: () => {
      invalidateCampaign()
      toast.success("Conteúdo planejado.")
      setContentOpen(false)
      contentForm.reset(emptyContent(campaignId))
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
  const expenseMutation = useMutation({
    mutationFn: expensesApi.create,
    onSuccess: () => {
      invalidateCampaign()
      toast.success("Investimento registrado.")
      setExpenseOpen(false)
      expenseForm.reset(emptyExpense(campaignId))
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  async function removeMetric(metricId: number) {
    try {
      await metricsApi.remove(metricId)
      invalidateCampaign()
      toast.success("Métrica excluída.")
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function removeContent(contentId: number) {
    try {
      await contentsApi.remove(contentId)
      invalidateCampaign()
      toast.success("Conteúdo excluído.")
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function removeExpense(expenseId: number) {
    try {
      await expensesApi.remove(expenseId)
      invalidateCampaign()
      toast.success("Investimento excluído.")
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  if (isLoading || !summary) return <PageSkeleton />
  const { campaign, totals, indicators } = summary

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/campanhas" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="size-4" /> Campanhas
          </Link>
          <h1 className="font-heading text-3xl font-medium">{campaign.name}</h1>
          <p className="mt-2 text-muted-foreground">
            {campaign.client?.name} · {campaign.platform?.name} · {campaign.objective || "Sem objetivo informado"}
          </p>
        </div>
        <StatusBadge status={campaign.status} />
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Investido" value={money(totals.investment)} />
        <KpiCard label="CPC" value={indicators.cpc !== null ? money(indicators.cpc) : "—"} />
        <KpiCard label="CTR" value={percent(indicators.ctr)} />
        <KpiCard label="Conversão" value={percent(indicators.taxa_conversao)} />
      </section>
      <section className="mb-6 grid gap-4 border-y py-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Orçamento usado", summary.budget_used_percent !== null ? `${summary.budget_used_percent}%` : "—"],
          ["Alcance", number(totals.reach)],
          ["Cliques", number(totals.clicks)],
          ["Conversões", number(totals.conversions)],
        ].map(([label, value]) => (
          <div key={label}>
            <span className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase">{label}</span>
            <strong className="mt-2 block font-mono text-lg">{value}</strong>
          </div>
        ))}
      </section>

      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <TabsList>
          <TabsTrigger value="metricas">Métricas</TabsTrigger>
          <TabsTrigger value="conteudos">Conteúdos</TabsTrigger>
          <TabsTrigger value="despesas">Investimentos</TabsTrigger>
        </TabsList>

        <TabsContent value="metricas" className="rounded-lg border bg-card p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-heading text-xl">Métricas manuais</h2>
            <Button
              onClick={() => {
                metricForm.reset(emptyMetric(campaignId))
                setMetricOpen(true)
              }}
            >
              Registrar métricas
            </Button>
          </div>
          {metrics.length === 0 ? (
            <EmptyState title="Sem métricas" text="Insira alcance, impressões, cliques e conversões manualmente." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Alcance</TableHead>
                  <TableHead className="text-right">Impressões</TableHead>
                  <TableHead className="text-right">Cliques</TableHead>
                  <TableHead className="text-right">Conversões</TableHead>
                  <TableHead className="text-right">Investimento</TableHead>
                  <TableHead className="text-right">CPC</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.map((metric) => (
                  <TableRow key={metric.id}>
                    <TableCell>{formatDate(metric.date)}</TableCell>
                    <TableCell className="text-right font-mono">{number(metric.reach)}</TableCell>
                    <TableCell className="text-right font-mono">{number(metric.impressions)}</TableCell>
                    <TableCell className="text-right font-mono">{number(metric.clicks)}</TableCell>
                    <TableCell className="text-right font-mono">{number(metric.conversions)}</TableCell>
                    <TableCell className="text-right font-mono">{money(metric.investment)}</TableCell>
                    <TableCell className="text-right font-mono">{metric.indicators?.cpc != null ? money(metric.indicators.cpc) : "—"}</TableCell>
                    <TableCell className="text-right font-mono">{percent(metric.indicators?.ctr)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" aria-label="Excluir métrica" onClick={() => removeMetric(metric.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="conteudos" className="rounded-lg border bg-card p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-heading text-xl">Planejamento de conteúdos</h2>
            <Button
              onClick={() => {
                contentForm.reset(emptyContent(campaignId))
                setContentOpen(true)
              }}
            >
              Novo conteúdo
            </Button>
          </div>
          {contents.length === 0 ? (
            <EmptyState title="Nenhum conteúdo" text="Planeje posts, reels e anúncios com data prevista." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {contents.map((content) => (
                  <TableRow key={content.id}>
                    <TableCell>
                      <strong>{content.title}</strong>
                      {content.notes ? <p className="text-sm text-muted-foreground">{content.notes}</p> : null}
                    </TableCell>
                    <TableCell>{content.content_type}</TableCell>
                    <TableCell>{formatDate(content.scheduled_date)}</TableCell>
                    <TableCell>
                      <StatusBadge status={content.status} />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" aria-label="Excluir conteúdo" onClick={() => removeContent(content.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="despesas" className="rounded-lg border bg-card p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-heading text-xl">Investimentos e despesas</h2>
            <Button
              onClick={() => {
                expenseForm.reset(emptyExpense(campaignId))
                setExpenseOpen(true)
              }}
            >
              Registrar investimento
            </Button>
          </div>
          {expenses.length === 0 ? (
            <EmptyState title="Nenhum investimento" text="Registre gastos de mídia, produção ou ferramentas." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{formatDate(expense.date)}</TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell className="text-right font-mono">{money(expense.amount)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" aria-label="Excluir investimento" onClick={() => removeExpense(expense.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={metricOpen} onOpenChange={setMetricOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar métricas</DialogTitle>
          </DialogHeader>
          <form id="metric-form" className="grid gap-4 sm:grid-cols-2" onSubmit={metricForm.handleSubmit((values) => metricMutation.mutate({ ...values, campaign_id: campaignId }))}>
            <Field label="Data" error={metricForm.formState.errors.date?.message}>
              <Input type="date" {...metricForm.register("date")} />
            </Field>
            <Field label="Investimento do período (R$)" error={metricForm.formState.errors.investment?.message}>
              <Input type="number" min="0" step="0.01" {...metricForm.register("investment", { valueAsNumber: true })} />
            </Field>
            <Field label="Alcance" error={metricForm.formState.errors.reach?.message}>
              <Input type="number" min="0" {...metricForm.register("reach", { valueAsNumber: true })} />
            </Field>
            <Field label="Impressões" error={metricForm.formState.errors.impressions?.message}>
              <Input type="number" min="0" {...metricForm.register("impressions", { valueAsNumber: true })} />
            </Field>
            <Field label="Cliques" error={metricForm.formState.errors.clicks?.message}>
              <Input type="number" min="0" {...metricForm.register("clicks", { valueAsNumber: true })} />
            </Field>
            <Field label="Conversões" error={metricForm.formState.errors.conversions?.message}>
              <Input type="number" min="0" {...metricForm.register("conversions", { valueAsNumber: true })} />
            </Field>
            <Field label="Curtidas" error={metricForm.formState.errors.likes?.message}>
              <Input type="number" min="0" {...metricForm.register("likes", { valueAsNumber: true })} />
            </Field>
            <Field label="Comentários" error={metricForm.formState.errors.comments?.message}>
              <Input type="number" min="0" {...metricForm.register("comments", { valueAsNumber: true })} />
            </Field>
            <Field label="Compartilhamentos" error={metricForm.formState.errors.shares?.message}>
              <Input type="number" min="0" {...metricForm.register("shares", { valueAsNumber: true })} />
            </Field>
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setMetricOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="metric-form" disabled={metricMutation.isPending}>
              {metricMutation.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={contentOpen} onOpenChange={setContentOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo conteúdo</DialogTitle>
          </DialogHeader>
          <form id="content-form" className="grid gap-4" onSubmit={contentForm.handleSubmit((values) => contentMutation.mutate({ ...values, campaign_id: campaignId }))}>
            <Field label="Título" error={contentForm.formState.errors.title?.message}>
              <Input {...contentForm.register("title")} />
            </Field>
            <Field label="Tipo" error={contentForm.formState.errors.content_type?.message}>
              <NativeSelect {...contentForm.register("content_type")}>
                {CONTENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Data prevista" error={contentForm.formState.errors.scheduled_date?.message}>
              <Input type="date" {...contentForm.register("scheduled_date")} />
            </Field>
            <Field label="Status" error={contentForm.formState.errors.status?.message}>
              <NativeSelect {...contentForm.register("status")}>
                <option value="planejado">Planejado</option>
                <option value="em_producao">Em produção</option>
                <option value="publicado">Publicado</option>
                <option value="cancelado">Cancelado</option>
              </NativeSelect>
            </Field>
            <Field label="Observações" error={contentForm.formState.errors.notes?.message}>
              <Textarea rows={3} {...contentForm.register("notes")} />
            </Field>
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setContentOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="content-form" disabled={contentMutation.isPending}>
              {contentMutation.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar investimento</DialogTitle>
          </DialogHeader>
          <form id="expense-form" className="grid gap-4" onSubmit={expenseForm.handleSubmit((values) => expenseMutation.mutate({ ...values, campaign_id: campaignId }))}>
            <Field label="Descrição" error={expenseForm.formState.errors.description?.message}>
              <Input {...expenseForm.register("description")} />
            </Field>
            <Field label="Valor (R$)" error={expenseForm.formState.errors.amount?.message}>
              <Input type="number" min="0.01" step="0.01" {...expenseForm.register("amount", { valueAsNumber: true })} />
            </Field>
            <Field label="Data" error={expenseForm.formState.errors.date?.message}>
              <Input type="date" {...expenseForm.register("date")} />
            </Field>
            <Field label="Categoria" error={expenseForm.formState.errors.category?.message}>
              <NativeSelect {...expenseForm.register("category")}>
                <option value="mídia">Mídia</option>
                <option value="produção">Produção</option>
                <option value="ferramenta">Ferramenta</option>
                <option value="outros">Outros</option>
              </NativeSelect>
            </Field>
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setExpenseOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="expense-form" disabled={expenseMutation.isPending}>
              {expenseMutation.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
