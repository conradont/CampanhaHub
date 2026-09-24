import { useMemo, useState } from "react"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { EmptyState, Field, NativeSelect, PageHeader, PageSkeleton, RowMenu, SearchField, SortButton, StatusBadge } from "@/components/shared"
import { getErrorMessage } from "@/lib/api"
import { compareValues, matchesSearch, toggleSort, type SortState } from "@/lib/list"
import { queryKeys } from "@/lib/query-keys"
import { clientSchema, type ClientValues } from "@/lib/schemas"
import { clientsApi } from "@/lib/services"
import type { Client } from "@/types"

const emptyClient: ClientValues = {
  name: "",
  segment: "",
  description: "",
  contact_email: "",
  contact_phone: "",
  status: "ativo",
}

export function ClientsPage() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<SortState<"name" | "segment" | "status">>({ key: "name", dir: "asc" })
  const [editing, setEditing] = useState<Client | null>(null)
  const [toDelete, setToDelete] = useState<Client | null>(null)

  const form = useForm<ClientValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: emptyClient,
  })

  const { data: items = [], isLoading } = useQuery({
    queryKey: queryKeys.clients,
    queryFn: clientsApi.list,
  })

  const saveMutation = useMutation({
    mutationFn: (values: ClientValues) =>
      editing ? clientsApi.update(editing.id, values) : clientsApi.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients })
      toast.success(editing ? "Cliente atualizado." : "Cliente cadastrado.")
      setOpen(false)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => clientsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients })
      toast.success("Cliente excluído.")
      setToDelete(null)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const visible = useMemo(() => {
    const filtered = items.filter((client) =>
      matchesSearch([client.name, client.segment, client.contact_email, client.contact_phone, client.description], query),
    )
    return [...filtered].sort((left, right) => compareValues(left[sort.key], right[sort.key], sort.dir))
  }, [items, query, sort])

  function startCreate() {
    setEditing(null)
    form.reset(emptyClient)
    setOpen(true)
  }

  function startEdit(client: Client) {
    setEditing(client)
    form.reset({
      name: client.name,
      segment: client.segment,
      description: client.description,
      contact_email: client.contact_email,
      contact_phone: client.contact_phone,
      status: client.status === "inativo" ? "inativo" : "ativo",
    })
    setOpen(true)
  }

  if (isLoading) return <PageSkeleton />

  return (
    <div>
      <PageHeader
        eyebrow="Carteira"
        title="Clientes"
        description="Quem paga a campanha — e em qual setor atua."
        actions={
          <Button size="lg" onClick={startCreate}>
            Novo cliente
          </Button>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          title="Nenhum cliente ainda"
          text="Cadastre o primeiro cliente para começar a criar campanhas."
          action={
            <Button onClick={startCreate}>Novo cliente</Button>
          }
        />
      ) : (
        <>
          <div className="mb-4">
            <SearchField value={query} onChange={setQuery} placeholder="Buscar nome, segmento ou contato" />
          </div>
          {visible.length === 0 ? (
            <EmptyState
              title={`Nada para “${query}”`}
              text="Tente outro termo ou limpe a busca."
              action={
                <Button variant="outline" onClick={() => setQuery("")}>
                  Limpar busca
                </Button>
              }
            />
          ) : (
        <section className="overflow-hidden rounded-2xl border border-edge bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortButton label="Nome" active={sort.key === "name"} direction={sort.dir} onClick={() => setSort(toggleSort(sort, "name"))} />
                </TableHead>
                <TableHead>
                  <SortButton label="Segmento" active={sort.key === "segment"} direction={sort.dir} onClick={() => setSort(toggleSort(sort, "segment"))} />
                </TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>
                  <SortButton label="Status" active={sort.key === "status"} direction={sort.dir} onClick={() => setSort(toggleSort(sort, "status"))} />
                </TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <strong>{client.name}</strong>
                    {client.description ? <p className="text-sm text-fg-muted">{client.description}</p> : null}
                  </TableCell>
                  <TableCell>{client.segment || "—"}</TableCell>
                  <TableCell>
                    {client.contact_email || "—"}
                    {client.contact_phone ? <p className="text-sm text-fg-muted">{client.contact_phone}</p> : null}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={client.status} />
                  </TableCell>
                  <TableCell>
                    <RowMenu onEdit={() => startEdit(client)} onDelete={() => setToDelete(client)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
          )}
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          </DialogHeader>
          <form id="client-form" className="grid gap-4" onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}>
            <Field label="Nome" error={form.formState.errors.name?.message}>
              <Input {...form.register("name")} />
            </Field>
            <Field label="Segmento" error={form.formState.errors.segment?.message}>
              <Input {...form.register("segment")} />
            </Field>
            <Field label="E-mail de contato" error={form.formState.errors.contact_email?.message}>
              <Input type="email" {...form.register("contact_email")} />
            </Field>
            <Field label="Telefone" error={form.formState.errors.contact_phone?.message}>
              <Input {...form.register("contact_phone")} />
            </Field>
            <Field label="Status" error={form.formState.errors.status?.message}>
              <NativeSelect {...form.register("status")}>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </NativeSelect>
            </Field>
            <Field label="Descrição" error={form.formState.errors.description?.message}>
              <Textarea rows={3} {...form.register("description")} />
            </Field>
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="client-form" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(toDelete)} onOpenChange={(next) => !next && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete ? `O cliente ${toDelete.name} será removido. Campanhas vinculadas podem ser afetadas.` : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => toDelete && deleteMutation.mutate(toDelete.id)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
