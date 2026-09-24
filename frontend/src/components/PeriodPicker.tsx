import { useState } from "react"
import { Calendar, Menu, Search } from "lucide-react"
import { matchPreset, PRESET_LABELS, PRESET_ORDER, presetRange, type DateRange, type PresetKey } from "@/lib/period"

export function PeriodPicker({
  range,
  onChange,
  onSearch,
  onApply,
}: {
  range: DateRange
  onChange: (range: DateRange) => void
  onSearch: () => void
  onApply: (range: DateRange) => void
}) {
  const [open, setOpen] = useState(false)
  const activePreset = matchPreset(range)

  function selectPreset(key: PresetKey) {
    onApply(presetRange(key))
    setOpen(false)
  }

  return (
    <div className="flex items-stretch gap-2">
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          title="Períodos rápidos"
          aria-label="Períodos rápidos"
          aria-expanded={open}
          className="flex h-full items-center justify-center rounded-xl border border-edge bg-surface px-3 text-fg-muted transition-colors hover:text-fg"
        >
          <Menu className="size-4" strokeWidth={1.8} />
        </button>
        {open ? (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute top-[calc(100%+0.5rem)] left-0 z-20 flex w-48 flex-col rounded-xl border border-edge bg-surface p-1 shadow-xl">
              {PRESET_ORDER.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectPreset(key)}
                  className={
                    activePreset === key
                      ? "rounded-lg px-3 py-2 text-left text-sm text-brand"
                      : "rounded-lg px-3 py-2 text-left text-sm text-fg-muted transition-colors hover:bg-surface-raised hover:text-fg"
                  }
                >
                  {PRESET_LABELS[key]}
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-edge bg-surface px-3 py-2">
        <Calendar className="size-4 text-fg-muted" strokeWidth={1.8} />
        <input
          type="date"
          value={range.start}
          max={range.end || undefined}
          onChange={(event) => onChange({ ...range, start: event.target.value })}
          className="bg-transparent font-mono text-xs text-fg outline-none [color-scheme:dark]"
        />
        <span className="text-fg-muted">—</span>
        <input
          type="date"
          value={range.end}
          min={range.start || undefined}
          onChange={(event) => onChange({ ...range, end: event.target.value })}
          className="bg-transparent font-mono text-xs text-fg outline-none [color-scheme:dark]"
        />
      </div>

      <button
        type="button"
        onClick={onSearch}
        title="Buscar período"
        aria-label="Buscar período"
        className="flex items-center justify-center rounded-xl border border-edge bg-surface px-3 py-2 text-fg-muted transition-colors hover:text-fg"
      >
        <Search className="size-4" strokeWidth={2.2} />
      </button>
    </div>
  )
}
