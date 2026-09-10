import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState, KpiCard, NativeSelect, PageHeader, PageSkeleton, SearchField, SortButton, StatusBadge } from "@/components/shared"
import { getErrorMessage } from "@/lib/api"
import { formatDate, money, number, percent } from "@/lib/format"
import { compareValues, matchesSearch, toggleSort, type SortState } from "@/lib/list"
import { queryKeys } from "@/lib/query-keys"
import { clientsApi, reportsApi } from "@/lib/services"

export function ReportsPage() {
  const [clientId, setClientId] = useState("")
  const [status, setStatus] = useState("")
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<SortState<"name" | "investment" | "cpc" | "ctr">>({ key: "investment", dir: "desc" })

  const params = useMemo(() => {
    const next: Record<string, string> = {}
    if (clientId) next.client_id = clientId
    if (status) next.status = status
    if (start) next.start = start
    if (end) next.end = end
    return next
  }, [clientId, status, start, end])

  const { data: clients = [] } = useQuery({
    queryKey: queryKeys.clients,
    queryFn: clientsApi.list,
  })
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.reports(params),
    queryFn: () => reportsApi.get(params),
  })
  const hasFilters = Boolean(clientId || status || start || end)
  const rows = useMemo(() => {
    const source = data?.rows ?? []
    const filtered = source.filter((row) => matchesSearch([row.name, row.client, row.platform], query))
    return [...filtered].sort((left, right) => compareValues(left[sort.key], right[sort.key], sort.dir))
  }, [data, query, sort])

  async function exportCsv() {
    try {
      const blob = await reportsApi.exportCsv(params)
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "relatorio-campanhas.csv"
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  if (isLoading && !data) return <PageSkeleton />

  return (
    <div>
      <PageHeader
        title="Relatórios"
        description="Uma folha para mostrar — ou para imprimir."
        actions={
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" onClick={() => window.print()}>
              Imprimir
            </Button>
            <Button onClick={exportCsv}>Exportar CSV</Button>
          </div>
        }
      />

      <div className="mb-6 grid gap-3 print:hidden sm:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-1">
          <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Cliente</span>
          <NativeSelect value={clientId} onChange={(event) => setClientId(event.target.value)}>
            <option value="">Todos os clientes</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </NativeSelect>
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Status</span>
          <NativeSelect value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Todos os status</option>
            <option value="rascunho">Rascunho</option>
            <option value="ativa">Ativa</option>
            <option value="pausada">Pausada</option>
            <option value="finalizada">Finalizada</option>
          </NativeSelect>
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Início</span>
          <Input type="date" value={start} onChange={(event) => setStart(event.target.value)} />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Término</span>
          <Input type="date" value={end} onChange={(event) => setEnd(event.target.value)} />
        </label>
      </div>

      {data && data.rows.length > 0 ? (
        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Campanhas" value={data.total_campaigns} />
          <KpiCard label="Investimento" value={money(data.investment)} />
          <KpiCard label="Cliques" value={number(data.clicks)} />
          <KpiCard label="Conversões" value={number(data.conversions)} />
        </section>
      ) : null}

      {!data || data.rows.length === 0 ? (
        <EmptyState
          title={hasFilters ? "Nenhum dado para o filtro" : "Nenhuma campanha para relatar"}
          text={
            hasFilters
              ? "Ajuste o período, o cliente ou o status — ou limpe os filtros para ver tudo."
              : "Crie uma campanha primeiro. O relatório reúne investimento, CPC e CTR."
          }
          action={
            hasFilters ? (
              <Button
                variant="outline"
                onClick={() => {
                  setClientId("")
                  setStatus("")
                  setStart("")
                  setEnd("")
                }}
              >
                Limpar filtros
              </Button>
            ) : (
              <Button asChild>
                <Link to="/campanhas">Ir para campanhas</Link>
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="mb-4 print:hidden">
            <SearchField value={query} onChange={setQuery} placeholder="Buscar campanha, cliente ou canal" />
          </div>
          {rows.length === 0 ? (
            <EmptyState
              title={`Nada para “${query}”`}
              text="A busca filtra só a tabela; os totais acima continuam do recorte."
              action={
                <Button variant="outline" onClick={() => setQuery("")}>
                  Limpar busca
                </Button>
              }
            />
          ) : (
            <div className="overflow-hidden rounded-[12px] border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <SortButton label="Campanha" active={sort.key === "name"} direction={sort.dir} onClick={() => setSort(toggleSort(sort, "name"))} />
                    </TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-right">
                      <SortButton label="Investimento" active={sort.key === "investment"} direction={sort.dir} onClick={() => setSort(toggleSort(sort, "investment"))} align="right" />
                    </TableHead>
                    <TableHead className="text-right">
                      <SortButton label="CPC" active={sort.key === "cpc"} direction={sort.dir} onClick={() => setSort(toggleSort(sort, "cpc"))} align="right" />
                    </TableHead>
                    <TableHead className="text-right">
                      <SortButton label="CTR" active={sort.key === "ctr"} direction={sort.dir} onClick={() => setSort(toggleSort(sort, "ctr"))} align="right" />
                    </TableHead>
                    <TableHead className="text-right">Conversão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.client}</TableCell>
                      <TableCell>{row.platform}</TableCell>
                      <TableCell>
                        <StatusBadge status={row.status} />
                      </TableCell>
                      <TableCell>
                        {formatDate(row.start_date)}
                        {row.end_date ? ` – ${formatDate(row.end_date)}` : ""}
                      </TableCell>
                      <TableCell className="text-right font-mono">{money(row.investment)}</TableCell>
                      <TableCell className="text-right font-mono">{row.cpc !== null ? money(row.cpc) : "—"}</TableCell>
                      <TableCell className="text-right font-mono">{percent(row.ctr)}</TableCell>
                      <TableCell className="text-right font-mono">{percent(row.taxa_conversao)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
