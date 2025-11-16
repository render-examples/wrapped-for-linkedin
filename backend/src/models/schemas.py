from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class EngagementMetrics(BaseModel):
    total_likes: int
    total_comments: int
    total_shares: int
    peak_engagement_time: datetime
    top_performing_posts: List[dict]

class DemographicInsights(BaseModel):
    job_titles: List[dict]
    locations: List[dict]
    industries: List[dict]

class ProcessedFileResponse(BaseModel):
    file_id: str
    metrics: EngagementMetrics
    insights: DemographicInsights