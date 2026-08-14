import os
from contextlib import asynccontextmanager
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, Request
# pyrefly: ignore [missing-import]
from fastapi.responses import JSONResponse
# pyrefly: ignore [missing-import]
from fastapi.exceptions import RequestValidationError
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import init_db
from app.routers import boards, tasks

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(title="TaskFlow API", lifespan=lifespan)

FRONTEND_URL = os.environ.get("FRONTEND_URL", "*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL] if FRONTEND_URL != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(ValueError)
async def value_error_handler(_request: Request, exc: ValueError):
    return JSONResponse(
        status_code=400,
        content={"error": str(exc)},
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exc: RequestValidationError):
    errors = exc.errors()
    for error in errors:
        if "ctx" in error and "error" in error["ctx"]:
            error["ctx"]["error"] = str(error["ctx"]["error"])
        
    return JSONResponse(
        status_code=400,
        content={"error": "Validation failed", "detail":errors}
    )

@app.exception_handler(Exception)
async def generic_exception_handler(_request: Request, _exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": "Something went wrong"},
    )

app.include_router(boards.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")

@app.get("/health")
async def health():
    return {"status": "ok"}
