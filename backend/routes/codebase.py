# routes/codebase.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from core.ingestion import run_ingestion
from core.query import execute_rag_query

router = APIRouter(prefix="/api/codebase", tags=["Codebase Operations"])

class QueryRequest(BaseModel):
    question: str

class QueryResponse(BaseModel):
    answer: str
    sources: list[str]

class IngestRequest(BaseModel):
    repo_url: str

@router.post("/ingest")
async def ingest_repository(payload: IngestRequest):
    try:
        repo_name = payload.repo_url if payload.repo_url else "test_repo"
        result = run_ingestion(repo_name)
        return result
    except FileNotFoundError as fnf_err:
        raise HTTPException(status_code=404, detail=str(fnf_err))
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion Error: {str(e)}")
    
@router.post("/query", response_model=QueryResponse)
async def query_repository(payload: QueryRequest):
    try:
        # Delegate the task directly to the service layer
        result = execute_rag_query(payload.question)
        return result
    except FileNotFoundError as fnf_err:
        raise HTTPException(status_code=400, detail=str(fnf_err))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Pipeline Error: {str(e)}")