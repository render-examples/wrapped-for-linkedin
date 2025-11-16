from fastapi import APIRouter
from .endpoints import files, analytics

router = APIRouter()

router.include_router(files.router, prefix="/files", tags=["files"])
router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])