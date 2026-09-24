import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export function BrandMark({ size = 22, className }: { size?: number; className?: string }) {
  const box = size + 18
  return (
    <span
      className={cn("flex items-center justify-center rounded-xl bg-brand-soft", className)}
      style={{ width: box, height: box }}
      aria-hidden
    >
      <Sparkles className="text-brand" style={{ width: size, height: size }} strokeWidth={2.2} />
    </span>
  )
}
