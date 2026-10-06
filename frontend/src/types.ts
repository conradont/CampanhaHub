export type User = {
  id: number
  name: string
  email: string
}

export type Client = {
  id: number
  name: string
  segment: string
  description: string
  positioning: string
  swot_strengths: string
  swot_weaknesses: string
  swot_opportunities: string
  swot_threats: string
  audience_geo: string
  audience_demo: string
  audience_behavior: string
  audience_psycho: string
  persona: string
  contact_email: string
  contact_phone: string
  status: string
  created_at: string
}

export type Platform = {
  id: number
  name: string
  description: string
}

export type Campaign = {
  id: number
  name: string
  objective: string
  description: string
  goal_metric: string
  goal_value: number
  strategy: string
  references: string
  client_id: number
  platform_id: number
  start_date: string
  end_date: string | null
  budget: number
  status: string
  created_at: string
  client?: Client
  platform?: Platform
}

export type Content = {
  id: number
  campaign_id: number
  title: string
  content_type: string
  scheduled_date: string
  status: string
  notes: string
  owner: string
  approach: string
  estimated_cost: number
}

export type Indicators = {
  cpc: number | null
  cac: number | null
  ctr: number | null
  taxa_conversao: number | null
  cpm: number | null
  taxa_engajamento: number | null
}

export type Metric = {
  id: number
  campaign_id: number
  date: string
  reach: number
  impressions: number
  clicks: number
  likes: number
  comments: number
  shares: number
  conversions: number
  new_customers: number
  investment: number
  indicators?: Indicators
}

export type Expense = {
  id: number
  campaign_id: number
  description: string
  amount: number
  date: string
  category: string
}

export type Keyword = {
  id: number
  campaign_id: number
  term: string
  intent: string
  target_url: string
  notes: string
}

export type Experiment = {
  id: number
  campaign_id: number
  hypothesis: string
  metric_name: string
  status: string
  learning: string
}

export type CampaignSummary = {
  campaign: Campaign
  totals: {
    reach: number
    impressions: number
    clicks: number
    conversions: number
    new_customers: number
    investment: number
    budget: number
  }
  indicators: Indicators
  goal: {
    metric: string
    value: number
    actual: number
    progress_percent: number | null
  }
  budget_used_percent: number | null
}

export type DashboardFilters = {
  period?: "30d" | "90d" | "12m" | "all"
  start?: string
  end?: string
  client_id?: number
  campaign_id?: number
  platform_id?: number
}

export type DashboardEvolutionPoint = {
  month: string
  date: string
  label: string
  investment: number
  conversions: number
  clicks: number
  impressions: number
  ctr: number | null
}

export type DashboardPlatformRow = {
  platform: string
  investment: number
  clicks: number
  conversions: number
  impressions: number
  share_percent: number
}

export type DashboardCampaignRow = {
  id: number
  campaign: string
  investment: number
  conversions: number
  clicks: number
  impressions: number
  cpc: number | null
  ctr: number | null
}

export type DashboardData = {
  filters: {
    period: string
    start: string | null
    end: string | null
    grain: "day" | "month"
    client_id: number | null
    campaign_id: number | null
    platform_id: number | null
  }
  overview: {
    total_campaigns: number
    total_investment: number
    total_conversions: number
    total_clicks: number
    total_new_customers: number
    average_ctr: number | null
    average_cpc: number | null
    average_cac: number | null
    comparison: {
      total_investment: { previous: number; delta_percent: number | null }
      total_clicks: { previous: number; delta_percent: number | null }
      total_conversions: { previous: number; delta_percent: number | null }
      total_new_customers: { previous: number; delta_percent: number | null }
      average_ctr: { previous: number | null; delta_percent: number | null }
      average_cpc: { previous: number | null; delta_percent: number | null }
      average_cac: { previous: number | null; delta_percent: number | null }
    } | null
  }
  funnel: {
    impressions: number
    clicks: number
    conversions: number
  }
  campaigns_total: number
  campaigns_active: number
  campaigns_finished: number
  campaigns_paused: number
  campaigns_draft: number
  totals: {
    reach: number
    impressions: number
    clicks: number
    conversions: number
    investment: number
  }
  indicators: Indicators
  by_platform: DashboardPlatformRow[]
  by_campaign: DashboardCampaignRow[]
  evolution: DashboardEvolutionPoint[]
}

export type ReportRow = {
  id: number
  name: string
  client: string
  platform: string
  status: string
  start_date: string
  end_date: string
  budget: number
  investment: number
  reach: number
  impressions: number
  clicks: number
  conversions: number
  new_customers: number
  cpc: number | null
  cac: number | null
  ctr: number | null
  taxa_conversao: number | null
}

export type ReportData = {
  total_campaigns: number
  investment: number
  clicks: number
  conversions: number
  rows: ReportRow[]
}
