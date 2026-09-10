import { useState } from "react"
import { NavLink, Outlet } from "react-router-dom"
import { CalendarDays, FileText, LayoutDashboard, LogOut, Megaphone, Menu, Share2, Users } from "lucide-react"
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
  { to: "/", label: "Painel", icon: LayoutDashboard },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/campanhas", label: "Campanhas", icon: Megaphone },
  { to: "/calendario", label: "Calendário", icon: CalendarDays },
  { to: "/plataformas", label: "Canais", icon: Share2 },
  { to: "/relatorios", label: "Relatórios", icon: FileText },
]

function NavItems({ onClick }: { onClick?: () => void }) {
  return (
    <nav className="grid gap-1" aria-label="Principal">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.to === "/"}
          onClick={onClick}
          className={({ isActive }) =>
            cn(
              "flex h-9 items-center gap-3 rounded-full px-3 text-[12px] font-semibold tracking-[0.08em] text-muted-foreground uppercase transition-[background,color] duration-150 ease-[cubic-bezier(0.2,0,0,1)] hover:bg-white/[0.06] hover:text-foreground",
              isActive && "bg-white/[0.06] text-foreground",
            )
          }
        >
          {({ isActive }) => (
            <>
              <span className={cn("size-1.5 shrink-0 rounded-full", isActive ? "bg-primary" : "bg-transparent")} aria-hidden />
              <link.icon className="size-4" strokeWidth={1.75} />
              {link.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-1">
      <BrandMark size={22} />
      <div>
        <strong className="block font-heading text-[18px] leading-none font-bold tracking-[0.04em] uppercase">
          CampanhaHub
        </strong>
        <span className="mt-1 block text-[11px] tracking-[0.08em] text-[#7a7c84] uppercase">Mesa de mídia</span>
      </div>
    </div>
  )
}

function UserFooter({ onLogout }: { onLogout: () => void }) {
  const { user } = useAuth()
  return (
    <div className="mt-auto flex items-center gap-3 border-t border-[#2e3036] px-1 pt-4">
      <Avatar className="size-8 rounded-lg">
        <AvatarFallback className="rounded-lg bg-secondary font-mono text-[11px]">{initials(user?.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{user?.name}</p>
        <p className="truncate font-mono text-[11px] text-[#7a7c84]">{user?.email}</p>
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
    <div className="grid min-h-dvh lg:grid-cols-[248px_minmax(0,1fr)]">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-4 focus:rounded-full focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">
        Ir para o conteúdo
      </a>
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r bg-sidebar p-4 print:hidden lg:flex">
        <Brand />
        <NavItems />
        <UserFooter onLogout={() => setConfirmLogout(true)} />
      </aside>
      <main id="conteudo" className="mx-auto w-full max-w-[1440px] p-4 lg:p-8">
        <div className="mb-4 flex h-[52px] items-center justify-between print:hidden lg:hidden">
          <Brand />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="size-9" aria-label="Abrir menu">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col gap-6 bg-sidebar">
              <SheetHeader>
                <SheetTitle className="font-heading uppercase tracking-[0.08em]">Navegação</SheetTitle>
              </SheetHeader>
              <NavItems onClick={() => setOpen(false)} />
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
