from fastapi import FastAPI, Header, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from .api.routes import router as api_router
from .security import TOKEN_HEADER, verify_token


def _error_response(error_code: str, message: str, remediation: str, status_code: int) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "error_code": error_code,
            "message": message,
            "remediation": remediation,
        },
    )


def create_app() -> FastAPI:
    app = FastAPI()

    @app.exception_handler(HTTPException)
    async def http_exception_handler(_, exc: HTTPException):
        if isinstance(exc.detail, dict) and "error_code" in exc.detail:
            return _error_response(
                exc.detail["error_code"],
                exc.detail["message"],
                exc.detail["remediation"],
                exc.status_code,
            )
        return _error_response(
            "UNKNOWN_ERROR",
            "Unhandled error.",
            "Retry the request.",
            exc.status_code,
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(_, exc: RequestValidationError):
        return _error_response(
            "INVALID_INPUT",
            f"Validation error: {exc.errors()}",
            "Ensure the request body matches the expected schema.",
            400,
        )

    app.include_router(api_router)

    @app.get("/health")
    async def health(x_local_token: str | None = Header(default=None, alias=TOKEN_HEADER)):
        verify_token(x_local_token)
        return {
            "indexing": False,
            "indexed_files_so_far": 0,
            "estimated_total_files": 0,
            "last_index_completed_epoch_ms": 0,
            "ollama_ok": True,
            "ripgrep_ok": True,
            "chroma_ok": True,
        }

    return app


app = create_app()
