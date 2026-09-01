import { useState } from "react"
import { NavLink, Outlet } from "react-router-dom"
import { CalendarDays, FileText, LayoutDashboard, LogOut, Megaphone, Menu, Share2, Users } from "lucide-react"
import { useAuth } from "@/auth"
import { initials } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
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
              "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
              isActive && "bg-foreground text-background hover:bg-foreground hover:text-background",
            )
          }
        >
          <link.icon className="size-4" strokeWidth={1.75} />
          {link.label}
        </NavLink>
      ))}
    </nav>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-2">
      <span className="grid size-8 place-items-center rounded-lg bg-primary font-heading text-sm text-primary-foreground">
        C
      </span>
      <div>
        <strong className="block font-heading text-lg leading-none">CampanhaHub</strong>
        <span className="text-xs text-muted-foreground">Mesa de mídia</span>
      </div>
    </div>
  )
}

function UserFooter() {
  const { user, logout } = useAuth()
  return (
    <div className="mt-auto flex items-center gap-3 px-1 pt-4">
      <Avatar className="size-8 rounded-lg">
        <AvatarFallback className="rounded-lg bg-secondary text-xs">{initials(user?.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{user?.name}</p>
        <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
      </div>
      <Button variant="ghost" size="icon" onClick={logout} aria-label="Sair">
        <LogOut className="size-4" />
      </Button>
    </div>
  )
}

export function Layout() {
  const [open, setOpen] = useState(false)

  return (
    <div className="grid min-h-dvh lg:grid-cols-[248px_minmax(0,1fr)]">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-4 focus:rounded-lg focus:bg-foreground focus:px-3 focus:py-2 focus:text-background">
        Ir para o conteúdo
      </a>
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r bg-sidebar p-4 print:hidden lg:flex">
        <Brand />
        <NavItems />
        <UserFooter />
      </aside>
      <main id="conteudo" className="mx-auto w-full max-w-[1440px] p-4 lg:p-8">
        <div className="mb-4 flex items-center justify-between print:hidden lg:hidden">
          <Brand />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Abrir menu">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col gap-6">
              <SheetHeader>
                <SheetTitle>Navegação</SheetTitle>
              </SheetHeader>
              <NavItems onClick={() => setOpen(false)} />
              <Separator />
              <UserFooter />
            </SheetContent>
          </Sheet>
        </div>
        <Outlet />
      </main>
    </div>
  )
}
