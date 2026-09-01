export function money(value: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value ?? 0)
}

export function number(value: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR").format(value ?? 0)
}

export function percent(value: number | null | undefined) {
  if (value === null || value === undefined) return "—"
  return `${value.toLocaleString("pt-BR")}%`
}

export function compactMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

export function todayISO() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function formatDate(iso?: string | null) {
  if (!iso) return "—"
  const [year, month, day] = iso.split("-")
  if (!day) return iso
  return `${day}/${month}/${year}`
}

export const STATUS_LABELS: Record<string, string> = {
  rascunho: "Rascunho",
  ativa: "Ativa",
  pausada: "Pausada",
  finalizada: "Finalizada",
  ativo: "Ativo",
  inativo: "Inativo",
  planejado: "Planejado",
  em_producao: "Em produção",
  publicado: "Publicado",
  cancelado: "Cancelado",
}

export const CONTENT_TYPES = ["post", "reels", "stories", "vídeo", "carrossel", "anúncio", "e-mail", "blog"] as const

export function initials(name?: string) {
  if (!name) return "CH"
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}
