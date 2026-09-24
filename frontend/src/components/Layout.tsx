import { useState, type ComponentProps } from "react"
import { NavLink, Outlet } from "react-router-dom"
import { CalendarDays, FileText, LayoutGrid, LogOut, Megaphone, Menu, Share2, Users } from "lucide-react"
import { useAuth } from "@/auth"
import { BrandMark } from "@/components/brand"
import { initials } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
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
import { cn } from "@/lib/utils"

const links = [
  { to: "/", label: "Painel", icon: LayoutGrid },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/campanhas", label: "Campanhas", icon: Megaphone },
  { to: "/calendario", label: "Calendário", icon: CalendarDays },
  { to: "/plataformas", label: "Canais", icon: Share2 },
  { to: "/relatorios", label: "Relatórios", icon: FileText },
]

function RailButton({
  active,
  label,
  children,
  className,
  ...props
}: ComponentProps<"button"> & { active?: boolean; label: string }) {
  return (
    <button
      title={label}
      aria-label={label}
      className={cn(
        "flex size-10 items-center justify-center rounded-xl transition-colors",
        active ? "bg-surface-raised text-data" : "text-fg-muted hover:bg-surface-raised hover:text-fg",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

function NavItems({
  onClick,
  variant = "rail",
}: {
  onClick?: () => void
  variant?: "rail" | "list"
}) {
  return (
    <nav className={cn(variant === "rail" ? "flex flex-1 flex-col items-center gap-2" : "grid gap-1")} aria-label="Principal">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.to === "/"}
          onClick={onClick}
          title={link.label}
          className={({ isActive }) =>
            variant === "rail"
              ? cn(
                  "flex size-10 items-center justify-center rounded-xl transition-colors",
                  isActive ? "bg-surface-raised text-data" : "text-fg-muted hover:bg-surface-raised hover:text-fg",
                )
              : cn(
                  "flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-raised hover:text-fg",
                  isActive && "bg-surface-raised text-data",
                )
          }
        >
          <link.icon className="size-5" strokeWidth={1.8} />
          {variant === "list" ? link.label : <span className="sr-only">{link.label}</span>}
        </NavLink>
      ))}
    </nav>
  )
}

function UserFooter({ onLogout }: { onLogout: () => void }) {
  const { user } = useAuth()
  return (
    <div className="mt-auto flex items-center gap-3 border-t border-edge px-1 pt-4">
      <Avatar className="size-8 rounded-lg">
        <AvatarFallback className="rounded-lg bg-surface-raised font-mono text-[11px]">{initials(user?.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{user?.name}</p>
        <p className="truncate font-mono text-[11px] text-fg-muted">{user?.email}</p>
      </div>
      <Button variant="ghost" size="icon" className="size-9" onClick={onLogout} aria-label="Sair">
        <LogOut className="size-4" />
      </Button>
    </div>
  )
}

export function Layout() {
  const { logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)

  return (
    <div className="flex h-dvh bg-background text-fg">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-4 focus:rounded-xl focus:bg-brand focus:px-3 focus:py-2 focus:text-background">
        Ir para o conteúdo
      </a>
      <aside className="hidden h-full w-16 shrink-0 flex-col items-center gap-8 border-r border-edge bg-surface/40 py-6 print:hidden lg:flex">
        <BrandMark size={20} />
        <NavItems />
        <RailButton label="Sair" className="hover:bg-negative/10 hover:text-negative" onClick={() => setConfirmLogout(true)}>
          <LogOut className="size-5" strokeWidth={1.8} />
        </RailButton>
      </aside>
      <main id="conteudo" className="flex-1 overflow-y-auto px-5 py-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex h-12 items-center justify-between print:hidden lg:hidden">
          <div className="flex items-center gap-3">
            <BrandMark size={18} />
            <div>
              <strong className="block font-serif text-lg leading-none font-semibold tracking-tight">CampanhaHub</strong>
              <span className="eyebrow mt-1 block text-brand">Mesa de mídia</span>
            </div>
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="size-10" aria-label="Abrir menu">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col gap-6 bg-background">
              <SheetHeader>
                <SheetTitle className="font-serif">Navegação</SheetTitle>
              </SheetHeader>
              <NavItems variant="list" onClick={() => setOpen(false)} />
              <Separator />
              <UserFooter onLogout={() => setConfirmLogout(true)} />
            </SheetContent>
          </Sheet>
        </div>
        <Outlet />
      </main>
      <AlertDialog open={confirmLogout} onOpenChange={setConfirmLogout}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair da mesa?</AlertDialogTitle>
            <AlertDialogDescription>Você vai precisar entrar de novo para ver campanhas e métricas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setOpen(false)
                logout()
              }}
            >
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
