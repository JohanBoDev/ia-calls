from fastapi import APIRouter

from storage.db_service import get_stats

router = APIRouter(prefix="/api")


@router.get("/stats")
async def api_stats():
    return await get_stats()
