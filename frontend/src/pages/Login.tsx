import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useAuth } from "@/auth"
import { BrandMark } from "@/components/brand"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Field } from "@/components/shared"
import { getErrorMessage } from "@/lib/api"
import { loginSchema, registerSchema, type LoginValues, type RegisterValues } from "@/lib/schemas"

const formulas = [
  { label: "CPC", text: "investimento / cliques" },
  { label: "CTR", text: "cliques / impressões" },
  { label: "Conv.", text: "conversões / cliques" },
]

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
          <BrandMark size={28} />
          <div>
            <strong className="block font-heading text-lg leading-none font-bold tracking-[0.04em] uppercase">
              CampanhaHub
            </strong>
            <span className="mt-1 block text-[11px] tracking-[0.08em] text-[#7a7c84] uppercase">Para pequenas empresas</span>
          </div>
        </div>
        <h1 className="max-w-[16ch] font-heading text-[34px] leading-9 font-bold tracking-[0.02em] uppercase lg:text-[56px] lg:leading-[56px]">
          Onde a campanha para de se perder
        </h1>
        <p className="max-w-xl text-[14px] leading-[21px] text-[#7a7c84]">
          Clientes, verba, conteúdo e resultado no mesmo caderno — sem planilha paralela, sem métrica escondida no print do Instagram.
        </p>
        <div className="flex max-w-lg flex-col gap-2">
          {formulas.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-4 rounded-[12px] border border-[#2e3036] bg-[#16171b] px-4 py-3"
            >
              <strong className="font-mono text-[13px] text-foreground">{item.label}</strong>
              <span className="font-mono text-[11px] text-[#7a7c84]">{item.text}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="flex items-center justify-center border-t border-[#2e3036] bg-[#0f1014] p-6 lg:border-t-0 lg:border-l">
        <Card className="w-full max-w-sm border border-[#2e3036] bg-[#16171b] ring-0">
          <CardContent className="pt-6">
            <Tabs value={mode} onValueChange={(value) => setMode(value as "login" | "register")}>
              <TabsList className="mb-6 grid h-9 w-full grid-cols-2 rounded-full">
                <TabsTrigger value="login" className="rounded-full">
                  Entrar
                </TabsTrigger>
                <TabsTrigger value="register" className="rounded-full">
                  Criar conta
                </TabsTrigger>
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
