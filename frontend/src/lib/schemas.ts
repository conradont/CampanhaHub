import { z } from "zod"

export const loginSchema = z.object({
  email: z.email("Informe um e-mail válido"),
  password: z.string().min(6, "Mínimo de 6 caracteres"),
})

export const registerSchema = loginSchema.extend({
  name: z.string().min(2, "Informe o nome"),
})

export const clientSchema = z.object({
  name: z.string().min(2, "Informe o nome"),
  segment: z.string(),
  description: z.string(),
  contact_email: z.union([z.literal(""), z.email("E-mail inválido")]),
  contact_phone: z.string(),
  status: z.enum(["ativo", "inativo"]),
})

export const platformSchema = z.object({
  name: z.string().min(2, "Informe o nome"),
  description: z.string(),
})

export const campaignSchema = z.object({
  name: z.string().min(2, "Informe o nome"),
  objective: z.string(),
  description: z.string(),
  client_id: z.number().int().positive("Selecione um cliente"),
  platform_id: z.number().int().positive("Selecione um canal"),
  start_date: z.string().min(1, "Informe a data de início"),
  end_date: z.string(),
  budget: z.number().min(0, "Orçamento inválido"),
  status: z.enum(["rascunho", "ativa", "pausada", "finalizada"]),
})

export const contentSchema = z.object({
  campaign_id: z.number().int().positive("Selecione uma campanha"),
  title: z.string().min(2, "Informe o título"),
  content_type: z.string().min(1),
  scheduled_date: z.string().min(1, "Informe a data"),
  status: z.enum(["planejado", "em_producao", "publicado", "cancelado"]),
  notes: z.string(),
})

export const metricSchema = z.object({
  campaign_id: z.number().int().positive(),
  date: z.string().min(1, "Informe a data"),
  reach: z.number().int().min(0),
  impressions: z.number().int().min(0),
  clicks: z.number().int().min(0),
  likes: z.number().int().min(0),
  comments: z.number().int().min(0),
  shares: z.number().int().min(0),
  conversions: z.number().int().min(0),
  investment: z.number().min(0),
})

export const expenseSchema = z.object({
  campaign_id: z.number().int().positive(),
  description: z.string().min(2, "Informe a descrição"),
  amount: z.number().positive("Informe um valor"),
  date: z.string().min(1, "Informe a data"),
  category: z.enum(["mídia", "produção", "ferramenta", "outros"]),
})

export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>
export type ClientValues = z.infer<typeof clientSchema>
export type PlatformValues = z.infer<typeof platformSchema>
export type CampaignValues = z.infer<typeof campaignSchema>
export type ContentValues = z.infer<typeof contentSchema>
export type MetricValues = z.infer<typeof metricSchema>
export type ExpenseValues = z.infer<typeof expenseSchema>
