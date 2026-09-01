import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { EmptyState, Field, PageHeader, PageSkeleton, RowMenu } from "@/components/shared"
import { getErrorMessage } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"
import { platformSchema, type PlatformValues } from "@/lib/schemas"
import { platformsApi } from "@/lib/services"
import type { Platform } from "@/types"

const emptyPlatform: PlatformValues = { name: "", description: "" }

export function PlatformsPage() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [toDelete, setToDelete] = useState<Platform | null>(null)
  const form = useForm<PlatformValues>({
    resolver: zodResolver(platformSchema),
    defaultValues: emptyPlatform,
  })

  const { data: items = [], isLoading } = useQuery({
    queryKey: queryKeys.platforms,
    queryFn: platformsApi.list,
  })

  const saveMutation = useMutation({
    mutationFn: platformsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.platforms })
      toast.success("Plataforma cadastrada.")
      setOpen(false)
      form.reset(emptyPlatform)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => platformsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.platforms })
      toast.success("Plataforma removida.")
      setToDelete(null)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  if (isLoading) return <PageSkeleton />

  return (
    <div>
      <PageHeader
        title="Canais"
        description="Onde a peça vai ao ar."
        actions={
          <Button
            size="lg"
            onClick={() => {
              form.reset(emptyPlatform)
              setOpen(true)
            }}
          >
            Nova plataforma
          </Button>
        }
      />

      {items.length === 0 ? (
        <EmptyState title="Nenhuma plataforma" text="As plataformas padrão são criadas automaticamente no cadastro." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((platform) => (
            <Card key={platform.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <CardTitle className="font-heading text-lg">{platform.name}</CardTitle>
                <RowMenu onDelete={() => setToDelete(platform)} />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{platform.description || "Sem nota"}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova plataforma</DialogTitle>
          </DialogHeader>
          <form id="platform-form" className="grid gap-4" onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}>
            <Field label="Nome" error={form.formState.errors.name?.message}>
              <Input {...form.register("name")} />
            </Field>
            <Field label="Descrição" error={form.formState.errors.description?.message}>
              <Textarea rows={3} {...form.register("description")} />
            </Field>
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="platform-form" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(toDelete)} onOpenChange={(next) => !next && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover plataforma?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete ? `${toDelete.name} deixará de aparecer na lista de canais.` : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => toDelete && deleteMutation.mutate(toDelete.id)}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
