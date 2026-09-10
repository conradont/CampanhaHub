import { api } from "@/lib/api"
import type { Campaign, CampaignSummary, Client, Content, DashboardData, DashboardFilters, Expense, Metric, Platform, ReportData, User } from "@/types"
import type { CampaignValues, ClientValues, ContentValues, ExpenseValues, LoginValues, MetricValues, PlatformValues, RegisterValues } from "@/lib/schemas"

export const authApi = {
  login: async (body: LoginValues) => (await api.post<{ access_token: string; user: User }>("/auth/login", body)).data,
  register: async (body: RegisterValues) => (await api.post<{ access_token: string; user: User }>("/auth/register", body)).data,
  me: async () => (await api.get<User>("/auth/me")).data,
}

export const clientsApi = {
  list: async () => (await api.get<Client[]>("/clients")).data,
  create: async (body: ClientValues) => (await api.post<Client>("/clients", body)).data,
  update: async (id: number, body: ClientValues) => (await api.put<Client>(`/clients/${id}`, body)).data,
  remove: async (id: number) => {
    await api.delete(`/clients/${id}`)
  },
}

export const platformsApi = {
  list: async () => (await api.get<Platform[]>("/platforms")).data,
  create: async (body: PlatformValues) => (await api.post<Platform>("/platforms", body)).data,
  remove: async (id: number) => {
    await api.delete(`/platforms/${id}`)
  },
}

export function toCampaignPayload(values: CampaignValues) {
  return { ...values, end_date: values.end_date || null }
}

export const campaignsApi = {
  list: async (status?: string) =>
    (await api.get<Campaign[]>("/campaigns", { params: status ? { status } : undefined })).data,
  get: async (id: number) => (await api.get<Campaign>(`/campaigns/${id}`)).data,
  summary: async (id: number) => (await api.get<CampaignSummary>(`/campaigns/${id}/summary`)).data,
  create: async (body: CampaignValues) => (await api.post<Campaign>("/campaigns", toCampaignPayload(body))).data,
  update: async (id: number, body: CampaignValues) => (await api.put<Campaign>(`/campaigns/${id}`, toCampaignPayload(body))).data,
  remove: async (id: number) => {
    await api.delete(`/campaigns/${id}`)
  },
}

export const contentsApi = {
  list: async (params: Record<string, string | number | undefined>) =>
    (await api.get<Content[]>("/contents", { params })).data,
  create: async (body: ContentValues) => (await api.post<Content>("/contents", body)).data,
  update: async (id: number, body: ContentValues) => (await api.put<Content>(`/contents/${id}`, body)).data,
  remove: async (id: number) => {
    await api.delete(`/contents/${id}`)
  },
}

export const metricsApi = {
  list: async (campaignId: number) => (await api.get<Metric[]>("/metrics", { params: { campaign_id: campaignId } })).data,
  create: async (body: MetricValues) => (await api.post<Metric>("/metrics", body)).data,
  remove: async (id: number) => {
    await api.delete(`/metrics/${id}`)
  },
}

export const expensesApi = {
  list: async (campaignId: number) => (await api.get<Expense[]>("/expenses", { params: { campaign_id: campaignId } })).data,
  create: async (body: ExpenseValues) => (await api.post<Expense>("/expenses", body)).data,
  remove: async (id: number) => {
    await api.delete(`/expenses/${id}`)
  },
}

export const dashboardApi = {
  get: async (filters: DashboardFilters = {}) =>
    (await api.get<DashboardData>("/dashboard", { params: filters })).data,
}

export const reportsApi = {
  get: async (params: Record<string, string>) => (await api.get<ReportData>("/reports", { params })).data,
  exportCsv: async (params: Record<string, string>) =>
    (await api.get("/reports/export.csv", { params, responseType: "blob" })).data as Blob,
}
