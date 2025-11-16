from fastapi import APIRouter, UploadFile, HTTPException
from ...services.file_service import process_linkedin_file

router = APIRouter()

@router.post("/upload")
async def upload_file(file: UploadFile):
    if not file.filename.endswith(('.xlsx', '.csv')):
        raise HTTPException(status_code=400, detail="File must be Excel or CSV format")

    try:
        result = await process_linkedin_file(file)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))