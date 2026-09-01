import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useAuth } from "@/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
    <div className="grid min-h-dvh lg:grid-cols-[1.15fr_0.85fr]">
      <section className="flex flex-col justify-center gap-6 p-8 lg:p-16">
        <div className="flex items-center gap-3">
          <span className="grid size-8 place-items-center rounded-lg bg-primary font-heading text-sm text-primary-foreground">C</span>
          <div>
            <strong className="block font-heading text-lg leading-none">CampanhaHub</strong>
            <span className="text-xs text-muted-foreground">Para pequenas empresas</span>
          </div>
        </div>
        <h1 className="max-w-[14ch] font-heading text-4xl font-medium lg:text-6xl">A mesa onde a campanha para de se perder.</h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Clientes, verba, conteúdo e resultado no mesmo caderno — sem planilha paralela, sem métrica escondida no print do Instagram.
        </p>
        <div className="flex max-w-lg gap-8 border-t pt-4 text-sm text-muted-foreground">
          <div><strong className="mb-1 block font-mono text-lg text-foreground">CPC</strong>investimento / cliques</div>
          <div><strong className="mb-1 block font-mono text-lg text-foreground">CTR</strong>cliques / impressões</div>
          <div><strong className="mb-1 block font-mono text-lg text-foreground">Conv.</strong>conversões / cliques</div>
        </div>
      </section>
      <section className="flex items-center justify-center p-6">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6">
            <Tabs value={mode} onValueChange={(value) => setMode(value as "login" | "register")}>
              <TabsList className="mb-6 grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="register">Criar conta</TabsTrigger>
              </TabsList>
            </Tabs>
            {mode === "login" ? (
              <form className="grid gap-4" onSubmit={loginForm.handleSubmit(onLogin)}>
                <Field label="E-mail" error={loginForm.formState.errors.email?.message}>
                  <Input type="email" autoComplete="email" {...loginForm.register("email")} />
                </Field>
                <Field label="Senha" error={loginForm.formState.errors.password?.message}>
                  <Input type="password" autoComplete="current-password" {...loginForm.register("password")} />
                </Field>
                <Button size="lg" disabled={loginForm.formState.isSubmitting}>
                  {loginForm.formState.isSubmitting ? "Entrando…" : "Entrar na mesa"}
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
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
