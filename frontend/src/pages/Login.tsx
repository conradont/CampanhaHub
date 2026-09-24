import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { LogIn } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/auth"
import { BrandMark } from "@/components/brand"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Field } from "@/components/shared"
import { getErrorMessage } from "@/lib/api"
import { loginSchema, registerSchema, type LoginValues, type RegisterValues } from "@/lib/schemas"

export function LoginPage() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<"login" | "register">("login")

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })
  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  })

  async function onLogin(values: LoginValues) {
    try {
      await login(values)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function onRegister(values: RegisterValues) {
    try {
      await register(values)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <main className="flex h-dvh items-center justify-center bg-background px-8 py-8 text-fg">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <BrandMark size={24} />
          <span className="eyebrow text-brand">CampanhaHub</span>
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-fg">
            {mode === "login" ? "Entrar" : "Criar conta"}
          </h1>
          <p className="text-sm text-fg-muted">
            Clientes, verba e resultado no mesmo lugar.
          </p>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-edge bg-surface p-6">
          <Tabs value={mode} onValueChange={(value) => setMode(value as "login" | "register")}>
            <TabsList className="mb-2 grid h-10 w-full grid-cols-2 rounded-xl">
              <TabsTrigger value="login" className="rounded-lg">
                Entrar
              </TabsTrigger>
              <TabsTrigger value="register" className="rounded-lg">
                Criar conta
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {mode === "login" ? (
            <form className="grid gap-4" onSubmit={loginForm.handleSubmit(onLogin)}>
              <Field label="E-mail" error={loginForm.formState.errors.email?.message}>
                <Input type="email" autoComplete="email" placeholder="voce@email.com" {...loginForm.register("email")} />
              </Field>
              <Field label="Senha" error={loginForm.formState.errors.password?.message}>
                <Input type="password" autoComplete="current-password" placeholder="••••••••" {...loginForm.register("password")} />
              </Field>
              <Button size="lg" disabled={loginForm.formState.isSubmitting}>
                <LogIn className="size-4" strokeWidth={2} />
                {loginForm.formState.isSubmitting ? "Entrando…" : "Entrar"}
              </Button>
            </form>
          ) : (
            <form className="grid gap-4" onSubmit={registerForm.handleSubmit(onRegister)}>
              <Field label="Nome" error={registerForm.formState.errors.name?.message}>
                <Input autoComplete="name" {...registerForm.register("name")} />
              </Field>
              <Field label="E-mail" error={registerForm.formState.errors.email?.message}>
                <Input type="email" autoComplete="email" {...registerForm.register("email")} />
              </Field>
              <Field label="Senha" error={registerForm.formState.errors.password?.message}>
                <Input type="password" autoComplete="new-password" {...registerForm.register("password")} />
              </Field>
              <Button size="lg" disabled={registerForm.formState.isSubmitting}>
                {registerForm.formState.isSubmitting ? "Criando…" : "Criar conta"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
