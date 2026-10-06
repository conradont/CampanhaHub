import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronLeft, MousePointerClick, Percent, Target, Trash2, Wallet } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
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
  experimentSchema,
  expenseSchema,
  keywordSchema,
  metricSchema,
  type ContentValues,
  type ExperimentValues,
  type ExpenseValues,
  type KeywordValues,
  type MetricValues,
} from "@/lib/schemas"
import { campaignsApi, contentsApi, experimentsApi, expensesApi, keywordsApi, metricsApi } from "@/lib/services"

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
    new_customers: 0,
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
    owner: "",
    approach: "",
    estimated_cost: 0,
  }
}

function emptyKeyword(campaignId: number): KeywordValues {
  return { campaign_id: campaignId, term: "", intent: "", target_url: "", notes: "" }
}

function emptyExperiment(campaignId: number): ExperimentValues {
  return { campaign_id: campaignId, hypothesis: "", metric_name: "", status: "ideia", learning: "" }
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
  const [keywordOpen, setKeywordOpen] = useState(false)
  const [experimentOpen, setExperimentOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{ kind: "metric" | "content" | "expense" | "keyword" | "experiment"; id: number; title: string } | null>(null)

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
  const keywordForm = useForm<KeywordValues>({
    resolver: zodResolver(keywordSchema),
    defaultValues: emptyKeyword(campaignId),
  })
  const experimentForm = useForm<ExperimentValues>({
    resolver: zodResolver(experimentSchema),
    defaultValues: emptyExperiment(campaignId),
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
  const { data: keywords = [] } = useQuery({
    queryKey: queryKeys.keywords(campaignId),
    queryFn: () => keywordsApi.list(campaignId),
    enabled: Number.isFinite(campaignId) && campaignId > 0,
  })
  const { data: experiments = [] } = useQuery({
    queryKey: queryKeys.experiments(campaignId),
    queryFn: () => experimentsApi.list(campaignId),
    enabled: Number.isFinite(campaignId) && campaignId > 0,
  })

  function invalidateCampaign() {
    queryClient.invalidateQueries({ queryKey: queryKeys.campaignSummary(campaignId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.metrics(campaignId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.contents({ campaign_id: campaignId }) })
    queryClient.invalidateQueries({ queryKey: queryKeys.expenses(campaignId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.keywords(campaignId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.experiments(campaignId) })
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
  const keywordMutation = useMutation({
    mutationFn: keywordsApi.create,
    onSuccess: () => {
      invalidateCampaign()
      toast.success("Palavra-chave registrada.")
      setKeywordOpen(false)
      keywordForm.reset(emptyKeyword(campaignId))
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
  const experimentMutation = useMutation({
    mutationFn: experimentsApi.create,
    onSuccess: () => {
      invalidateCampaign()
      toast.success("Experimento registrado.")
      setExperimentOpen(false)
      experimentForm.reset(emptyExperiment(campaignId))
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
  const deleteMutation = useMutation({
    mutationFn: async (item: { kind: "metric" | "content" | "expense" | "keyword" | "experiment"; id: number }) => {
      if (item.kind === "metric") await metricsApi.remove(item.id)
      else if (item.kind === "content") await contentsApi.remove(item.id)
      else if (item.kind === "keyword") await keywordsApi.remove(item.id)
      else if (item.kind === "experiment") await experimentsApi.remove(item.id)
      else await expensesApi.remove(item.id)
    },
    onSuccess: (_, item) => {
      invalidateCampaign()
      const labels = { metric: "Métrica excluída.", content: "Conteúdo excluído.", expense: "Investimento excluído.", keyword: "Palavra-chave excluída.", experiment: "Experimento excluído." }
      toast.success(labels[item.kind])
      setPendingDelete(null)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  if (isLoading || !summary) return <PageSkeleton />
  const { campaign, totals, indicators, goal } = summary
  const goalLabels: Record<string, string> = {
    alcance: "Alcance",
    cliques: "Cliques",
    conversoes: "Conversões",
    novos_clientes: "Novos clientes",
  }

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/campanhas" className="mb-2 inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
            <ChevronLeft className="size-4" /> Campanhas
          </Link>
          <span className="eyebrow text-brand">Campanha</span>
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-fg">{campaign.name}</h1>
          <p className="mt-2 text-sm text-fg-muted">
            {campaign.client?.name} · {campaign.platform?.name} · {campaign.objective || "Sem objetivo informado"}
            {goal.value > 0 && goal.metric ? ` · Meta de ${goalLabels[goal.metric] ?? goal.metric}: ${number(goal.actual)} de ${number(goal.value)}` : ""}
          </p>
        </div>
        <StatusBadge status={campaign.status} />
      </header>

      <section className="mb-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Wallet} tone="data" glow label="Investido" value={money(totals.investment)} />
        <KpiCard icon={MousePointerClick} label="CPC" value={indicators.cpc !== null ? money(indicators.cpc) : "—"} />
        <KpiCard icon={Target} label="CAC" value={indicators.cac !== null ? money(indicators.cac) : "—"} />
        <KpiCard icon={Percent} label="CTR" value={percent(indicators.ctr)} />
        <KpiCard icon={Target} tone="data" label="Conversão" value={percent(indicators.taxa_conversao)} />
      </section>
      <section className="mb-6 grid gap-4 rounded-2xl border border-edge bg-surface px-5 py-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Orçamento usado", summary.budget_used_percent !== null ? `${summary.budget_used_percent}%` : "—"],
          ["Alcance", number(totals.reach)],
          ["Cliques", number(totals.clicks)],
          ["Conversões", number(totals.conversions)],
          ["Novos clientes", number(totals.new_customers)],
        ].map(([label, value]) => (
          <div key={label}>
            <span className="eyebrow text-fg-muted">{label}</span>
            <strong className="mt-2 block font-rounded text-lg font-bold tabular-nums">{value}</strong>
          </div>
        ))}
      </section>

      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <TabsList>
          <TabsTrigger value="metricas">Métricas</TabsTrigger>
          <TabsTrigger value="conteudos">Conteúdos</TabsTrigger>
          <TabsTrigger value="despesas">Investimentos</TabsTrigger>
          <TabsTrigger value="palavras">Palavras-chave</TabsTrigger>
          <TabsTrigger value="experimentos">Experimentos</TabsTrigger>
        </TabsList>

        <TabsContent value="metricas" className="rounded-2xl border border-edge bg-surface p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <span className="eyebrow text-brand">Registro</span>
              <h2 className="font-serif text-2xl font-semibold tracking-tight">Métricas manuais</h2>
            </div>
            {metrics.length > 0 ? (
              <Button
                onClick={() => {
                  metricForm.reset(emptyMetric(campaignId))
                  setMetricOpen(true)
                }}
              >
                Registrar métricas
              </Button>
            ) : null}
          </div>
          {metrics.length === 0 ? (
            <EmptyState
              title="Sem métricas"
              text="Insira alcance, impressões, cliques e conversões manualmente."
              action={
                <Button
                  onClick={() => {
                    metricForm.reset(emptyMetric(campaignId))
                    setMetricOpen(true)
                  }}
                >
                  Registrar métricas
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Alcance</TableHead>
                  <TableHead className="text-right">Impressões</TableHead>
                  <TableHead className="text-right">Cliques</TableHead>
                  <TableHead className="text-right">Conversões</TableHead>
                  <TableHead className="text-right">Novos clientes</TableHead>
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
                    <TableCell className="text-right font-mono">{number(metric.new_customers)}</TableCell>
                    <TableCell className="text-right font-mono">{money(metric.investment)}</TableCell>
                    <TableCell className="text-right font-mono">{metric.indicators?.cpc != null ? money(metric.indicators.cpc) : "—"}</TableCell>
                    <TableCell className="text-right font-mono">{percent(metric.indicators?.ctr)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Excluir métrica"
                        onClick={() => setPendingDelete({ kind: "metric", id: metric.id, title: formatDate(metric.date) })}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="conteudos" className="rounded-2xl border border-edge bg-surface p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <span className="eyebrow text-brand">Fila</span>
              <h2 className="font-serif text-2xl font-semibold tracking-tight">Planejamento de conteúdos</h2>
            </div>
            {contents.length > 0 ? (
              <Button
                onClick={() => {
                  contentForm.reset(emptyContent(campaignId))
                  setContentOpen(true)
                }}
              >
                Novo conteúdo
              </Button>
            ) : null}
          </div>
          {contents.length === 0 ? (
            <EmptyState
              title="Nenhum conteúdo"
              text="Planeje posts, reels e anúncios com data prevista."
              action={
                <Button
                  onClick={() => {
                    contentForm.reset(emptyContent(campaignId))
                    setContentOpen(true)
                  }}
                >
                  Novo conteúdo
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
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
                      {content.notes ? <p className="text-sm text-fg-muted">{content.notes}</p> : null}
                    </TableCell>
                    <TableCell>
                      {content.content_type}
                      {content.owner ? <p className="text-sm text-fg-muted">{content.owner}</p> : null}
                    </TableCell>
                    <TableCell>{formatDate(content.scheduled_date)}</TableCell>
                    <TableCell>
                      <StatusBadge status={content.status} />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Excluir conteúdo"
                        onClick={() => setPendingDelete({ kind: "content", id: content.id, title: content.title })}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="despesas" className="rounded-2xl border border-edge bg-surface p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <span className="eyebrow text-brand">Caixa</span>
              <h2 className="font-serif text-2xl font-semibold tracking-tight">Investimentos e despesas</h2>
            </div>
            {expenses.length > 0 ? (
              <Button
                onClick={() => {
                  expenseForm.reset(emptyExpense(campaignId))
                  setExpenseOpen(true)
                }}
              >
                Registrar investimento
              </Button>
            ) : null}
          </div>
          {expenses.length === 0 ? (
            <EmptyState
              title="Nenhum investimento"
              text="Registre gastos de mídia, produção ou ferramentas."
              action={
                <Button
                  onClick={() => {
                    expenseForm.reset(emptyExpense(campaignId))
                    setExpenseOpen(true)
                  }}
                >
                  Registrar investimento
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
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
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Excluir investimento"
                        onClick={() => setPendingDelete({ kind: "expense", id: expense.id, title: expense.description })}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="palavras" className="rounded-2xl border border-edge bg-surface p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <span className="eyebrow text-brand">SEO</span>
              <h2 className="font-serif text-2xl font-semibold tracking-tight">Palavras-chave</h2>
            </div>
            {keywords.length > 0 ? (
              <Button onClick={() => { keywordForm.reset(emptyKeyword(campaignId)); setKeywordOpen(true) }}>Nova palavra</Button>
            ) : null}
          </div>
          {keywords.length === 0 ? (
            <EmptyState
              title="Nenhuma palavra-chave"
              text="Registre termos que a campanha quer ser encontrada. Não há rastreamento automático."
              action={<Button onClick={() => { keywordForm.reset(emptyKeyword(campaignId)); setKeywordOpen(true) }}>Nova palavra</Button>}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Termo</TableHead>
                  <TableHead>Intenção</TableHead>
                  <TableHead>Página</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {keywords.map((keyword) => (
                  <TableRow key={keyword.id}>
                    <TableCell>
                      <strong>{keyword.term}</strong>
                      {keyword.notes ? <p className="text-sm text-fg-muted">{keyword.notes}</p> : null}
                    </TableCell>
                    <TableCell>{keyword.intent || "—"}</TableCell>
                    <TableCell>{keyword.target_url || "—"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" aria-label="Excluir palavra-chave" onClick={() => setPendingDelete({ kind: "keyword", id: keyword.id, title: keyword.term })}>
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="experimentos" className="rounded-2xl border border-edge bg-surface p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <span className="eyebrow text-brand">Growth</span>
              <h2 className="font-serif text-2xl font-semibold tracking-tight">Experimentos</h2>
            </div>
            {experiments.length > 0 ? (
              <Button onClick={() => { experimentForm.reset(emptyExperiment(campaignId)); setExperimentOpen(true) }}>Novo experimento</Button>
            ) : null}
          </div>
          {experiments.length === 0 ? (
            <EmptyState
              title="Nenhum experimento"
              text="Anote uma hipótese, a métrica que vai observar e o que aprendeu."
              action={<Button onClick={() => { experimentForm.reset(emptyExperiment(campaignId)); setExperimentOpen(true) }}>Novo experimento</Button>}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hipótese</TableHead>
                  <TableHead>Métrica</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {experiments.map((experiment) => (
                  <TableRow key={experiment.id}>
                    <TableCell>
                      <strong>{experiment.hypothesis}</strong>
                      {experiment.learning ? <p className="text-sm text-fg-muted">{experiment.learning}</p> : null}
                    </TableCell>
                    <TableCell>{experiment.metric_name || "—"}</TableCell>
                    <TableCell><StatusBadge status={experiment.status} /></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" aria-label="Excluir experimento" onClick={() => setPendingDelete({ kind: "experiment", id: experiment.id, title: experiment.hypothesis })}>
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
            <Field label="Novos clientes" error={metricForm.formState.errors.new_customers?.message}>
              <Input type="number" min="0" {...metricForm.register("new_customers", { valueAsNumber: true })} />
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
            <Field label="Responsável" error={contentForm.formState.errors.owner?.message}>
              <Input {...contentForm.register("owner")} />
            </Field>
            <Field label="Como executar" error={contentForm.formState.errors.approach?.message}>
              <Textarea rows={2} {...contentForm.register("approach")} />
            </Field>
            <Field label="Custo estimado (R$)" error={contentForm.formState.errors.estimated_cost?.message}>
              <Input type="number" min="0" step="0.01" {...contentForm.register("estimated_cost", { valueAsNumber: true })} />
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

      <Dialog open={keywordOpen} onOpenChange={setKeywordOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova palavra-chave</DialogTitle>
          </DialogHeader>
          <form id="keyword-form" className="grid gap-4" onSubmit={keywordForm.handleSubmit((values) => keywordMutation.mutate({ ...values, campaign_id: campaignId }))}>
            <Field label="Termo" error={keywordForm.formState.errors.term?.message}>
              <Input {...keywordForm.register("term")} />
            </Field>
            <Field label="Intenção" error={keywordForm.formState.errors.intent?.message}>
              <Input {...keywordForm.register("intent")} />
            </Field>
            <Field label="Página de destino" error={keywordForm.formState.errors.target_url?.message}>
              <Input {...keywordForm.register("target_url")} />
            </Field>
            <Field label="Notas" error={keywordForm.formState.errors.notes?.message}>
              <Textarea rows={2} {...keywordForm.register("notes")} />
            </Field>
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setKeywordOpen(false)}>Cancelar</Button>
            <Button type="submit" form="keyword-form" disabled={keywordMutation.isPending}>{keywordMutation.isPending ? "Salvando…" : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={experimentOpen} onOpenChange={setExperimentOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo experimento</DialogTitle>
          </DialogHeader>
          <form id="experiment-form" className="grid gap-4" onSubmit={experimentForm.handleSubmit((values) => experimentMutation.mutate({ ...values, campaign_id: campaignId }))}>
            <Field label="Hipótese" error={experimentForm.formState.errors.hypothesis?.message}>
              <Textarea rows={3} {...experimentForm.register("hypothesis")} />
            </Field>
            <Field label="Métrica observada" error={experimentForm.formState.errors.metric_name?.message}>
              <Input {...experimentForm.register("metric_name")} />
            </Field>
            <Field label="Status" error={experimentForm.formState.errors.status?.message}>
              <NativeSelect {...experimentForm.register("status")}>
                <option value="ideia">Ideia</option>
                <option value="em_teste">Em teste</option>
                <option value="aprendido">Aprendido</option>
              </NativeSelect>
            </Field>
            <Field label="Aprendizado" error={experimentForm.formState.errors.learning?.message}>
              <Textarea rows={2} {...experimentForm.register("learning")} />
            </Field>
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setExperimentOpen(false)}>Cancelar</Button>
            <Button type="submit" form="experiment-form" disabled={experimentMutation.isPending}>{experimentMutation.isPending ? "Salvando…" : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(next) => !next && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete ? `“${pendingDelete.title}” será excluído.` : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => pendingDelete && deleteMutation.mutate(pendingDelete)}
            >
              {deleteMutation.isPending ? "Excluindo…" : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
