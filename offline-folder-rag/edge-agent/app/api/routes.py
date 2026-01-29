from fastapi import APIRouter, Depends
from app.security.token_guard import verify_token

router = APIRouter(dependencies=[Depends(verify_token)])

@router.get("/health")
async def health():
    return {"status": "ok"}

@router.post("/index")
async def index():
    # Placeholder for indexing logic
    return {"message": "Indexing started"}

@router.post("/ask")
async def ask():
    # Placeholder for RAG query logic
    return {"answer": "This is a placeholder answer"}
