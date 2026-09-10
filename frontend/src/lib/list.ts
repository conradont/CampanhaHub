export type SortDir = "asc" | "desc"

export type SortState<K extends string = string> = {
  key: K
  dir: SortDir
}

export function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
}

export function matchesSearch(haystack: Array<string | null | undefined>, query: string) {
  const needle = normalizeSearch(query)
  if (!needle) return true
  return haystack.some((part) => normalizeSearch(part ?? "").includes(needle))
}

export function toggleSort<K extends string>(current: SortState<K>, key: K): SortState<K> {
  if (current.key === key) return { key, dir: current.dir === "asc" ? "desc" : "asc" }
  return { key, dir: "asc" }
}

export function compareValues(left: string | number | null | undefined, right: string | number | null | undefined, dir: SortDir) {
  const empty = dir === "asc" ? 1 : -1
  if (left == null && right == null) return 0
  if (left == null) return empty
  if (right == null) return -empty
  const result =
    typeof left === "number" && typeof right === "number"
      ? left - right
      : String(left).localeCompare(String(right), "pt-BR", { numeric: true, sensitivity: "base" })
  return dir === "asc" ? result : -result
}
