from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(ORMModel):
    id: int
    name: str
    email: EmailStr
    created_at: datetime


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ClientCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    segment: str = ""
    description: str = ""
    positioning: str = ""
    swot_strengths: str = ""
    swot_weaknesses: str = ""
    swot_opportunities: str = ""
    swot_threats: str = ""
    audience_geo: str = ""
    audience_demo: str = ""
    audience_behavior: str = ""
    audience_psycho: str = ""
    persona: str = ""
    contact_email: str = ""
    contact_phone: str = ""
    status: str = "ativo"


class ClientOut(ORMModel):
    id: int
    name: str
    segment: str
    description: str
    positioning: str
    swot_strengths: str
    swot_weaknesses: str
    swot_opportunities: str
    swot_threats: str
    audience_geo: str
    audience_demo: str
    audience_behavior: str
    audience_psycho: str
    persona: str
    contact_email: str
    contact_phone: str
    status: str
    created_at: datetime


class PlatformCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    description: str = ""


class PlatformOut(ORMModel):
    id: int
    name: str
    description: str
    created_at: datetime


class CampaignCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    objective: str = ""
    description: str = ""
    goal_metric: str = ""
    goal_value: float = 0
    strategy: str = ""
    references: str = ""
    client_id: int
    platform_id: int
    start_date: date
    end_date: date | None = None
    budget: float = 0
    status: str = "rascunho"


class CampaignOut(ORMModel):
    id: int
    name: str
    objective: str
    description: str
    goal_metric: str
    goal_value: float
    strategy: str
    references: str
    client_id: int
    platform_id: int
    start_date: date
    end_date: date | None
    budget: float
    status: str
    created_at: datetime
    client: ClientOut | None = None
    platform: PlatformOut | None = None


class ContentCreate(BaseModel):
    campaign_id: int
    title: str = Field(min_length=2, max_length=180)
    content_type: str = "post"
    scheduled_date: date
    status: str = "planejado"
    notes: str = ""
    owner: str = ""
    approach: str = ""
    estimated_cost: float = 0


class ContentOut(ORMModel):
    id: int
    campaign_id: int
    title: str
    content_type: str
    scheduled_date: date
    status: str
    notes: str
    owner: str
    approach: str
    estimated_cost: float
    created_at: datetime


class MetricCreate(BaseModel):
    campaign_id: int
    date: date
    reach: int = 0
    impressions: int = 0
    clicks: int = 0
    likes: int = 0
    comments: int = 0
    shares: int = 0
    conversions: int = 0
    new_customers: int = 0
    investment: float = 0


class MetricOut(ORMModel):
    id: int
    campaign_id: int
    date: date
    reach: int
    impressions: int
    clicks: int
    likes: int
    comments: int
    shares: int
    conversions: int
    new_customers: int
    investment: float
    created_at: datetime
    indicators: dict | None = None


class ExpenseCreate(BaseModel):
    campaign_id: int
    description: str = Field(min_length=2, max_length=180)
    amount: float = Field(gt=0)
    date: date
    category: str = "mídia"


class ExpenseOut(ORMModel):
    id: int
    campaign_id: int
    description: str
    amount: float
    date: date
    category: str
    created_at: datetime


class KeywordCreate(BaseModel):
    campaign_id: int
    term: str = Field(min_length=2, max_length=160)
    intent: str = ""
    target_url: str = ""
    notes: str = ""


class KeywordOut(ORMModel):
    id: int
    campaign_id: int
    term: str
    intent: str
    target_url: str
    notes: str
    created_at: datetime


class ExperimentCreate(BaseModel):
    campaign_id: int
    hypothesis: str = Field(min_length=2)
    metric_name: str = ""
    status: str = "ideia"
    learning: str = ""


class ExperimentOut(ORMModel):
    id: int
    campaign_id: int
    hypothesis: str
    metric_name: str
    status: str
    learning: str
    created_at: datetime
