from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dashboard import build_dashboard
from app.database import get_db
from app.deps import get_current_user
from app.models import User

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

Period = Literal["30d", "90d", "12m", "all"]


def _params(
    period: str,
    client_id: int | None,
    campaign_id: int | None,
    platform_id: int | None,
    start: date | None,
    end: date | None,
    db: Session,
    current_user: User,
):
    return build_dashboard(
        db,
        current_user,
        period=period,
        client_id=client_id,
        campaign_id=campaign_id,
        platform_id=platform_id,
        start=start,
        end=end,
    )


@router.get("")
def dashboard(
    period: Period = "all",
    client_id: int | None = None,
    campaign_id: int | None = None,
    platform_id: int | None = None,
    start: date | None = None,
    end: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _params(period, client_id, campaign_id, platform_id, start, end, db, current_user)


@router.get("/overview")
def dashboard_overview(
    period: Period = "all",
    client_id: int | None = None,
    campaign_id: int | None = None,
    platform_id: int | None = None,
    start: date | None = None,
    end: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _params(period, client_id, campaign_id, platform_id, start, end, db, current_user)["overview"]


@router.get("/evolution")
def dashboard_evolution(
    period: Period = "all",
    client_id: int | None = None,
    campaign_id: int | None = None,
    platform_id: int | None = None,
    start: date | None = None,
    end: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _params(period, client_id, campaign_id, platform_id, start, end, db, current_user)["evolution"]


@router.get("/platforms")
def dashboard_platforms(
    period: Period = "all",
    client_id: int | None = None,
    campaign_id: int | None = None,
    platform_id: int | None = None,
    start: date | None = None,
    end: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _params(period, client_id, campaign_id, platform_id, start, end, db, current_user)["by_platform"]


@router.get("/campaigns")
def dashboard_campaigns(
    period: Period = "all",
    client_id: int | None = None,
    campaign_id: int | None = None,
    platform_id: int | None = None,
    start: date | None = None,
    end: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _params(period, client_id, campaign_id, platform_id, start, end, db, current_user)["by_campaign"]
