from fastapi import APIRouter, HTTPException
from ...services.analytics_service import get_engagement_metrics, get_demographic_insights

router = APIRouter()

@router.get("/engagement/{file_id}")
async def get_engagement(file_id: str):
    try:
        metrics = await get_engagement_metrics(file_id)
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/demographics/{file_id}")
async def get_demographics(file_id: str):
    try:
        insights = await get_demographic_insights(file_id)
        return insights
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))